"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const english = locale === "en";

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError(english ? "Authentication is not configured." : "Chưa cấu hình dịch vụ đăng nhập.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      router.replace("/");
      router.refresh();
    } catch {
      setError(english ? "Could not sign out. Please retry." : "Đăng xuất chưa thành công. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return <span className="sign-out-action">
    <button type="button" className="button button-quiet" onClick={() => void signOut()} disabled={busy}>
      <LogOut size={15}/>{busy ? (english ? "Signing out…" : "Đang đăng xuất…") : (english ? "Sign out" : "Đăng xuất")}
    </button>
    {error && <span className="form-hint" role="alert">{error}</span>}
  </span>;
}
