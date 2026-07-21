"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  function logout() {
    window.localStorage.removeItem("review-system-user");
    router.replace("/login");
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-navy-900 transition hover:bg-slate-50"
    >
      <LogOut size={16} />
      로그아웃
    </button>
  );
}
