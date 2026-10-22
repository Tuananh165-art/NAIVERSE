type AuthLocale = "en" | "vi";

type SupabaseAuthError = {
  code?: string;
  status?: number;
  message?: string;
};

export function getAuthErrorMessage(error: unknown, locale: AuthLocale): string {
  const authError = (error && typeof error === "object" ? error : {}) as SupabaseAuthError;
  const code = authError.code?.toLowerCase() ?? "";
  const message = authError.message?.toLowerCase() ?? "";

  if (
    authError.status === 429 ||
    /rate.?limit|too many requests|over_email_send_rate_limit|over_request_rate_limit/.test(`${code} ${message}`)
  ) {
    return locale === "vi"
      ? "Supabase đang giới hạn số lần đăng ký hoặc gửi email. Hãy đợi một lúc rồi thử lại; nếu vẫn lỗi, cần kiểm tra giới hạn Auth và cấu hình SMTP trong Supabase."
      : "Supabase is limiting sign-up or email requests. Wait a while and try again; if it continues, check Supabase Auth rate limits and SMTP settings.";
  }

  if (/weak_password|password.*(weak|short)/.test(`${code} ${message}`)) {
    return locale === "vi"
      ? "Mật khẩu chưa đạt yêu cầu. Hãy dùng mật khẩu dài và an toàn hơn."
      : "This password does not meet the requirements. Choose a longer, stronger password.";
  }

  if (/email_exists|user_already_exists/.test(code)) {
    return locale === "vi"
      ? "Email này đã có tài khoản. Hãy đăng nhập hoặc dùng chức năng quên mật khẩu."
      : "An account already uses this email. Sign in or reset its password.";
  }

  if (/email_not_confirmed/.test(code)) {
    return locale === "vi"
      ? "Email chưa được xác nhận. Hãy mở thư xác nhận trước khi đăng nhập."
      : "This email is not confirmed yet. Open the confirmation email before signing in.";
  }

  if (/fetch|network|failed to fetch/.test(`${code} ${message}`)) {
    return locale === "vi"
      ? "Không kết nối được với dịch vụ đăng nhập. Hãy kiểm tra mạng rồi thử lại."
      : "Could not reach the authentication service. Check your connection and try again.";
  }

  return locale === "vi"
    ? "Không thể xác thực. Hãy kiểm tra thông tin đăng nhập và thử lại."
    : "Unable to authenticate. Check your sign-in details and try again.";
}
