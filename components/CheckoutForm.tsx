"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Minus, Plus } from "lucide-react";
import {
  SIZES,
  validateOrder,
  type OrderErrors,
  type SizeId,
} from "@/lib/order";

const SIZE_META: Record<SizeId, { name: string; dims: string }> = {
  S: { name: "Small", dims: "12 × 7 cm" },
  M: { name: "Medium", dims: "18 × 10 cm" },
  L: { name: "Large", dims: "24 × 13 cm" },
};

type Values = {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  state: string;
  pin: string;
  size: SizeId;
  quantity: number;
  notes: string;
};

const EMPTY: Values = {
  name: "",
  email: "",
  phone: "",
  address: "",
  country: "India",
  city: "",
  state: "",
  pin: "",
  size: "M",
  quantity: 1,
  notes: "",
};

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
  className = "",
}: {
  label: string;
  name: keyof Values;
  value: string;
  onChange: (name: keyof Values, value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      <input
        className="field"
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error ? (
        <span id={`${name}-error`} className="mt-1.5 block text-[11px] text-orange-deep">
          {error}
        </span>
      ) : null}
    </label>
  );
}

/* ------------------------------ searchable select ------------------------------ */

type Opt = { id: string; label: string };
type Csc = typeof import("country-state-city");

function Combobox({
  label,
  name,
  value,
  options,
  onSelect,
  placeholder,
  disabled,
  error,
  allowCustom,
  className = "",
}: {
  label: string;
  name: string;
  value: string;
  options: Opt[];
  onSelect: (o: Opt) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  allowCustom?: boolean;
  className?: string;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const q = query.trim().toLowerCase();
  const rows = useMemo(() => {
    let found: Opt[];
    if (!q) found = options;
    else {
      const starts: Opt[] = [];
      const has: Opt[] = [];
      for (const o of options) {
        const l = o.label.toLowerCase();
        if (l.startsWith(q)) starts.push(o);
        else if (l.includes(q)) has.push(o);
      }
      found = [...starts, ...has];
    }
    const shown = found.slice(0, 100);
    const exact = options.some((o) => o.label.toLowerCase() === q);
    if (allowCustom && q && !exact) shown.push({ id: "__custom", label: query.trim() });
    return shown;
  }, [options, q, query, allowCustom]);

  useEffect(() => {
    if (!open) return;
    (list.current?.children[active] as HTMLElement | undefined)?.scrollIntoView({
      block: "nearest",
    });
  }, [active, open]);

  const pick = (o: Opt) => {
    onSelect(o.id === "__custom" ? { id: "", label: o.label } : o);
    setOpen(false);
    setQuery("");
  };

  const commit = () => {
    const t = query.trim();
    if (open && allowCustom && t) {
      const m = options.find((o) => o.label.toLowerCase() === t.toLowerCase());
      onSelect(m ?? { id: "", label: t });
    }
    setOpen(false);
    setQuery("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      if (rows[active]) pick(rows[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={uid} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={uid}
          name={name}
          className={`field pr-8 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : value}
          placeholder={open && value ? value : placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery("");
            setActive(0);
          }}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onBlur={commit}
          onKeyDown={onKey}
        />
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {open && !disabled ? (
        <ul
          ref={list}
          id={`${uid}-list`}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-auto border border-line bg-paper py-1 shadow-[0_14px_34px_-14px_rgba(0,0,0,0.3)]"
        >
          {rows.length === 0 ? (
            <li className="px-3 py-2.5 text-[12px] text-muted">No matches</li>
          ) : (
            rows.map((o, i) => (
              <li
                key={`${o.id}-${i}`}
                role="option"
                aria-selected={o.label === value}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-[13px] ${
                  i === active ? "bg-paper-2" : ""
                }`}
              >
                <span className="truncate">
                  {o.id === "__custom" ? `Use “${o.label}”` : o.label}
                </span>
                {o.label === value ? (
                  <Check size={13} strokeWidth={1.8} className="shrink-0 text-orange" />
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {error ? <span className="mt-1.5 block text-[11px] text-orange-deep">{error}</span> : null}
    </div>
  );
}

export function CheckoutForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<OrderErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const top = useRef<HTMLDivElement>(null);

  // country / state / city data loads on demand so it never slows the first paint
  const [csc, setCsc] = useState<Csc | null>(null);
  const [geo, setGeo] = useState({ country: "IN", state: "" });
  const [countryError, setCountryError] = useState("");

  useEffect(() => {
    let live = true;
    import("country-state-city").then((m) => {
      if (live) setCsc(m);
    });
    return () => {
      live = false;
    };
  }, []);

  const countries = useMemo(() => (csc ? csc.Country.getAllCountries() : []), [csc]);
  const states = useMemo(
    () => (csc && geo.country ? csc.State.getStatesOfCountry(geo.country) : []),
    [csc, geo.country],
  );
  const cities = useMemo(() => {
    if (!csc || !geo.country) return [];
    let list: { name: string }[] = [];
    if (geo.state) list = csc.City.getCitiesOfState(geo.country, geo.state) ?? [];
    else if (states.length === 0) list = csc.City.getCitiesOfCountry(geo.country) ?? [];
    return Array.from(new Set(list.map((c) => c.name))).sort((a, b) => a.localeCompare(b));
  }, [csc, geo.country, geo.state, states.length]);

  const countryOpts = useMemo<Opt[]>(
    () => countries.map((c) => ({ id: c.isoCode, label: c.name })),
    [countries],
  );
  const stateOpts = useMemo<Opt[]>(
    () => states.map((x) => ({ id: x.isoCode, label: x.name })),
    [states],
  );
  const cityOpts = useMemo<Opt[]>(() => cities.map((n) => ({ id: n, label: n })), [cities]);
  const dial = countries.find((c) => c.isoCode === geo.country)?.phonecode;

  const pickCountry = (o: Opt) => {
    setGeo({ country: o.id, state: "" });
    setValues((v) => ({ ...v, country: o.label, state: "", city: "" }));
    setCountryError("");
    setErrors((e) => ({ ...e, state: undefined, city: undefined, form: undefined }));
  };
  const pickState = (o: Opt) => {
    setGeo((g) => ({ ...g, state: o.id }));
    setValues((v) => ({ ...v, state: o.label, city: "" }));
    setErrors((e) => ({ ...e, state: undefined, city: undefined, form: undefined }));
  };
  const pickCity = (o: Opt) => update("city", o.label);

  useEffect(() => {
    const size = new URLSearchParams(window.location.search).get("size");
    if (size && (SIZES as readonly string[]).includes(size.toUpperCase())) {
      setValues((v) => ({ ...v, size: size.toUpperCase() as SizeId }));
    }
  }, []);

  const update = (name: keyof Values, value: string | number) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined, form: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    if (!values.country.trim()) {
      setCountryError("Choose your country.");
      document.querySelector<HTMLElement>('[name="country"]')?.focus();
      return;
    }

    const check = validateOrder(values);
    if (!check.ok) {
      setErrors(check.errors);
      const first = Object.keys(check.errors)[0];
      const el = document.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.focus();
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: "" }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data?.errors) setErrors(data.errors);
        setMessage(data?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setOrderId(data.orderId);
      setMessage(data.message ?? "");
      setStatus("done");
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  return (
    <div ref={top} className="min-h-[100svh] bg-paper">
      <header className="border-b border-line">
        <div className="container-x flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="display text-[26px] leading-none">Cadence</span>
            <span className="hidden text-[9px] uppercase tracking-[0.22em] text-muted sm:block">
              Self-winding treat roller
            </span>
          </Link>
          <Link
            href="/"
            className="link-underline flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted"
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Back to the film
          </Link>
        </div>
      </header>

      <div className="container-x py-12 lg:py-20">
        {status === "done" ? (
          <div className="mx-auto max-w-[640px] py-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-orange/30 bg-orange/5 text-orange">
              <Check size={22} strokeWidth={1.6} />
            </div>
            <p className="mt-8 text-[10px] uppercase tracking-[0.24em] text-muted">
              Reservation received
            </p>
            <h1 className="display mt-4 text-[clamp(38px,6vw,64px)] leading-[1]">
              Thank you — it&apos;s noted.
            </h1>
            <p className="mx-auto mt-5 max-w-[44ch] text-[14px] leading-relaxed text-muted">
              {message}
            </p>

            <div className="mx-auto mt-8 max-w-[420px] border-y border-line py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  Order reference
                </span>
                <span className="font-mono text-[15px] tracking-[0.08em] text-ink">
                  {orderId}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  Size
                </span>
                <span className="text-[13px] text-ink">
                  {SIZE_META[values.size].name} · {values.quantity}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-6">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  Delivering to
                </span>
                <span className="text-right text-[13px] text-ink">
                  {[values.city, values.state, values.country].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>

            <Link href="/" className="btn btn-ghost mt-10">
              Return to the site
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted">
                <span className="h-1 w-1 rounded-full bg-orange" />
                Reserve the first run
              </p>
              <h1 className="display mt-5 text-[clamp(40px,6vw,72px)] leading-[0.95]">
                Place your order.
              </h1>
              <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-muted">
                No payment today. We&apos;ll email you when the first run is
                ready, and confirm sizing with you before anything ships.
              </p>

              <form onSubmit={submit} noValidate className="mt-10">
                <div className="flex items-baseline justify-between border-b border-line pb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink">
                    01 — Who
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    Required
                  </span>
                </div>

                <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    name="name"
                    value={values.name}
                    onChange={update}
                    error={errors.name}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={update}
                    error={errors.email}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                  <Field
                    label="Phone (optional)"
                    name="phone"
                    type="tel"
                    value={values.phone}
                    onChange={update}
                    error={errors.phone}
                    autoComplete="tel"
                    placeholder={dial ? `+${String(dial).replace(/^\+/, "")}` : "+91"}
                  />
                </div>

                <div className="mt-10 flex items-baseline justify-between border-b border-line pb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink">
                    02 — Where
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    Delivery
                  </span>
                </div>

                <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-6">
                  <Field
                    label="Address"
                    name="address"
                    value={values.address}
                    onChange={update}
                    error={errors.address}
                    autoComplete="street-address"
                    placeholder="House, street, area"
                    className="sm:col-span-6"
                  />
                  <Combobox
                    label="Country"
                    name="country"
                    value={values.country}
                    options={countryOpts}
                    onSelect={pickCountry}
                    placeholder={csc ? "Search country" : "Loading…"}
                    error={countryError || (errors as Record<string, string | undefined>).country}
                    className="sm:col-span-3"
                  />
                  <Combobox
                    label="State / region"
                    name="state"
                    value={values.state}
                    options={stateOpts}
                    onSelect={pickState}
                    placeholder={
                      !values.country
                        ? "Select country first"
                        : states.length === 0 && csc
                          ? "Type your state / region"
                          : "Search state"
                    }
                    disabled={!values.country}
                    allowCustom={states.length === 0}
                    error={errors.state}
                    className="sm:col-span-3"
                  />
                  <Combobox
                    label="City"
                    name="city"
                    value={values.city}
                    options={cityOpts}
                    onSelect={pickCity}
                    placeholder={
                      !values.country
                        ? "Select country first"
                        : states.length > 0 && !values.state
                          ? "Select state first"
                          : "Search city"
                    }
                    disabled={!values.country || (states.length > 0 && !values.state)}
                    allowCustom
                    error={errors.city}
                    className="sm:col-span-3"
                  />
                  <Field
                    label="PIN / postal code"
                    name="pin"
                    value={values.pin}
                    onChange={update}
                    error={errors.pin}
                    autoComplete="postal-code"
                    className="sm:col-span-3"
                  />
                </div>

                <div className="mt-10 flex items-baseline justify-between border-b border-line pb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink">
                    03 — Which
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    Design targets
                  </span>
                </div>

                <div className="mt-5 grid gap-6 sm:grid-cols-3">
                  {SIZES.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => update("size", id)}
                      className={`border p-4 text-left transition-colors ${
                        values.size === id
                          ? "border-ink bg-ink text-paper"
                          : "border-line text-ink hover:border-ink/40"
                      }`}
                      aria-pressed={values.size === id}
                    >
                      <span className="flex items-baseline justify-between">
                        <span className="display text-[24px] leading-none">
                          {SIZE_META[id].name}
                        </span>
                        <span
                          className={`font-mono text-[9px] ${
                            values.size === id ? "text-paper/50" : "text-muted"
                          }`}
                        >
                          {id}
                        </span>
                      </span>
                      <span
                        className={`mt-2 block text-[11px] ${
                          values.size === id ? "text-paper/60" : "text-muted"
                        }`}
                      >
                        {SIZE_META[id].dims}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.size ? (
                  <p className="mt-2 text-[11px] text-orange-deep">{errors.size}</p>
                ) : null}

                <div className="mt-8 flex items-center justify-between gap-6">
                  <div>
                    <span className="label">Quantity</span>
                    <div className="mt-2 flex items-center border border-line">
                      <button
                        type="button"
                        onClick={() => update("quantity", Math.max(1, values.quantity - 1))}
                        className="grid h-10 w-10 place-items-center text-muted transition-colors hover:text-ink"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} strokeWidth={1.5} />
                      </button>
                      <span className="w-10 text-center font-mono text-[13px] tabular-nums">
                        {values.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => update("quantity", Math.min(10, values.quantity + 1))}
                        className="grid h-10 w-10 place-items-center text-muted transition-colors hover:text-ink"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  <p className="max-w-[30ch] text-right text-[11px] leading-relaxed text-muted">
                    A reservation, not a payment. Nothing is charged today.
                  </p>
                </div>

                <div className="mt-10 flex items-baseline justify-between border-b border-line pb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ink">
                    04 — Anything else
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                    Optional
                  </span>
                </div>
                <label className="mt-5 block">
                  <span className="label">Notes</span>
                  <textarea
                    className="field min-h-[80px] resize-y"
                    name="notes"
                    value={values.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Your dog's breed, treat size, or anything we should know."
                    maxLength={600}
                  />
                </label>

                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  aria-hidden
                />

                <div aria-live="polite">
                  {message && status === "error" ? (
                    <p className="mt-6 border border-orange/30 bg-orange/5 p-3 text-[12px] text-orange-deep">
                      {message}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn btn-primary group mt-8 w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto"
                >
                  {status === "sending" ? "Sending…" : "Place reservation"}
                  {status === "sending" ? null : (
                    <ArrowUpRight
                      size={16}
                      strokeWidth={1.6}
                      className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  )}
                </button>

                <p className="mt-4 max-w-[52ch] text-[11px] leading-relaxed text-muted/80">
                  By reserving you agree to be emailed about the first run. No
                  payment is taken. This is a design concept; specifications are
                  targets pending prototype validation.
                </p>
              </form>
            </div>

            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-8">
                <div className="border border-line bg-paper-2">
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src="/assets/plates/plate-01.webp"
                      alt="Cadence self-winding treat roller"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-orange">
                      Reservation
                    </p>
                    <h2 className="display mt-2 text-[28px] leading-none">
                      Self-winding treat roller
                    </h2>
                    <p className="mt-1 text-[11px] text-muted">
                      Concept study · No batteries
                    </p>

                    <dl className="mt-6 divide-y divide-line border-y border-line">
                      <div className="flex items-baseline justify-between py-3">
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
                          Size
                        </dt>
                        <dd className="text-[13px]">
                          {SIZE_META[values.size].name} · {SIZE_META[values.size].dims}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between py-3">
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
                          Quantity
                        </dt>
                        <dd className="text-[13px]">{values.quantity}</dd>
                      </div>
                      <div className="flex items-baseline justify-between py-3">
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
                          Due today
                        </dt>
                        <dd className="text-[13px]">Nothing</dd>
                      </div>
                    </dl>

                    <p className="mt-5 text-[11px] leading-relaxed text-muted">
                      We&apos;ll write to you before the first run ships. Sizes
                      and release timings are design targets, not tested numbers.
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-muted/70">
                  Questions? Reply to the confirmation email.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
