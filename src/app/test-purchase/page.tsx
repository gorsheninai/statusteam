import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TicketsSection from "@/sections/tickets/TicketsSection";

export const metadata: Metadata = { title: "Тестовая покупка — STATUS TEAM", robots: { index: false, follow: false } };

export default function TestPurchasePage() {
  if (process.env.STATUS_TEST_PURCHASE_BUILD !== "1") notFound();
  return (
    <main id="statusteam" style={{ paddingTop: "100px" }}>
      <p className="shell">Тестовая оплата ЮKassa. Введите вымышленные имя и телефон и email, на котором сможете проверить письмо.</p>
      <TicketsSection test />
    </main>
  );
}
