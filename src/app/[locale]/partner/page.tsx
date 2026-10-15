import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { PartnerDashboard } from "@/components/partner-dashboard";

export const dynamic = "force-dynamic";

export default async function PartnerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(await getCurrentUser())) redirect({ href: "/auth", locale });
  return <PartnerDashboard />;
}
