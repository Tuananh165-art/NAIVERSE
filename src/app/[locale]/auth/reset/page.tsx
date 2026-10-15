import { getTranslations } from "next-intl/server";
import { PasswordResetForm } from "@/components/password-reset-form";

export const dynamic = "force-dynamic";

export default async function PasswordResetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("auth");
  return <div className="container section"><PasswordResetForm locale={locale} title={t("forgot")} /></div>;
}
