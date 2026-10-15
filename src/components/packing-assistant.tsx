"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Backpack, Check, LoaderCircle, Sparkles } from "lucide-react";
import type { TripIntent } from "@/lib/schemas";

type PackingItem = {
  code: string;
  label: string;
  category: string;
  detail: string;
  priority: "essential" | "recommended" | "optional";
  priorityLabel: string;
  reason: string;
};

export function PackingAssistant({ signedIn, intent, placeIds }: { signedIn: boolean; intent: TripIntent; placeIds: string[] }) {
  const locale = useLocale();
  const en = locale === "en";
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<PackingItem[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState("");

  async function createList() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          consent,
          durationDays: intent.durationDays,
          partySize: intent.partySize,
          transport: intent.transport,
          interests: intent.interests,
          childHeightCm: intent.childHeightCm,
          lowMobility: intent.lowMobility,
          rainyDay: intent.rainyDay,
          placeIds,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? (en ? "Could not create the list." : "Chưa tạo được danh sách."));
      setItems(body.items as PackingItem[]);
      setChecked([]);
      setDisclaimer(body.disclaimer as string);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (en ? "Please try again." : "Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  }

  function toggle(code: string) {
    setChecked((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  return <section className="panel" style={{ marginTop: 17 }} aria-live="polite">
    <h3 className="panel-title"><Backpack size={18}/>{en ? "AI packing checklist" : "AI chuẩn bị hành lý"}</h3>
    <p className="panel-copy">{en
      ? "DeepSeek prioritizes a checklist from structured trip preferences and stop categories. The original trip description, budget, account details and coordinates are not sent."
      : "DeepSeek sắp xếp checklist theo nhu cầu chuyến đi và loại điểm dừng. Mô tả gốc, ngân sách, tài khoản và tọa độ không được gửi."}</p>
    {!items.length && <>
      <label className="form-hint" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12 }}>
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={!signedIn}/>
        <span>{en
          ? "I agree to send only trip length, group size, selected interests, needs and destination categories to DeepSeek."
          : "Tôi đồng ý gửi thời lượng, số khách, sở thích, nhu cầu đã chọn và loại điểm đến tới DeepSeek."}</span>
      </label>
      {!signedIn && <p className="form-hint">{en ? "Sign in is required." : "Cần đăng nhập để dùng tính năng AI."}</p>}
      {error && <div className="alert alert-red" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      <button className="button button-secondary" type="button" onClick={createList} disabled={!signedIn || !consent || loading || placeIds.length === 0} style={{ marginTop: 13 }}>
        {loading ? <LoaderCircle className="animate-spin" size={16}/> : <Sparkles size={16}/>}
        {loading ? (en ? "Preparing…" : "Đang chuẩn bị…") : (en ? "Create packing list" : "Tạo checklist hành lý")}
      </button>
    </>}
    {items.length > 0 && <>
      <p className="form-hint" role="status">{checked.length}/{items.length} {en ? "items prepared" : "mục đã chuẩn bị"}</p>
      <ul className="packing-list" style={{ listStyle: "none", padding: 0, margin: "12px 0", display: "grid", gap: 9 }}>
        {items.map((item) => <li key={item.code} style={{ border: "1px solid #dce7df", borderRadius: 12, padding: 12, background: checked.includes(item.code) ? "#f0f7f2" : "white" }}>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={checked.includes(item.code)} onChange={() => toggle(item.code)} aria-label={`${en ? "Prepared" : "Đã chuẩn bị"}: ${item.label}`}/>
            <span style={{ flex: 1 }}>
              <strong>{item.label}</strong>
              <span className="status-label" style={{ marginInlineStart: 8 }}>{item.priorityLabel}</span>
              <small style={{ display: "block", color: "#61746b", marginTop: 4 }}>{item.category} · {item.reason}</small>
              <small style={{ display: "block", color: "#61746b", marginTop: 3 }}>{item.detail}</small>
            </span>
            {checked.includes(item.code) && <Check size={16} aria-hidden="true"/>}
          </label>
        </li>)}
      </ul>
      <p className="form-hint">{disclaimer}</p>
      {error && <div className="alert alert-red" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      <button className="button button-quiet" type="button" onClick={() => { setItems([]); setChecked([]); }} disabled={loading}>
        {en ? "Create another list" : "Tạo danh sách khác"}
      </button>
    </>}
  </section>;
}
