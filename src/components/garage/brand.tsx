import { Cog } from "lucide-react";

export function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><Cog size={20} aria-hidden="true" /></div>
      <div className="brand-name">TORQUE<span className="brand-caption">مساحة الورشة الذكية</span></div>
    </div>
  );
}
