import { getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { InquiryForm } from "@/components/inquiry-form";

export const dynamic = "force-dynamic";

export default async function InquiryPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ trip?: string }> }) {
  const [{ locale }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!user) return redirect({ href: "/auth", locale });
  return <InquiryForm tripId={query.trip ?? ""} email={user.email ?? ""} />;
}
