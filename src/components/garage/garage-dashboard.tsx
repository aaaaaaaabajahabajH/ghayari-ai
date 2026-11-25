"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import useSWR from "swr";
import type { User } from "@supabase/supabase-js";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Boxes,
  CarFront,
  Check,
  ChevronLeft,
  CircleAlert,
  Cog,
  DoorOpen,
  Gauge,
  History,
  Layers3,
  PackagePlus,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAmount, formatDate, formatNumber } from "@/lib/format";
import type { GarageProduct, StockMovement } from "@/lib/types";
import { productCategories } from "@/lib/types";
import { Brand } from "@/components/garage/brand";
import { ProductDialog } from "@/components/garage/product-dialog";
import { MovementDialog } from "@/components/garage/movement-dialog";

const supabase = createClient();
const EMPTY_PRODUCTS: GarageProduct[] = [];
type DashboardData = { products: GarageProduct[]; movements: StockMovement[] };
type Section = "overview" | "products" | "movements";

function MetricCard({ icon: Icon, label, value, note, color, glow, unit }: {
  icon: typeof Boxes;
  label: string;
  value: string;
  note: string;
  color: string;
  glow: string;
  unit?: string;
}) {
  return (
    <article className="metric-card" style={{ "--metric-color": color, "--metric-glow": glow } as CSSProperties}>
      <div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon"><Icon aria-hidden="true" /></span></div>
      <div className="metric-value">{value}{unit && <span className="unit">{unit}</span>}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("Failed to fetch")) return "تعذر الاتصال بقاعدة البيانات. أعد تحميل الصفحة بعد لحظات.";
  return "تعذر تحميل بيانات الورشة. تحقق من الاتصال وحاول مجددًا.";
}

