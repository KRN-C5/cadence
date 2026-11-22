export const SIZES = ["S", "M", "L"] as const;
export type SizeId = (typeof SIZES)[number];

export type OrderInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  size: SizeId;
  quantity: number;
  notes: string;
};

export type OrderErrors = Partial<Record<keyof OrderInput | "form", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const clean = (v: unknown, max = 400) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export function validateOrder(
  raw: unknown,
):
  | { ok: true; value: OrderInput }
  | { ok: false; errors: OrderErrors } {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: OrderErrors = {};

  const name = clean(body.name, 90);
  const email = clean(body.email, 160);
  const phone = clean(body.phone, 40);
  const address = clean(body.address, 240);
  const city = clean(body.city, 90);
  const state = clean(body.state, 90);
  const pin = clean(body.pin, 16);
  const notes = clean(body.notes, 600);
  const sizeRaw = clean(body.size, 2).toUpperCase();
  const quantity = Math.round(Number(body.quantity ?? 1));

  if (name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address.";
  if (phone && phone.replace(/[^\d]/g, "").length < 7)
    errors.phone = "Please enter a valid phone number.";
  if (address.length < 5) errors.address = "Please enter a delivery address.";
  if (city.length < 2) errors.city = "Please enter a city.";
  if (state.length < 2) errors.state = "Please enter a state or region.";
  if (pin.length < 4) errors.pin = "Please enter a valid postal code.";
  if (!SIZES.includes(sizeRaw as SizeId)) errors.size = "Choose a size.";
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 10)
    errors.quantity = "Choose between 1 and 10.";

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      address,
      city,
      state,
      pin,
      size: sizeRaw as SizeId,
      quantity,
      notes,
    },
  };
}

export function makeOrderId() {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const code = Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 6)
    .toUpperCase();
  return `CAD-${code}`;
}

export const FIELD_NAMES = [
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "pin",
  "size",
  "quantity",
  "notes",
] as const;
