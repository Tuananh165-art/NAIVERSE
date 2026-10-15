"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const target = locale === "vi" ? "en" : "vi";
  return (
    <button className="locale-link" type="button" aria-label={target === "en" ? "EN — Switch to English" : "VI — Chuyển sang tiếng Việt"} onClick={() => router.push(pathname.replace(/^\/(vi|en)(?=\/|$)/, `/${target}`))}>
      {target === "en" ? "EN" : "VI"}
    </button>
  );
}
