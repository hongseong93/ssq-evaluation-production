import Link from "next/link";
import { ReactNode } from "react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy-900 text-sm font-semibold text-white">SS</div>
      <div>
        <p className="text-sm font-semibold text-navy-900">SHINSEGAE SQUARE</p>
        <p className="text-xs text-slate-500">Media Art Awards</p>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-soft ${className}`}>{children}</section>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-navy-900 text-white hover:bg-navy-700",
    secondary: "border border-slate-300 bg-white text-navy-900 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  return (
    <button {...props} className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "gold" | "green" | "gray" }) {
  const styles = {
    blue: "bg-navy-50 text-navy-700",
    gold: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    gray: "bg-slate-100 text-slate-600"
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-navy-500 focus:ring-2 ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-navy-500 focus:ring-2 ${props.className ?? ""}`} />;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-navy-700" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function AdminShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow?: string }) {
  const nav = [
    ["/admin/dashboard", "대시보드"],
    ["/admin/submissions", "출품작 관리"],
    ["/admin/judges", "심사위원 관리"],
    ["/admin/assignments", "작품 배정"],
    ["/admin/criteria", "평가 항목"],
    ["/admin/review-status", "심사 현황"],
    ["/admin/scores/by-judge", "심사위원별 점수"],
    ["/admin/scores/by-submission", "출품작별 총점"]
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-6 lg:block">
        <BrandMark />
        <nav className="mt-8 space-y-1">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-navy-50 hover:text-navy-900">
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow ?? "Admin Console"}</p>
              <h1 className="mt-1 text-2xl font-bold text-navy-900">{title}</h1>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Badge tone="green">관리자</Badge>
              <Button variant="secondary">로그아웃</Button>
            </div>
          </div>
        </header>
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b border-slate-100 px-4 py-3 align-top text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
