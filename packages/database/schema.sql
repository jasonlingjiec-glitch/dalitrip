-- PostgreSQL first-pass schema for the booking MVP.

create extension if not exists pgcrypto;

create type account_role as enum ('OWNER', 'SUBACCOUNT');
create type schedule_rule_type as enum ('REGULAR', 'REST_DAY', 'SPECIAL');
create type order_status as enum ('PENDING_PAYMENT', 'BOOKED', 'COMPLETED', 'CANCELLED', 'REFUNDED');
create type payment_method as enum ('WECHAT', 'WALLET', 'WALLET_AND_WECHAT');
create type review_status as enum ('VISIBLE', 'HIDDEN', 'DELETED_BY_CUSTOMER');
create type content_page_status as enum ('DRAFT', 'PUBLISHED');
create type export_job_status as enum ('QUEUED', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED');

create table activity_group (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null unique,
  created_at timestamptz not null default now()
);

create table admin_account (
  id uuid primary key default gen_random_uuid(),
  role account_role not null default 'SUBACCOUNT',
  display_name varchar(80) not null,
  mobile varchar(32),
  manager_openid varchar(128),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table admin_account_group (
  account_id uuid not null references admin_account(id) on delete cascade,
  group_id uuid not null references activity_group(id) on delete cascade,
  primary key (account_id, group_id)
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references admin_account(id),
  action varchar(120) not null,
  entity_type varchar(80) not null,
  entity_id varchar(120) not null,
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table tag (
  id uuid primary key default gen_random_uuid(),
  code varchar(80) not null unique,
  created_at timestamptz not null default now()
);

create table tag_translation (
  tag_id uuid not null references tag(id) on delete cascade,
  locale varchar(16) not null,
  name varchar(120) not null,
  primary key (tag_id, locale)
);

create table activity (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references activity_group(id),
  advance_booking_hours integer not null default 0 check (advance_booking_hours >= 0),
  schedule_paused boolean not null default false,
  meeting_latitude numeric(10, 7),
  meeting_longitude numeric(10, 7),
  leader_wechat varchar(120),
  elevation_gain_m integer,
  distance_km numeric(7, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activity_translation (
  activity_id uuid not null references activity(id) on delete cascade,
  locale varchar(16) not null,
  name varchar(160) not null,
  summary text,
  content text,
  meeting_point_name varchar(240),
  suitable_age varchar(120),
  primary key (activity_id, locale)
);

create table activity_tag (
  activity_id uuid not null references activity(id) on delete cascade,
  tag_id uuid not null references tag(id) on delete cascade,
  primary key (activity_id, tag_id)
);

create table guide_profile (
  id uuid primary key default gen_random_uuid(),
  name varchar(160) not null,
  photo_cos_key varchar(500),
  description_html text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guide_page (
  singleton boolean primary key default true check (singleton),
  introduction_html text not null default '',
  updated_at timestamptz not null default now()
);

create table activity_guide (
  activity_id uuid not null references activity(id) on delete cascade,
  guide_id uuid not null references guide_profile(id) on delete cascade,
  primary key (activity_id, guide_id)
);

create table activity_image (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activity(id) on delete cascade,
  cos_key varchar(500) not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique (activity_id, sort_order)
);

create table schedule_rule (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activity(id) on delete cascade,
  rule_type schedule_rule_type not null,
  weekday smallint check (weekday between 1 and 7),
  valid_from date,
  valid_until date,
  starts_at time,
  ends_at time,
  capacity integer check (capacity > 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table schedule_rule_specification (
  id uuid primary key default gen_random_uuid(),
  schedule_rule_id uuid not null references schedule_rule(id) on delete cascade,
  name varchar(120) not null,
  price_cents integer not null check (price_cents >= 0),
  sort_order smallint not null,
  unique (schedule_rule_id, name),
  unique (schedule_rule_id, sort_order)
);

create table schedule_slot (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activity(id),
  source_rule_id uuid references schedule_rule(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (ends_at::date = starts_at::date),
  check (extract(minute from starts_at)::integer % 15 = 0),
  check (extract(minute from ends_at)::integer % 15 = 0),
  check (booked_count <= capacity)
);

create table schedule_slot_specification (
  id uuid primary key default gen_random_uuid(),
  schedule_slot_id uuid not null references schedule_slot(id) on delete cascade,
  name varchar(120) not null,
  price_cents integer not null check (price_cents >= 0),
  sort_order smallint not null,
  unique (schedule_slot_id, name),
  unique (schedule_slot_id, sort_order)
);

create table customer (
  id uuid primary key default gen_random_uuid(),
  customer_openid varchar(128) not null unique,
  nickname varchar(160),
  mobile varchar(32),
  frozen boolean not null default false,
  frozen_at timestamptz,
  frozen_note text,
  wallet_balance_cents integer not null default 0 check (wallet_balance_cents >= 0),
  created_at timestamptz not null default now()
);

create table booking_order (
  id uuid primary key default gen_random_uuid(),
  order_no varchar(64) not null unique,
  customer_id uuid not null references customer(id),
  group_id uuid not null references activity_group(id),
  activity_id uuid not null references activity(id),
  schedule_slot_id uuid not null references schedule_slot(id),
  schedule_slot_specification_id uuid references schedule_slot_specification(id),
  specification_name varchar(120) not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  amount_cents integer not null check (amount_cents >= 0),
  wallet_paid_cents integer not null default 0 check (wallet_paid_cents >= 0),
  wechat_paid_cents integer not null default 0 check (wechat_paid_cents >= 0),
  payment_method payment_method,
  status order_status not null default 'PENDING_PAYMENT',
  capacity_lock_expires_at timestamptz,
  wechat_transaction_id varchar(80),
  profile_json jsonb not null default '{}'::jsonb,
  cancelled_at timestamptz,
  cancellation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table refund (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references booking_order(id),
  refund_no varchar(64) not null unique,
  wechat_refund_id varchar(80),
  refund_cents integer not null check (refund_cents >= 0),
  penalty_cents integer not null default 0 check (penalty_cents >= 0),
  requested_by uuid references admin_account(id),
  note text,
  created_at timestamptz not null default now()
);

create table refund_rule (
  id uuid primary key default gen_random_uuid(),
  minimum_hours_before_start integer not null check (minimum_hours_before_start >= 0),
  refund_percent smallint not null check (refund_percent between 0 and 100),
  sort_order integer not null unique,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer(id),
  delta_cents integer not null,
  reason varchar(160) not null,
  order_id uuid references booking_order(id),
  operator_id uuid references admin_account(id),
  note text,
  created_at timestamptz not null default now()
);

create table review (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activity(id),
  customer_id uuid not null references customer(id),
  display_name varchar(160) not null,
  content varchar(1500) not null,
  rating smallint check (rating between 1 and 5),
  status review_status not null default 'VISIBLE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table review_image (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references review(id) on delete cascade,
  cos_key varchar(500) not null,
  sort_order smallint not null check (sort_order between 1 and 9),
  unique (review_id, sort_order)
);

create table review_video (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references review(id) on delete cascade,
  cos_key varchar(500) not null
);

create table review_reply (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references review(id) on delete cascade,
  customer_id uuid references customer(id),
  admin_account_id uuid references admin_account(id),
  author_role varchar(20) not null check (author_role in ('CUSTOMER', 'LEADER', 'ADMIN')),
  display_name varchar(160) not null,
  content varchar(500) not null,
  created_at timestamptz not null default now(),
  check ((customer_id is not null) <> (admin_account_id is not null))
);

create table admin_notification (
  id uuid primary key default gen_random_uuid(),
  admin_account_id uuid not null references admin_account(id) on delete cascade,
  activity_id uuid not null references activity(id) on delete cascade,
  review_id uuid not null references review(id) on delete cascade,
  notification_type varchar(40) not null check (notification_type in ('NEW_REVIEW', 'REVIEW_REPLY')),
  title varchar(160) not null,
  message varchar(600) not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index admin_notification_account_created_at
  on admin_notification (admin_account_id, created_at desc);

create table content_page (
  id uuid primary key default gen_random_uuid(),
  slug varchar(120) not null unique,
  status content_page_status not null default 'DRAFT',
  is_homepage boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_homepage_only
  on content_page (is_homepage)
  where is_homepage = true;

create table content_page_translation (
  page_id uuid not null references content_page(id) on delete cascade,
  locale varchar(16) not null,
  title varchar(160) not null,
  primary key (page_id, locale)
);

create table content_block (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references content_page(id) on delete cascade,
  block_type varchar(80) not null,
  sort_order integer not null,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, sort_order)
);

create table export_job (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references admin_account(id),
  export_type varchar(80) not null,
  filter_json jsonb not null default '{}'::jsonb,
  status export_job_status not null default 'QUEUED',
  record_count integer,
  cos_key varchar(500),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
