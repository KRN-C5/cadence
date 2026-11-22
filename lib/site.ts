export const NAV = [
  { label: "The film", href: "#film" },
  { label: "Movement", href: "#movement" },
  { label: "Mechanism", href: "#mechanism" },
  { label: "Sizes", href: "#sizes" },
];

export const CAPTIONS = [
  { n: "01", title: "Boredom", line: "Some afternoons, nothing happens." },
  { n: "02", title: "Discovery", line: "Then something rolls." },
  { n: "03", title: "Play", line: "It notices. It nudges." },
  { n: "04", title: "Reward", line: "One portion. Right on time." },
];

export const SIZES = [
  {
    id: "S",
    name: "Small",
    body: "12 × 7 cm",
    pockets: "12 small pockets",
    audience: "Toy breeds",
    scale: 0.62,
    weight: "—",
  },
  {
    id: "M",
    name: "Medium",
    body: "18 × 10 cm",
    pockets: "24 pockets",
    audience: "Medium dogs",
    scale: 0.82,
    weight: "—",
  },
  {
    id: "L",
    name: "Large",
    body: "24 × 13 cm",
    pockets: "24 larger pockets",
    audience: "Large dogs",
    scale: 1,
    weight: "—",
  },
] as const;

export type SizeId = (typeof SIZES)[number]["id"];

export const PARTS = [
  { id: "shell", name: "Outer shell", note: "Soft-touch TPE, ribbed for grip." },
  { id: "rings", name: "Pocket rings", note: "Two rings hold the day's portions." },
  { id: "cartridge", name: "Cartridge", note: "The sealed heart of the toy." },
  { id: "spring", name: "Mainspring", note: "Stores the energy of every roll." },
  { id: "rotor", name: "Rotor weight", note: "Swings with the toy and winds the spring." },
  { id: "clutch", name: "One-way clutch", note: "Turns motion one direction only." },
  { id: "governor", name: "Governor", note: "Keeps the release slow and steady." },
  { id: "magnet", name: "Magnet ring", note: "Passes motion through the wall, no seal to break." },
  { id: "caps", name: "End caps", note: "Charcoal, rounded, twist-lock fill." },
  { id: "window", name: "Power window", note: "A watch-style glance at the spring's reserve." },
] as const;

export type PartId = (typeof PARTS)[number]["id"];

export const FEATURES = [
  {
    icon: "rotate",
    title: "Self-winding",
    body: "The rotor swings as the toy rolls, storing a little energy with every nudge.",
  },
  {
    icon: "timer",
    title: "Paced release",
    body: "A governor slows the carousel. One portion every 10–15 minutes is the design target.",
  },
  {
    icon: "gauge",
    title: "Power window",
    body: "A watch-style dial shows how wound the spring is, so you can see it working.",
  },
  {
    icon: "grip",
    title: "Soft-touch shell",
    body: "Ribbed TPE that is easy to roll, easy to grip, and kind to a wet nose.",
  },
  {
    icon: "lock",
    title: "Twist-lock fill",
    body: "One turn opens the pocket rings. Dry kibble or small treats only.",
  },
  {
    icon: "seal",
    title: "Sealed cartridge",
    body: "A magnetic coupling passes motion through the wall, so the mechanism stays clean.",
  },
] as const;

export const SAFETY = [
  "Dry kibble or small treats only.",
  "Supervise play. Not a chew toy.",
  "Retire the toy if it becomes damaged.",
  "Design concept — specifications are targets pending prototype validation.",
];
