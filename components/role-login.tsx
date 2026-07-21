"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Badge, BrandMark, Button, Card, Field, TextInput } from "./ui";

type LoginRole = "admin" | "judge";

type RoleLoginProps = {
  initialRole?: LoginRole;
};

const accounts = {
  admin: {
    label: "관리자",
    helper: "출품작, 심사위원, 배정, 점수표를 관리합니다."
  },
  judge: {
    label: "심사위원",
    helper: "배정된 출품작을 보고 항목별 평가를 진행합니다."
  }
} as const;

function rememberedIdKey(role: LoginRole) {
  return `review-system-remembered-${role}-id`;
}

export function RoleLogin({ initialRole = "admin" }: RoleLoginProps) {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const account = useMemo(() => accounts[role], [role]);

  useEffect(() => {
    const savedId = window.localStorage.getItem(rememberedIdKey(role)) ?? "";
    setEmail(savedId);
    setPassword("");
    setRememberId(Boolean(savedId));
  }, [role]);

  function selectRole(nextRole: LoginRole) {
    setRole(nextRole);
    setError("");
  }

  function toggleRememberId(checked: boolean) {
    setRememberId(checked);
    if (!checked) window.localStorage.removeItem(rememberedIdKey(role));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, role })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.message || "로그인에 실패했습니다.");
      return;
    }

    if (rememberId) {
      window.localStorage.setItem(rememberedIdKey(role), email.trim());
    } else {
      window.localStorage.removeItem(rememberedIdKey(role));
    }
    window.localStorage.setItem("review-system-user", JSON.stringify(result.user));
    router.push(result.user.role === "admin" ? "/admin/dashboard" : "/judge/evaluation");
    } catch {
      setError("Login request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#071936_0%,#15366d_48%,#f4f7fb_48%)] p-5">
      <Card className="w-full max-w-2xl p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <BrandMark />
          <Badge tone={role === "admin" ? "green" : "blue"}>{account.label} 로그인</Badge>
        </div>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">Review System</p>
          <h1 className="mt-2 text-3xl font-bold text-navy-900">신세계스퀘어 미디어아트 어워즈</h1>
          <p className="mt-2 text-sm text-slate-600">하나의 서버와 DB에서 로그인 권한에 따라 페이지를 분기합니다.</p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectRole("admin")}
            className={`rounded-lg border p-4 text-left transition ${role === "admin" ? "border-navy-900 bg-navy-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
          >
            <ShieldCheck className="text-navy-700" size={22} />
            <p className="mt-3 font-bold text-navy-900">관리자</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{accounts.admin.helper}</p>
          </button>
          <button
            type="button"
            onClick={() => selectRole("judge")}
            className={`rounded-lg border p-4 text-left transition ${role === "judge" ? "border-navy-900 bg-navy-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
          >
            <UserRoundCheck className="text-navy-700" size={22} />
            <p className="mt-3 font-bold text-navy-900">심사위원</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{accounts.judge.helper}</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field label="이메일">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <TextInput
                className="pl-10"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </Field>
          <Field label="비밀번호">
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <TextInput
                className="pl-10"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </Field>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={rememberId}
              onChange={(event) => toggleRememberId(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-navy-900"
            />
            아이디 저장
          </label>
          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중..." : `${account.label} 페이지로 이동`}
          </Button>
        </form>

      </Card>
    </main>
  );
}
