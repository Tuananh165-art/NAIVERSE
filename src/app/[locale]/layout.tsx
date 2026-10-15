import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "NaiVerse — Khám phá Đồng Nai", template: "%s · NaiVerse" },
  description: "Khám phá thiên nhiên, di sản và ẩm thực Đồng Nai; lên lịch trình với nguồn và chi phí minh bạch.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "vi" | "en")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <div lang={locale}>
      <NextIntlClientProvider messages={messages}>
        <div className="page-shell"><SiteHeader /><main>{children}</main><SiteFooter /></div>
      </NextIntlClientProvider>
    </div>
  );
}
