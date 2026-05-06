
-- Enums
create type public.app_role as enum (
  'super_admin','doctor','nurse','receptionist','lab_technician',
  'radiologist','pharmacist','billing_staff','patient'
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
    and role in ('super_admin','doctor','nurse','receptionist','lab_technician','radiologist','pharmacist','billing_staff')
  )
$$;

-- Departments
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  head_doctor_id uuid,
  created_at timestamptz default now()
);

-- Doctors
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  dept_id uuid references public.departments(id) on delete set null,
  name text not null,
  qualification text,
  consultation_fee int default 0,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- Patients
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  patient_code text unique not null,
  name text not null,
  dob date,
  gender text,
  blood_group text,
  phone text not null,
  address text,
  emergency_contact text,
  allergies text,
  photo_url text,
  created_at timestamptz default now()
);

-- Patient code generator
create sequence if not exists public.patient_code_seq start 1;
create or replace function public.generate_patient_code()
returns trigger language plpgsql as $$
begin
  if new.patient_code is null or new.patient_code = '' then
    new.patient_code := 'HMS-' || extract(year from now())::text || '-' ||
      lpad(nextval('public.patient_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;
create trigger trg_patient_code before insert on public.patients
for each row execute function public.generate_patient_code();

-- Appointments
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  scheduled_at timestamptz not null,
  status text default 'scheduled',
  notes text,
  created_at timestamptz default now()
);

-- Visits
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  visit_date date default current_date,
  visit_type text default 'OPD',
  status text default 'waiting',
  token_number int,
  chief_complaint text,
  diagnosis text,
  icd_code text,
  vitals jsonb,
  notes text,
  created_at timestamptz default now()
);

-- Lab orders
create table public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete cascade,
  test_name text not null,
  status text default 'pending',
  result text,
  result_at timestamptz,
  report_url text,
  created_at timestamptz default now()
);

-- Radiology orders
create table public.radiology_orders (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete cascade,
  service_name text not null,
  status text default 'pending',
  report_url text,
  radiologist_notes text,
  created_at timestamptz default now()
);

-- Prescriptions
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete cascade,
  medications jsonb not null,
  instructions text,
  created_at timestamptz default now()
);

-- Drugs
create table public.drugs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  stock_qty int default 0,
  price decimal(10,2),
  expiry_date date,
  reorder_level int default 10,
  created_at timestamptz default now()
);

-- Beds
create table public.beds (
  id uuid primary key default gen_random_uuid(),
  ward text not null,
  floor int,
  bed_number text not null,
  status text default 'available',
  patient_id uuid references public.patients(id) on delete set null,
  created_at timestamptz default now()
);

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete cascade,
  total_amount int default 0,
  paid_amount int default 0,
  status text default 'unpaid',
  created_at timestamptz default now()
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  amount int not null,
  method text,
  paid_at timestamptz default now()
);

-- Staff
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  dept_id uuid references public.departments(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Auto profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'patient')
  on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.visits enable row level security;
alter table public.lab_orders enable row level security;
alter table public.radiology_orders enable row level security;
alter table public.prescriptions enable row level security;
alter table public.drugs enable row level security;
alter table public.beds enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.staff enable row level security;

-- Profiles policies
create policy "users view own profile" on public.profiles for select using (auth.uid() = id or public.has_role(auth.uid(),'super_admin'));
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);

-- User roles policies (read own; super_admin manages)
create policy "view own roles" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(),'super_admin'));
create policy "admin manage roles" on public.user_roles for all using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- Helper: staff-readable, admin-writable pattern
-- Departments: all authenticated read; admin write
create policy "auth read departments" on public.departments for select using (auth.uid() is not null);
create policy "admin write departments" on public.departments for all using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- Doctors: all authenticated read; admin write
create policy "auth read doctors" on public.doctors for select using (auth.uid() is not null);
create policy "admin write doctors" on public.doctors for all using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- Patients: staff read all; patients read own
create policy "staff read patients" on public.patients for select using (public.is_staff(auth.uid()) or auth.uid() = user_id);
create policy "staff write patients" on public.patients for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Appointments
create policy "view appointments" on public.appointments for select using (
  public.is_staff(auth.uid()) or
  exists (select 1 from public.patients p where p.id = appointments.patient_id and p.user_id = auth.uid())
);
create policy "staff write appointments" on public.appointments for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Visits
create policy "view visits" on public.visits for select using (
  public.is_staff(auth.uid()) or
  exists (select 1 from public.patients p where p.id = visits.patient_id and p.user_id = auth.uid())
);
create policy "staff write visits" on public.visits for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Lab/Radiology/Prescriptions: staff read/write; patient read own via visit
create policy "view lab" on public.lab_orders for select using (
  public.is_staff(auth.uid()) or
  exists (select 1 from public.visits v join public.patients p on p.id = v.patient_id where v.id = lab_orders.visit_id and p.user_id = auth.uid())
);
create policy "staff write lab" on public.lab_orders for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "view radiology" on public.radiology_orders for select using (
  public.is_staff(auth.uid()) or
  exists (select 1 from public.visits v join public.patients p on p.id = v.patient_id where v.id = radiology_orders.visit_id and p.user_id = auth.uid())
);
create policy "staff write radiology" on public.radiology_orders for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "view prescriptions" on public.prescriptions for select using (
  public.is_staff(auth.uid()) or
  exists (select 1 from public.visits v join public.patients p on p.id = v.patient_id where v.id = prescriptions.visit_id and p.user_id = auth.uid())
);
create policy "staff write prescriptions" on public.prescriptions for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Drugs / Beds / Staff: staff read; admin write
create policy "staff read drugs" on public.drugs for select using (public.is_staff(auth.uid()));
create policy "admin write drugs" on public.drugs for all using (public.has_role(auth.uid(),'super_admin') or public.has_role(auth.uid(),'pharmacist')) with check (public.has_role(auth.uid(),'super_admin') or public.has_role(auth.uid(),'pharmacist'));

create policy "staff read beds" on public.beds for select using (public.is_staff(auth.uid()));
create policy "staff write beds" on public.beds for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "staff read staff" on public.staff for select using (public.is_staff(auth.uid()));
create policy "admin write staff" on public.staff for all using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- Invoices/Payments
create policy "view invoices" on public.invoices for select using (
  public.is_staff(auth.uid()) or
  exists (select 1 from public.visits v join public.patients p on p.id = v.patient_id where v.id = invoices.visit_id and p.user_id = auth.uid())
);
create policy "billing write invoices" on public.invoices for all using (public.has_role(auth.uid(),'billing_staff') or public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'billing_staff') or public.has_role(auth.uid(),'super_admin'));

create policy "view payments" on public.payments for select using (public.is_staff(auth.uid()));
create policy "billing write payments" on public.payments for all using (public.has_role(auth.uid(),'billing_staff') or public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'billing_staff') or public.has_role(auth.uid(),'super_admin'));

-- Realtime
alter publication supabase_realtime add table public.visits;
alter publication supabase_realtime add table public.appointments;
