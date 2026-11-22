import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Reserve — Cadence",
  description:
    "Reserve the first run of the Cadence self-winding treat roller. No payment today.",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
