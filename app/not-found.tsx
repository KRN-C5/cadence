import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
        404 — Off the roll
      </p>
      <h1 className="display mt-6 text-[clamp(44px,8vw,96px)] leading-[0.95]">
        Nothing here
        <br />
        yet.
      </h1>
      <p className="mt-5 max-w-[36ch] text-[14px] leading-relaxed text-muted">
        The page you were looking for has rolled away. The roller itself is still
        where it should be.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to Cadence
      </Link>
    </main>
  );
}
