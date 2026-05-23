create table if not exists public.signup_verification_tokens (
  email text primary key,
  user_id uuid,
  nome text not null,
  empresa_nome text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists signup_verification_tokens_expires_idx
  on public.signup_verification_tokens (expires_at);

alter table public.signup_verification_tokens enable row level security;

create or replace function public.claim_signup_verification_token(p_token_hash text)
returns table (
  email text,
  user_id uuid,
  nome text,
  empresa_nome text
)
language sql
security definer
set search_path = public
as $$
  update public.signup_verification_tokens
  set claimed_at = now()
  where token_hash = p_token_hash
    and user_id is not null
    and used_at is null
    and expires_at > now()
    and (claimed_at is null or claimed_at < now() - interval '10 minutes')
  returning email, user_id, nome, empresa_nome;
$$;

create or replace function public.complete_signup_verification_token(p_token_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.signup_verification_tokens
  set used_at = now(),
      updated_at = now()
  where token_hash = p_token_hash
    and used_at is null;
$$;

revoke all on function public.claim_signup_verification_token(text) from public;
revoke all on function public.complete_signup_verification_token(text) from public;
grant execute on function public.claim_signup_verification_token(text) to service_role;
grant execute on function public.complete_signup_verification_token(text) to service_role;
