create table if not exists public.tenant_admin_overrides (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  profile_limit_override integer,
  report_daily_limit_override integer,
  storage_limit_mb integer,
  support_sla_hours integer,
  notes text,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_feature_flags (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  rollout_scope text not null default 'all',
  notes text,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, feature_key)
);

create table if not exists public.tenant_impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  reason text not null,
  active boolean not null default true,
  expires_at timestamptz not null default (now() + interval '8 hours'),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_broadcasts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid null references public.empresas(id) on delete cascade,
  title text not null,
  message text not null,
  severity text not null default 'info',
  audience text not null default 'all',
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tenant_admin_overrides_updated_idx
  on public.tenant_admin_overrides (updated_at desc);

create index if not exists tenant_feature_flags_empresa_idx
  on public.tenant_feature_flags (empresa_id, feature_key, enabled);

create index if not exists tenant_impersonation_sessions_empresa_idx
  on public.tenant_impersonation_sessions (empresa_id, active, expires_at desc);

create index if not exists tenant_broadcasts_empresa_idx
  on public.tenant_broadcasts (empresa_id, created_at desc);

alter table public.tenant_admin_overrides enable row level security;
alter table public.tenant_feature_flags enable row level security;
alter table public.tenant_impersonation_sessions enable row level security;
alter table public.tenant_broadcasts enable row level security;

