
-- Hospitals table
create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_no text,
  hospital_type text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  pincode text,
  country text default 'India',
  total_beds integer default 0,
  established_year integer,
  accreditation text,
  working_hours text,
  logo_url text,
  description text,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.hospitals enable row level security;

create policy "auth read hospitals" on public.hospitals
  for select using (auth.uid() is not null);

create policy "admin write hospitals" on public.hospitals
  for all using (public.has_role(auth.uid(),'super_admin'))
  with check (public.has_role(auth.uid(),'super_admin'));

-- Invoice items
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null,
  description text not null,
  category text,
  quantity integer not null default 1,
  rate numeric not null default 0,
  amount numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.invoice_items enable row level security;

create policy "staff read invoice_items" on public.invoice_items
  for select using (public.is_staff(auth.uid()));

create policy "billing write invoice_items" on public.invoice_items
  for all using (public.has_role(auth.uid(),'billing_staff') or public.has_role(auth.uid(),'super_admin'))
  with check (public.has_role(auth.uid(),'billing_staff') or public.has_role(auth.uid(),'super_admin'));

-- Storage buckets
insert into storage.buckets (id, name, public) values ('lab-reports','lab-reports', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('radiology-reports','radiology-reports', true)
  on conflict (id) do nothing;

create policy "public read lab reports" on storage.objects
  for select using (bucket_id = 'lab-reports');
create policy "staff upload lab reports" on storage.objects
  for insert with check (bucket_id='lab-reports' and public.is_staff(auth.uid()));
create policy "staff update lab reports" on storage.objects
  for update using (bucket_id='lab-reports' and public.is_staff(auth.uid()));

create policy "public read radiology reports" on storage.objects
  for select using (bucket_id = 'radiology-reports');
create policy "staff upload radiology reports" on storage.objects
  for insert with check (bucket_id='radiology-reports' and public.is_staff(auth.uid()));
create policy "staff update radiology reports" on storage.objects
  for update using (bucket_id='radiology-reports' and public.is_staff(auth.uid()));

-- Realtime
alter publication supabase_realtime add table public.lab_orders;
alter publication supabase_realtime add table public.radiology_orders;
alter publication supabase_realtime add table public.invoices;
