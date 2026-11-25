"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/garage/brand";

const supabase = createClient();

function friendlyAuthError(message: string) {
  if (message.toLowerCase().includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (message.toLowerCase().includes("email not confirmed")) return "أكّد بريدك الإلكتروني من رسالة التفعيل، ثم سجّل الدخول.";
  if (message.toLowerCase().includes("weak password")) return "اختر كلمة مرور أقوى، لا تقل عن 8 أحرف.";
  if (message.toLowerCase().includes("rate limit")) return "محاولات كثيرة في وقت قصير. انتظر قليلًا ثم حاول مجددًا.";
  return "تعذر إكمال الطلب الآن. تحقق من البيانات وحاول مرة أخرى.";
}

export function AuthPanel() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) setError(friendlyAuthError(authError.message));
      else if (!data.session) setNotice("أرسلنا رابط تأكيد إلى بريدك. افتحه لتفعيل حسابك، ثم ارجع إلى هنا لتسجيل الدخول.");
      else setNotice("تم إنشاء حسابك بنجاح.");
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) setError(friendlyAuthError(authError.message));
    }
    setBusy(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-art" aria-label="رسم توضيحي لمحرك سيارة">
        <Image src="/engine-blueprint.png" alt="رسم فني لمحرك بأجزاء داخلية ظاهرة" fill priority sizes="(max-width: 780px) 0px, 52vw" />
        <div className="auth-art-copy">
          <div className="eyebrow"><span /> مساحة عمل مصممة للميكانيكيين</div>
          <h1>كل قطعة في مكانها.<br /><span>كل حركة محسوبة.</span></h1>
          <p>من كتالوج القطع إلى سجل الوارد والصادر — إدارة ورشتك تبدأ من هنا.</p>
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <Brand />
          <h2>{mode === "login" ? "مرحبًا بعودتك" : "أنشئ حساب ورشتك"}</h2>
          <p className="auth-lead">{mode === "login" ? "سجّل الدخول لمتابعة قطعك وحركات مخزونك." : "حساب واحد يحفظ بيانات قطع الغيار وسجل الحركة بشكل خاص."}</p>
          {notice && <div className="auth-note" role="status">{notice}</div>}
          <form className="auth-fields" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="auth-email">البريد الإلكتروني</label>
              <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" />
            </div>
            <div className="form-field">
              <label htmlFor="auth-password">كلمة المرور</label>
              <input id="auth-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 أحرف على الأقل" dir="ltr" />
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button auth-submit" type="submit" disabled={busy}>
              {busy ? "جارٍ المعالجة…" : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
              {!busy && <ArrowLeft aria-hidden="true" />}
            </button>
          </form>
          <div className="auth-switch">
            {mode === "login" ? "أول مرة هنا؟" : "لديك حساب بالفعل؟"}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }}>
              {mode === "login" ? "أنشئ حسابًا" : "سجّل الدخول"}
            </button>
          </div>
          <div className="auth-note" style={{ marginTop: 27, display: "flex", gap: 8, alignItems: "center" }}>
            <ShieldCheck size={15} aria-hidden="true" /> بيانات كل ورشة معزولة ومحمية عن بقية الحسابات.
          </div>
        </div>
      </section>
    </main>
  );
}
