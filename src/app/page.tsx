import { redirect } from "next/navigation";

/** Keep the unprefixed entry URL usable when the locale proxy is bypassed. */
export default function RootPage() {
  redirect("/vi");
}
