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

create table if not exists public.evaluation_records (
  judge_id text not null references public.app_users(id) on delete cascade,
  submission_id text not null,
  score_entries jsonb not null default '[]'::jsonb,
  status text not null check (status in ('draft', 'submitted')),
  updated_at timestamptz not null default now(),
  primary key (judge_id, submission_id)
);

alter table public.evaluation_records enable row level security;

create table if not exists public.competition_submissions (
  id text primary key, receipt_number text not null unique, division text not null check (division in ('template', 'original')), artist_name text not null, artwork_title text not null, video_title text not null, concept text not null default '', description text not null default '', video_url text not null default '', thumbnail_url text not null default '', created_at text not null
);
alter table public.competition_submissions enable row level security;

create table if not exists public.competition_criteria (
  id text primary key, division text not null check (division in ('template', 'original')), title text not null, max_score integer not null, description text not null default '', questions jsonb not null default '[]'::jsonb, display_order integer not null
);
alter table public.competition_criteria enable row level security;

insert into storage.buckets (id, name, public) values ('submission-videos', 'submission-videos', true) on conflict (id) do nothing;

insert into public.app_users (
  id, email, password_hash, name, role, organization, position, phone, division, is_active, last_seen
) values
  ('u-admin-001', 'admin@shinsegaeawards.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Admin', 'admin', 'Shinsegae Square', 'System Admin', '', 'all', true, '-'),
  ('j-001', 'hong@jury.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Hong Gil Dong', 'judge', 'Seoul Media Lab', 'Director', '010-1111-2222', 'all', true, '-'),
  ('j-002', 'minji@jury.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Kim Min Ji', 'judge', 'Art Center', 'Curator', '010-3333-4444', 'template', true, '-'),
  ('j-003', 'wooseok@jury.kr', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Jung Woo Seok', 'judge', 'Digital Art School', 'Professor', '010-5555-6666', 'original', false, '-')
on conflict (id) do nothing;
