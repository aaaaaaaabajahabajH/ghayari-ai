"use client";

import { useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpFromLine, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { GarageProduct } from "@/lib/types";

type MovementDialogProps = {
  products: GarageProduct[];
  initialProductId?: string;
  onClose: () => void;
  onSaved: () => void;
};

export function MovementDialog({ products, initialProductId, onClose, onSaved }: MovementDialogProps) {
  const [movementType, setMovementType] = useState<"in" | "out">("in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("record_stock_movement", {
      p_product_id: String(form.get("product_id")),
      p_movement_type: movementType,
      p_quantity: Number(form.get("quantity")),
      p_reference: String(form.get("reference")).trim(),
      p_notes: String(form.get("notes")).trim(),
    });
    if (rpcError) {
      setError(rpcError.message.includes("Insufficient stock") ? "الكمية المصروفة أكبر من الرصيد المتاح." : "تعذر تسجيل الحركة. تحقق من البيانات وحاول مجددًا.");
      setBusy(false);
      return;
    }
    setBusy(false);
    onSaved();
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="movement-dialog-title">
        <div className="dialog-head">
          <div><h2 id="movement-dialog-title">تسجيل حركة مخزون</h2><p>سيُحدّث النظام رصيد القطعة وسجل الحركات تلقائيًا.</p></div>
          <button className="icon-button" type="button" aria-label="إغلاق" onClick={onClose}><X /></button>
        </div>
        <div className="form-select-mode" role="group" aria-label="نوع الحركة">
          <button type="button" className={`mode-option ${movementType === "in" ? "active in" : ""}`} aria-pressed={movementType === "in"} onClick={() => setMovementType("in")}><ArrowDownToLine size={15} /> وارد</button>
          <button type="button" className={`mode-option ${movementType === "out" ? "active out" : ""}`} aria-pressed={movementType === "out"} onClick={() => setMovementType("out")}><ArrowUpFromLine size={15} /> صادر</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field full"><label htmlFor="movement-product">القطعة</label><select id="movement-product" name="product_id" required defaultValue={initialProductId ?? ""}><option value="" disabled>اختر القطعة</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku} (الرصيد {product.quantity})</option>)}</select></div>
            <div className="form-field"><label htmlFor="movement-quantity">الكمية</label><input id="movement-quantity" name="quantity" type="number" min="1" max="999999" defaultValue="1" required /></div>
            <div className="form-field"><label htmlFor="movement-reference">مرجع / رقم فاتورة</label><input id="movement-reference" name="reference" maxLength={80} placeholder="اختياري" /></div>
            <div className="form-field full"><label htmlFor="movement-notes">ملاحظة</label><textarea id="movement-notes" name="notes" maxLength={500} placeholder="سبب الصرف أو بيانات المورد…" /></div>
          </div>
          {error && <div className="form-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
          <div className="dialog-actions"><button type="submit" className="primary-button" disabled={busy || products.length === 0}>{busy ? "جارٍ التسجيل…" : "تأكيد الحركة"}</button><button type="button" className="secondary-button" onClick={onClose}>إلغاء</button></div>
        </form>
      </section>
    </div>
  );
}
