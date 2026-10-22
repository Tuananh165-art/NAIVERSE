"use client";

import { FormEvent, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getAuthErrorMessage } from "@/lib/auth-error";
import { AlertCircle, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";

export function AuthForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createSupabaseBrowserClient();

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (!supabase && mode === "login") { setError(locale === "vi" ? "Hãy cấu hình Supabase theo hướng dẫn trước khi đăng nhập." : "Configure Supabase using the setup guide before signing in."); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        if (!supabase) throw new Error(t("error"));
        if (email.trim().includes("@")) {
          const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (authError) throw authError;
        } else {
          const response = await fetch("/api/auth/username-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: email.trim(), password }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error?.message ?? t("error"));
        }
        router.replace("/trips"); router.refresh();
      } else {
        if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) throw new Error(locale === "vi" ? "Tên đăng nhập cần 3–24 chữ cái không dấu, số hoặc dấu gạch dưới." : "Username must have 3–24 letters, digits or underscores.");
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password, fullName: fullName.trim(), username: username.trim().toLowerCase(), locale }),
        });
        const result = await response.json();
        if (!response.ok) throw result.error ?? new Error(t("error"));
        if (result.session) { router.replace("/trips"); router.refresh(); }
        else setMessage(t("pendingEmail"));
      }
    } catch (authError) { setError(getAuthErrorMessage(authError, locale === "vi" ? "vi" : "en")); }
    finally { setLoading(false); }
  }

  return (
    <form className="auth-panel" onSubmit={submit}>
      <span className="experience-icon" style={{ marginBottom: 18 }}><ShieldCheck size={20} /></span>
      <h1 className="section-title" style={{ fontSize: "1.9rem" }}>{t("title")}</h1>
      <p className="section-description" style={{ fontSize: ".87rem", marginBottom: 16 }}>{t("subtitle")}</p>
      {mode === "register" && <><label className="form-label" htmlFor="full-name">{locale === "vi" ? "Tên hiển thị" : "Display name"}</label><input id="full-name" className="field" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={100} autoComplete="name" required /></>}
      {mode === "register" && <><label className="form-label" htmlFor="auth-username">{locale === "vi" ? "Tên đăng nhập" : "Username"}</label><input id="auth-username" className="field" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={24} autoComplete="username" pattern="[A-Za-z0-9_]{3,24}" required /><p className="form-hint">{locale === "vi" ? "Dùng 3–24 chữ cái không dấu, số hoặc dấu gạch dưới." : "Use 3–24 letters, digits or underscores."}</p></>}
      <label className="form-label" htmlFor="auth-email">{mode === "register" ? t("email") : (locale === "vi" ? "Tên đăng nhập hoặc email" : "Username or email")}</label>
      <input id="auth-email" className="field" type={mode === "register" ? "email" : "text"} value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete={mode === "register" ? "email" : "username"} required />
      <label className="form-label" htmlFor="auth-password">{t("password")}</label>
      <span style={{ display: "flex", position: "relative" }}><input id="auth-password" className="field" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} required /><button type="button" className="button button-quiet" aria-label={showPassword ? (locale === "vi" ? "Ẩn mật khẩu" : "Hide password") : (locale === "vi" ? "Hiện mật khẩu" : "Show password")} onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 2, top: 2, minHeight: 39 }} tabIndex={0}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
      {mode === "register" && <p className="form-hint">{locale === "vi" ? "Mật khẩu cần ít nhất 10 ký tự." : "Use at least 10 characters for your password."}</p>}
      {error && <p className="alert alert-red" role="alert" style={{ marginTop: 14 }}><AlertCircle size={17} />{error}</p>}
      {message && <p className="alert" role="status" style={{ marginTop: 14 }}>{message}</p>}
      <button className="button button-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: 19 }}>{loading && <LoaderCircle size={16} className="animate-spin" />}{mode === "login" ? t("login") : t("register")}</button>
      <button className="button button-quiet" type="button" disabled={loading} style={{ width: "100%", marginTop: 9 }} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }}>{mode === "login" ? t("register") : t("login")}</button>
      {mode === "login" && <Link className="text-link" style={{ justifyContent: "center", marginTop: 8 }} href="/auth/reset">{t("forgot")}</Link>}
      <p className="form-hint" style={{ marginTop: 17, textAlign: "center" }}>{locale === "vi" ? "Không dùng chung tài khoản demo. Hãy tạo tài khoản riêng; email thật chỉ chia sẻ khi bạn gửi yêu cầu cho doanh nghiệp. Đăng nhập bằng tên đăng nhập hoặc email." : "Do not share demo accounts. Create your own account; your email is shared with a business only when you submit an inquiry. Sign in with your username or email."}</p>
    </form>
  );
}
