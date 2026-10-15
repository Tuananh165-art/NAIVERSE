"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function PasswordResetForm({ locale, title }: { locale: string; title: string }) {
  const en = locale === "en";
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const supabase = createSupabaseBrowserClient();
  async function sendLink(event: FormEvent) {
    event.preventDefault(); setMessage(""); setError("");
    if (!supabase) { setError(en ? "Configure Supabase before requesting a reset link." : "Hãy cấu hình Supabase trước khi yêu cầu liên kết đặt lại."); return; }
    setBusy(true);
    const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/" + locale + "/auth/reset" });
    setBusy(false);
    if (result.error) setError(en ? "The reset link could not be sent. Check Supabase email configuration." : "Không gửi được liên kết đặt lại. Hãy kiểm tra cấu hình email của Supabase.");
    else setMessage(en ? "If this email belongs to an account, Supabase will send a reset link." : "Nếu email thuộc một tài khoản, Supabase sẽ gửi liên kết đặt lại.");
  }
  async function updatePassword(event: FormEvent) {
    event.preventDefault(); setMessage(""); setError("");
    if (!supabase) { setError(en ? "Configure Supabase first." : "Hãy cấu hình Supabase trước."); return; }
    setBusy(true); const result = await supabase.auth.updateUser({ password }); setBusy(false);
    if (result.error) setError(en ? "Open the recovery link from your email first, then try again." : "Hãy mở liên kết khôi phục trong email trước, sau đó thử lại.");
    else { setPassword(""); setMessage(en ? "Password updated. Return to sign in." : "Đã đổi mật khẩu. Quay lại để đăng nhập."); }
  }
  return <section className="auth-panel"><h1 className="section-title" style={{ fontSize: "1.8rem" }}>{title}</h1><p className="section-description">{en ? "Request a reset email, then open its link on this site and set a new password." : "Yêu cầu email khôi phục, sau đó mở liên kết trên website này và đặt mật khẩu mới."}</p><form onSubmit={sendLink}><label className="form-label" htmlFor="reset-email">Email</label><input id="reset-email" type="email" className="field" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required/><button className="button button-secondary" style={{ width: "100%", marginTop: 12 }} disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={16}/>} {en ? "Send reset link" : "Gửi liên kết khôi phục"}</button></form><form onSubmit={updatePassword} style={{ marginTop: 22 }}><label className="form-label" htmlFor="new-password">{en ? "New password" : "Mật khẩu mới"}</label><input id="new-password" type="password" className="field" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} autoComplete="new-password" required/><button className="button button-primary" style={{ width: "100%", marginTop: 12 }} disabled={busy}>{en ? "Update password" : "Đổi mật khẩu"}</button></form>{error && <div role="alert" className="alert alert-red" style={{ marginTop: 14 }}><AlertCircle size={16}/>{error}</div>}{message && <div role="status" className="alert" style={{ marginTop: 14 }}><Check size={16}/>{message}</div>}</section>;
}