export function GarageDashboard({ user }: { user: User }) {
  const [section, setSection] = useState<Section>("overview");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementProductId, setMovementProductId] = useState<string>();
  const [toast, setToast] = useState<{ message: string; error?: boolean }>();
  const [signingOut, setSigningOut] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    ["garage-dashboard", user.id],
    async () => {
      const [productsResult, movementsResult] = await Promise.all([
        supabase.from("garage_products").select("id,owner_id,sku,name,category,compatibility,quantity,min_quantity,unit_cost,created_at,updated_at").order("updated_at", { ascending: false }),
        supabase.from("garage_stock_movements").select("id,product_id,movement_type,quantity,reference,notes,created_at,product:garage_products(name,sku)").order("created_at", { ascending: false }),
      ]);
      if (productsResult.error) throw productsResult.error;
      if (movementsResult.error) throw movementsResult.error;
      return { products: (productsResult.data ?? []) as GarageProduct[], movements: (movementsResult.data ?? []) as unknown as StockMovement[] };
    },
    { revalidateOnFocus: true },
  );

  const products = data?.products ?? EMPTY_PRODUCTS;
  const movements = data?.movements ?? [];
  const lowStock = products.filter((product) => product.quantity <= product.min_quantity);
  const totalUnits = products.reduce((sum, product) => sum + product.quantity, 0);
  const stockValue = products.reduce((sum, product) => sum + product.quantity * Number(product.unit_cost), 0);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.sku} ${product.compatibility}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (categoryFilter === "all" || product.category === categoryFilter);
  }), [products, query, categoryFilter]);

  function showToast(message: string, failed = false) {
    setToast({ message, error: failed });
    window.setTimeout(() => setToast(undefined), 3200);
  }

  async function signOut() {
    setSigningOut(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) showToast("تعذر تسجيل الخروج. حاول مجددًا.", true);
    setSigningOut(false);
  }

  function saveComplete(message: string) {
    setProductDialogOpen(false);
    setMovementDialogOpen(false);
    setMovementProductId(undefined);
    void mutate();
    showToast(message);
  }

  const sectionTitle = section === "products" ? "كتالوج القطع" : section === "movements" ? "سجل الحركات" : "نظرة عامة";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div>
          <p className="sidebar-label">مساحة العمل</p>
          <nav className="nav-list" aria-label="القائمة الرئيسية">
            <button className={`nav-item ${section === "overview" ? "active" : ""}`} onClick={() => setSection("overview")}><Gauge aria-hidden="true" /> نظرة عامة</button>
            <button className={`nav-item ${section === "products" ? "active" : ""}`} onClick={() => setSection("products")}><Boxes aria-hidden="true" /> قطع الغيار <span className="nav-count">{formatNumber(products.length)}</span></button>
            <button className={`nav-item ${section === "movements" ? "active" : ""}`} onClick={() => setSection("movements")}><History aria-hidden="true" /> حركات المخزون</button>
          </nav>
        </div>
        <div>
          <p className="sidebar-label">موارد الورشة</p>
          <div className="nav-list">
            <button className="nav-item" onClick={() => setProductDialogOpen(true)}><CarFront aria-hidden="true" /> موديلات القطع</button>
            <button className="nav-item" onClick={() => showToast("ستتوفر إعدادات الورشة في تحديث قادم.")}><Settings2 aria-hidden="true" /> إعدادات الورشة</button>
          </div>
        </div>
        <div className="sidebar-spacer" />
        <div className="workspace-card">
          <div className="workspace-icon"><Wrench size={15} aria-hidden="true" /></div>
          <div className="workspace-title">تنظيم أدق، شغل أسرع</div>
          <p className="workspace-caption">سجّل كل قطعة واردة أو مصروفة حتى يبقى رصيد الرفوف واضحًا.</p>
          <button className="workspace-link" onClick={() => setMovementDialogOpen(true)}>سجل حركة الآن <ArrowLeft size={12} aria-hidden="true" /></button>
        </div>
        <div className="sidebar-footer">
          <div className="user-avatar" aria-hidden="true">{(user.email?.[0] ?? "W").toUpperCase()}</div>
          <div className="user-info"><span className="user-name">{user.email?.split("@")[0] ?? "حساب الورشة"}</span><span className="user-email">{user.email}</span></div>
          <button className="icon-button" aria-label="تسجيل الخروج" title="تسجيل الخروج" onClick={signOut} disabled={signingOut}><DoorOpen aria-hidden="true" /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>مساحة الورشة</span><ChevronLeft size={12} aria-hidden="true" /><strong>{sectionTitle}</strong></div>
          <div className="mobile-brand"><div className="brand-mark"><Cog size={17} aria-hidden="true" /></div><div className="brand-name">TORQUE</div></div>
          <div className="top-actions">
            <div className="connection-pill"><span className="connection-dot" /> قاعدة بيانات آمنة</div>
            <button className="secondary-button" onClick={() => setMovementDialogOpen(true)} disabled={!products.length}><ArrowDownToLine aria-hidden="true" /> حركة مخزون</button>
            <button className="primary-button" onClick={() => setProductDialogOpen(true)}><Plus aria-hidden="true" /> إضافة قطعة</button>
          </div>
        </header>

        {section === "overview" && <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span /> إدارة الورشة · قطع الغيار</div>
            <h1>كل قطعة في مكانها.<br /><strong>كل حركة محسوبة.</strong></h1>
            <p className="hero-description">تابع قطع الغيار والتوافق مع السيارات، وسجّل الوارد والصادر لحظيًا — بدون ما يضيع شيء بين الرف والورشة.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setProductDialogOpen(true)}><PackagePlus aria-hidden="true" /> أضف قطعة للكتالوج</button>
              <button className="secondary-button" onClick={() => setSection("movements")}><History aria-hidden="true" /> استعرض سجل الحركة</button>
            </div>
          </div>
          <div className="hero-art"><Image src="/engine-blueprint.png" alt="رسم فني لمحرك سيارة بأجزاء داخلية" fill priority sizes="(max-width: 780px) 40vw, 32vw" /><div className="hero-tag"><ShieldCheck aria-hidden="true" /> سجل مخزون خاص وآمن</div></div>
        </section>}

        <section className="section-heading">
          <div><h2>{section === "products" ? "قطعك المسجلة" : section === "movements" ? "آخر الحركات" : "ملخص المخزون"}</h2><p>{section === "products" ? "بحث سريع عن قطعة الغيار أو توافقها مع موديل السيارة." : section === "movements" ? "سجل الوارد والصادر المُحدّث من عمليات الورشة." : "نظرة سريعة على القطع والكميات المتوفرة في الورشة."}</p></div>
          <span className="date-caption">{new Intl.DateTimeFormat("ar", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span>
        </section>

        {section !== "movements" && <div className="metrics-grid">
          <MetricCard icon={Boxes} label="عدد أصناف القطع" value={formatNumber(products.length)} note="أصناف مسجلة في كتالوج الورشة" color="#71baff" glow="rgba(69,165,255,.12)" />
          <MetricCard icon={Layers3} label="إجمالي القطع المتوفرة" value={formatNumber(totalUnits)} note="وحدة في جميع الرفوف" color="#70d5b1" glow="rgba(107,211,170,.1)" />
          <MetricCard icon={CircleAlert} label="تحت حد التنبيه" value={formatNumber(lowStock.length)} note={lowStock.length ? "تحتاج إلى إعادة طلب" : "كل القطع فوق الحد الأدنى"} color="#f2b66d" glow="rgba(242,182,109,.09)" />
          <MetricCard icon={PackagePlus} label="قيمة المخزون" value={formatAmount(stockValue)} unit="قيمة تقديرية" note="محسوبة من التكلفة والرصيد" color="#b59af4" glow="rgba(181,154,244,.1)" />
        </div>}

        {error && <div className="form-error" role="alert" style={{ marginTop: 14 }}>{getErrorMessage(error)}</div>}
        {isLoading && <div className="panel" style={{ marginTop: 14, padding: 24, color: "var(--muted)", fontSize: 11 }}>جارٍ تحميل بيانات الورشة…</div>}

        {!isLoading && <div className={`content-grid ${section === "movements" ? "movement-only" : ""}`}>
          {section !== "movements" && <section className="panel" aria-labelledby="products-title">
            <div className="panel-header">
              <div><h3 className="panel-title" id="products-title">كتالوج قطع الغيار <span className="nav-count">({formatNumber(visibleProducts.length)})</span></h3><p className="panel-subtitle">مخزون القطع وتوافقها مع المركبات</p></div>
              <div className="panel-tools"><label className="search-control"><Search aria-hidden="true" /><input aria-label="ابحث عن قطعة" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن قطعة…" /></label><select aria-label="تصفية حسب الفئة" className="filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">كل الفئات</option>{productCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
            </div>
            <div className="table-wrap">
              <table className="products-table">
                <thead><tr><th>القطعة / الرمز</th><th>الفئة</th><th>التوافق</th><th>الرصيد المتوفر</th><th>التكلفة / الوحدة</th><th><span className="sr-only">إجراءات</span></th></tr></thead>
                <tbody>
                  {visibleProducts.map((product) => {
                    const isLow = product.quantity <= product.min_quantity;
                    return <tr key={product.id}>
                      <td><div className="product-cell"><div className="product-glyph"><Cog aria-hidden="true" /></div><div><span className="product-name">{product.name}</span><span className="product-sku">{product.sku}</span></div></div></td>
                      <td><span className="category-chip"><i />{product.category}</span></td>
                      <td>{product.compatibility || <span style={{ color: "#657487" }}>غير محدد</span>}</td>
                      <td><span className={`stock-number ${isLow ? "low" : ""}`}>{formatNumber(product.quantity)}</span><span className="stock-caption">{isLow ? "منخفض" : "وحدة"}</span></td>
                      <td>{Number(product.unit_cost) ? formatAmount(Number(product.unit_cost)) : "—"}</td>
                      <td><div className="row-actions"><button className="row-action" onClick={() => { setMovementProductId(product.id); setMovementDialogOpen(true); }} aria-label={`تسجيل حركة للقطعة ${product.name}`}>حركة</button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
              {!visibleProducts.length && <div className="table-empty"><Boxes aria-hidden="true" />{products.length ? "ما لقينا قطع تطابق البحث." : "ما أضفت قطعًا بعد. ابدأ بإضافة أول قطعة لكتالوج الورشة."}</div>}
            </div>
          </section>}

          {section !== "products" && <section className="panel" aria-labelledby="movements-title">
            <div className="panel-header"><div><h3 className="panel-title" id="movements-title">{section === "movements" ? "كل الحركات المسجلة" : "آخر الحركات"}</h3><p className="panel-subtitle">سجل وارد وصادر القطع</p></div>{section === "overview" && <button className="secondary-button" onClick={() => setSection("movements")}>عرض الكل <ArrowLeft aria-hidden="true" /></button>}</div>
            {movements.length ? <>
              <div className="movement-list">{(section === "overview" ? movements.slice(0, 6) : movements).map((movement) => {
                const incoming = movement.movement_type === "in";
                return <article key={movement.id} className="movement-row">
                  <div className={`movement-sign ${incoming ? "in" : "out"}`}>{incoming ? <ArrowDownToLine aria-hidden="true" /> : <ArrowUpFromLine aria-hidden="true" />}</div>
                  <div className="movement-description"><div className="movement-product">{movement.product?.name ?? "قطعة محذوفة"}</div><div className="movement-meta"><span>{incoming ? "وارد" : "صادر"}</span><span>{formatDate(movement.created_at)}</span>{movement.reference && <span dir="ltr">{movement.reference}</span>}</div></div>
                  <div className={`movement-quantity ${incoming ? "in" : "out"}`}>{incoming ? "+" : "−"}{formatNumber(movement.quantity)}</div>
                </article>;
              })}</div>
              <div className="movement-footer"><button className="text-link" onClick={() => setMovementDialogOpen(true)} disabled={!products.length}>+ تسجيل حركة جديدة</button></div>
            </> : <div className="movement-empty"><History aria-hidden="true" />ما في حركات مسجلة حتى الآن.<br />عند استلام أو صرف قطعة، سجلها هنا.</div>}
          </section>}
        </div>}

        <div className="sidebar-footer" style={{ display: "none" }} aria-hidden="true" />
      </main>

      {productDialogOpen && <ProductDialog onClose={() => setProductDialogOpen(false)} onSaved={() => saveComplete("تمت إضافة القطعة إلى الكتالوج.")} />}
      {movementDialogOpen && <MovementDialog products={products} initialProductId={movementProductId} onClose={() => { setMovementDialogOpen(false); setMovementProductId(undefined); }} onSaved={() => saveComplete("تم تسجيل الحركة وتحديث الرصيد.")} />}
      {toast && <div className={`toast ${toast.error ? "error" : ""}`} role="status">{toast.error ? <CircleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}{toast.message}</div>}
    </div>
  );
}
