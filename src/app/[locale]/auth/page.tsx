import { redirect } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function AuthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (await getCurrentUser()) redirect({ href: "/trips", locale });
  return <div className="container section"><AuthForm /></div>;
}
