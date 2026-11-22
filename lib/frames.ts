export const FRAME_COUNT = 151;

export const frameSrc = (index: number) =>
  `/assets/film/frame-${String(index).padStart(3, "0")}.webp`;

type Store = {
  images: (HTMLImageElement | null)[];
  started: boolean;
  listeners: Set<() => void>;
};

const store: Store = {
  images: new Array(FRAME_COUNT).fill(null),
  started: false,
  listeners: new Set(),
};

export function subscribeFrames(fn: () => void) {
  store.listeners.add(fn);
  return () => {
    store.listeners.delete(fn);
  };
}

export function getFrame(index: number) {
  return store.images[index] ?? null;
}

/** Nearest already-decoded frame at or before `index`. */
export function getNearestFrame(index: number) {
  for (let i = Math.min(index, FRAME_COUNT - 1); i >= 0; i--) {
    const img = store.images[i];
    if (img) return img;
  }
  return null;
}

let queue: number[] = [];
let active = 0;
const CONCURRENCY = 6;

function pump() {
  while (active < CONCURRENCY && queue.length) {
    const index = queue.shift()!;
    if (store.images[index]) {
      pump();
      return;
    }
    active++;
    const img = new Image();
    img.decoding = "async";
    img.src = frameSrc(index + 1);
    const done = () => {
      active--;
      store.images[index] = img;
      store.listeners.forEach((fn) => fn());
      pump();
    };
    img.onload = done;
    img.onerror = done;
  }
}

export function loadFrames(from: number, to: number) {
  for (let i = from; i < to; i++) {
    if (!store.images[i] && !queue.includes(i)) queue.push(i);
  }
  queue.sort((a, b) => a - b);
  pump();
}

/** Load the whole sequence, nearest-first from `focus`. */
export function loadAllFrames(focus = 0) {
  if (store.started) return;
  store.started = true;
  const order: number[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) order.push(i);
  order.sort((a, b) => Math.abs(a - focus) - Math.abs(b - focus));
  queue = order;
  pump();
}

export function framesReady() {
  return store.images.filter(Boolean).length;
}
