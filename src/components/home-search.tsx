"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";

export function HomeSearch() {
  const t = useTranslations("home");
  const router = useRouter();
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    router.push(`/journey?prompt=${encodeURIComponent(query.trim())}`);
  }
  return (
    <form className="search-box" onSubmit={submit}>
      <label className="sr-only" htmlFor="home-search">{t("searchLabel")}</label>
      <textarea id="home-search" rows={1} value={query} maxLength={1200} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} required minLength={12} />
      <button className="button button-primary" type="submit"><Sparkles size={16} />{t("searchAction")}<ArrowRight size={16} /></button>
    </form>
  );
}
