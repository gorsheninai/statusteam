import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TicketsSection from "@/sections/tickets/TicketsSection";

export const metadata: Metadata = {
  title: "Контрольная покупка — STATUS TEAM",
  robots: { index: false, follow: false },
};

export default function ControlPurchasePage() {
  if (process.env.STATUS_CONTROL_PURCHASE_BUILD !== "1") notFound();
  return (
    <main id="statusteam" style={{ paddingTop: "100px" }}>
      <p className="shell">Контрольная покупка. ЮKassa спишет 1 ₽ с банковской карты.</p>
      <TicketsSection control />
    </main>
  );
}
