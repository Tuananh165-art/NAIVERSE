import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { AdminDashboard } from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(await getCurrentUser())) return redirect({ href: "/auth", locale });
  return <AdminDashboard />;
}
