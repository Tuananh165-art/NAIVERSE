import { getCurrentUser } from "@/lib/supabase/server";
import { getPlaceCatalog } from "@/lib/catalog-server";
import { JourneyStudio } from "@/components/journey-studio";

export const dynamic = "force-dynamic";

export default async function JourneyPage({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const query = await searchParams;
  const [catalog, user] = await Promise.all([getPlaceCatalog(), getCurrentUser()]);
  return <JourneyStudio key={query.prompt ?? ""} initialPrompt={query.prompt ?? ""} places={catalog} signedIn={Boolean(user)} />;
}
