import { promises as fs } from "fs";
import path from "path";
import { createHash, randomUUID } from "crypto";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/server/supabase";
import type { Division, Judge, User } from "@/lib/types";

type Database = { users: User[] };
type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: User["role"];
  organization: string;
  position: string;
  phone: string;
  division: Division | "all";
  is_active: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
};
type JudgeInput = {
  name: string;
  email: string;
  password?: string;
  organization: string;
  position: string;
  phone: string;
  division: Division | "all";
  isActive: boolean;
};

const dbPath = path.join(process.cwd(), "data", "db.json");

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    organization: row.organization,
    position: row.position,
    phone: row.phone,
    division: row.division,
    isActive: row.is_active,
    lastSeen: row.last_seen,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toRow(user: User): UserRow {
  return {
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
    name: user.name,
    role: user.role,
    organization: user.organization,
    position: user.position,
    phone: user.phone,
    division: user.division,
    is_active: user.isActive,
    last_seen: user.lastSeen,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
}

async function readLocalDb(): Promise<Database> {
  const raw = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(raw.replace(/^\uFEFF/, "")) as Database;
}

async function writeLocalDb(db: Database) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

function requireDatabase() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase database is not connected. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return getSupabaseAdmin();
}

function publicUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function updateLastSeen(user: User) {
  user.lastSeen = new Date().toISOString().slice(0, 16).replace("T", " ");
  user.updatedAt = new Date().toISOString();

  if (!hasSupabaseConfig()) {
    if (process.env.VERCEL) requireDatabase();
    const local = await readLocalDb();
    const index = local.users.findIndex((item) => item.id === user.id);
    if (index >= 0) local.users[index] = user;
    await writeLocalDb(local);
    return;
  }

  const { error } = await requireDatabase()
    .from("app_users")
    .update({ last_seen: user.lastSeen, updated_at: user.updatedAt })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
}

export async function authenticateUser(email: string, password: string, role?: User["role"]) {
  let user: User | undefined;

  if (hasSupabaseConfig()) {
    const { data, error } = await requireDatabase()
      .from("app_users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) user = toUser(data as UserRow);
  } else {
    if (process.env.VERCEL) requireDatabase();
    const db = await readLocalDb();
    user = db.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  }

  if (!user || !user.isActive || (role && user.role !== role)) return null;
  if (user.passwordHash !== hashPassword(password)) return null;

  await updateLastSeen(user);
  return publicUser(user);
}

export async function listJudges(): Promise<Judge[]> {
  let users: User[];
  if (hasSupabaseConfig()) {
    const { data, error } = await requireDatabase().from("app_users").select("*").eq("role", "judge");
    if (error) throw new Error(error.message);
    users = (data ?? []).map((row) => toUser(row as UserRow));
  } else {
    if (process.env.VERCEL) requireDatabase();
    users = (await readLocalDb()).users;
  }

  return users.filter((user) => user.role === "judge").map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    organization: user.organization,
    position: user.position,
    phone: user.phone,
    division: user.division,
    isActive: user.isActive,
    lastSeen: user.lastSeen
  }));
}

export async function createJudge(input: JudgeInput) {
  const now = new Date().toISOString();
  const user: User = {
    id: `j-${randomUUID()}`,
    email: input.email.trim(),
    passwordHash: hashPassword(input.password || "Temp@2026!"),
    name: input.name,
    role: "judge",
    organization: input.organization,
    position: input.position,
    phone: input.phone,
    division: input.division,
    isActive: input.isActive,
    lastSeen: "-",
    createdAt: now,
    updatedAt: now
  };

  if (hasSupabaseConfig()) {
    const { error } = await requireDatabase().from("app_users").insert(toRow(user));
    if (error?.code === "23505") throw new Error("This email is already registered.");
    if (error) throw new Error(error.message);
  } else {
    if (process.env.VERCEL) requireDatabase();
    const db = await readLocalDb();
    if (db.users.some((item) => item.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error("This email is already registered.");
    }
    db.users.push(user);
    await writeLocalDb(db);
  }

  return publicUser(user);
}

export async function updateJudge(id: string, input: JudgeInput) {
  if (hasSupabaseConfig()) {
    const db = requireDatabase();
    const { data: existing, error: findError } = await db.from("app_users").select("*").eq("id", id).eq("role", "judge").maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!existing) return null;

    const now = new Date().toISOString();
    const changes: Partial<UserRow> = {
      name: input.name,
      email: input.email.trim(),
      organization: input.organization,
      position: input.position,
      phone: input.phone,
      division: input.division,
      is_active: input.isActive,
      updated_at: now
    };
    if (input.password) changes.password_hash = hashPassword(input.password);

    const { data, error } = await db.from("app_users").update(changes).eq("id", id).select("*").single();
    if (error?.code === "23505") throw new Error("This email is already registered.");
    if (error) throw new Error(error.message);
    return publicUser(toUser(data as UserRow));
  }

  if (process.env.VERCEL) requireDatabase();
  const db = await readLocalDb();
  const user = db.users.find((item) => item.id === id && item.role === "judge");
  if (!user) return null;
  if (db.users.some((item) => item.id !== id && item.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("This email is already registered.");
  }

  user.name = input.name;
  user.email = input.email.trim();
  user.organization = input.organization;
  user.position = input.position;
  user.phone = input.phone;
  user.division = input.division;
  user.isActive = input.isActive;
  user.updatedAt = new Date().toISOString();
  if (input.password) user.passwordHash = hashPassword(input.password);
  await writeLocalDb(db);
  return publicUser(user);
}

export async function deleteJudge(id: string) {
  if (hasSupabaseConfig()) {
    const db = requireDatabase();
    const { data: existing, error: findError } = await db.from("app_users").select("id").eq("id", id).eq("role", "judge").maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!existing) return false;

    const { error: evaluationError } = await db.from("evaluation_records").delete().eq("judge_id", id);
    if (evaluationError) throw new Error(evaluationError.message);
    const { error: assignmentError } = await db.from("judge_assignments").delete().eq("judge_id", id);
    if (assignmentError) throw new Error(assignmentError.message);
    const { error } = await db.from("app_users").delete().eq("id", id).eq("role", "judge");
    if (error) throw new Error(error.message);
    return true;
  }

  if (process.env.VERCEL) requireDatabase();
  const db = await readLocalDb();
  const index = db.users.findIndex((item) => item.id === id && item.role === "judge");
  if (index < 0) return false;
  db.users.splice(index, 1);
  await writeLocalDb(db);
  return true;
}
