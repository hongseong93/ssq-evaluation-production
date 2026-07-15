create table if not exists public.app_users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('admin', 'judge')),
  organization text not null default '',
  position text not null default '',
  phone text not null default '',
  division text not null check (division in ('template', 'original', 'all')),
  is_active boolean not null default true,
  last_seen text not null default '-',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users enable row level security;

insert into public.app_users (
  id, email, password_hash, name, role, organization, position, phone, division, is_active, last_seen
) values
  ('u-admin-001', 'admin@shinsegaeawards.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Admin', 'admin', 'Shinsegae Square', 'System Admin', '', 'all', true, '-'),
  ('j-001', 'hong@jury.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Hong Gil Dong', 'judge', 'Seoul Media Lab', 'Director', '010-1111-2222', 'all', true, '-'),
  ('j-002', 'minji@jury.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Kim Min Ji', 'judge', 'Art Center', 'Curator', '010-3333-4444', 'template', true, '-'),
  ('j-003', 'wooseok@jury.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Jung Woo Seok', 'judge', 'Digital Art School', 'Professor', '010-5555-6666', 'original', false, '-')
on conflict (id) do nothing;
