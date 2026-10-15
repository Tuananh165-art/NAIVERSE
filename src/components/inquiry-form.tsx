"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { AlertCircle, Check, Send } from "lucide-react";
import { Link } from "@/i18n/routing";

const demoRecipient = "NaiVerse Demo Travel Desk (DEMO)";
export function InquiryForm({ tripId, email }: { tripId: string; email: string }) {
  const locale = useLocale(); const en = locale === "en";
  const [name, setName] = useState(""); const [contact, setContact] = useState(email); const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, contactName: name, contactEmail: contact, message, consent }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error?.message ?? (en ? "Request could not be sent." : "Không gửi được yêu cầu."));
      setSuccess(en ? "Request sent to the demo travel desk. This is not a booking." : "Đã gửi yêu cầu tới bộ phận tư vấn DEMO. Đây không phải là xác nhận đặt chỗ.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed."); }
    finally { setLoading(false); }
  }
  if (!tripId) return <div className="container section"><h1 className="page-title">{en ? "Choose a saved trip first" : "Hãy chọn hành trình đã lưu"}</h1><Link className="button button-primary" href="/trips">{en ? "My trips" : "Đến lịch trình của tôi"}</Link></div>;
  return <div className="container section"><p className="eyebrow">{en ? "CONSULTATION REQUEST" : "YÊU CẦU TƯ VẤN"}</p><h1 className="page-title">{en ? "Review before sending" : "Xem lại trước khi gửi"}</h1><p className="section-description">{en ? "The recipient and exact contact details are shown below. Your trip snapshot and message will be visible to this demo workspace." : "Đơn vị nhận và thông tin liên hệ được hiển thị bên dưới. Ảnh chụp chuyến đi và lời nhắn sẽ được hiển thị trong không gian làm việc DEMO này."}</p>
    <form className="panel" onSubmit={submit} style={{ maxWidth: 760, marginTop: 24 }}><div className="alert alert-blue"><strong>{en ? "Recipient" : "Đơn vị nhận"}: {demoRecipient}</strong><br/>{en ? "Demo organization. No real operator or partnership is represented." : "Tổ chức giả lập. Không đại diện cho doanh nghiệp hoặc quan hệ đối tác thật."}</div><label className="form-label" htmlFor="inquiry-name">{en ? "Name" : "Tên liên hệ"}</label><input id="inquiry-name" className="field" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required/><label className="form-label" htmlFor="inquiry-email">{en ? "Email shared with recipient" : "Email sẽ chia sẻ với bên nhận"}</label><input id="inquiry-email" type="email" className="field" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={254} required/><label className="form-label" htmlFor="inquiry-message">{en ? "Message or constraints" : "Lời nhắn hoặc yêu cầu cần lưu ý"}</label><textarea id="inquiry-message" className="field" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1400} placeholder={en ? "For allergies or accessibility needs, ask the provider to confirm directly." : "Với dị ứng hoặc nhu cầu tiếp cận, hãy yêu cầu cơ sở xác nhận trực tiếp."}/><label className="consent-control"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required/><span>{en ? `I consent to sharing my name, email, message and selected trip with ${demoRecipient}. I understand this request is not a booking.` : `Tôi đồng ý chia sẻ tên, email, lời nhắn và hành trình đã chọn với ${demoRecipient}. Tôi hiểu đây không phải là đặt chỗ.`}</span></label>{error && <div className="alert alert-red" role="alert"><AlertCircle size={16}/>{error}</div>}{success && <div className="alert" role="status"><Check size={16}/>{success}</div>}<div className="action-row"><button className="button button-primary" disabled={loading || !consent}><Send size={15}/>{en ? "Send request" : "Gửi yêu cầu"}</button><Link className="button button-secondary" href="/trips">{en ? "Cancel" : "Quay lại"}</Link></div></form>
  </div>;
}
