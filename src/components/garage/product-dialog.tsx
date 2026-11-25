"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { productCategories } from "@/lib/types";

const supabase = createClient();

type ProductDialogProps = {
  onClose: () => void;
  onSaved: () => void;
};

export function ProductDialog({ onClose, onSaved }: ProductDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.rpc("create_garage_product", {
      p_sku: String(form.get("sku")).trim().toUpperCase(),
      p_name: String(form.get("name")).trim(),
      p_category: String(form.get("category")),
      p_compatibility: String(form.get("compatibility")).trim(),
      p_min_quantity: Number(form.get("min_quantity")),
      p_unit_cost: Number(form.get("unit_cost")),
      p_opening_quantity: Number(form.get("quantity")),
    });
    if (insertError) {
      setError(insertError.code === "23505" ? "رمز القطعة مستخدم بالفعل في هذا الحساب." : "تعذر حفظ القطعة. تحقق من البيانات وحاول مجددًا.");
      setBusy(false);
      return;
    }
    setBusy(false);
    onSaved();
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <div className="dialog-head">
          <div><h2 id="product-dialog-title">إضافة قطعة جديدة</h2><p>أدخل بيانات القطعة، وسيُحفظ الرصيد الافتتاحي مع المنتج.</p></div>
          <button className="icon-button" type="button" aria-label="إغلاق" onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field full"><label htmlFor="product-name">اسم القطعة</label><input id="product-name" name="name" required maxLength={120} placeholder="مثال: فلتر زيت" /></div>
            <div className="form-field"><label htmlFor="product-sku">رمز القطعة (SKU)</label><input id="product-sku" name="sku" required maxLength={40} placeholder="FLT-001" dir="ltr" /></div>
            <div className="form-field"><label htmlFor="product-category">الفئة</label><select id="product-category" name="category" defaultValue={productCategories[0]}>{productCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
            <div className="form-field full"><label htmlFor="product-fitment">التوافق / موديل السيارة</label><input id="product-fitment" name="compatibility" maxLength={160} placeholder="مثال: تويوتا كامري 2018–2024" /></div>
            <div className="form-field"><label htmlFor="product-quantity">الرصيد الحالي</label><input id="product-quantity" name="quantity" type="number" min="0" max="999999" defaultValue="0" required /></div>
            <div className="form-field"><label htmlFor="product-min">حد التنبيه</label><input id="product-min" name="min_quantity" type="number" min="0" max="999999" defaultValue="2" required /></div>
            <div className="form-field full"><label htmlFor="product-cost">تكلفة الوحدة (اختياري)</label><input id="product-cost" name="unit_cost" type="number" min="0" max="99999999" step="0.01" defaultValue="0" /></div>
          </div>
          {error && <div className="form-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
          <div className="dialog-actions"><button type="submit" className="primary-button" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ القطعة"}</button><button type="button" className="secondary-button" onClick={onClose}>إلغاء</button></div>
        </form>
      </section>
    </div>
  );
}
