import { getCurrentUser } from "@/lib/supabase/server";
import { TripsDashboard } from "@/components/trips-dashboard";
import { redirect } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function TripsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(await getCurrentUser())) redirect({ href: "/auth", locale });
  return <TripsDashboard />;
}
