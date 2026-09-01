-- KVN booking workflow migration
-- Already applied to the production Supabase project.
-- Kept in the repository so the database change is reproducible.

alter table public.calendar_dates add column if not exists manager_note text;
alter table public.booking_details add column if not exists guest_count integer;
alter table public.booking_details add column if not exists booking_source text;
alter table public.booking_details add column if not exists enquiry_id uuid;

create index if not exists enquiries_date_idx on public.enquiries(event_date);
create index if not exists booking_details_date_idx on public.booking_details(date);

drop policy if exists manager_booking_delete on public.booking_details;
create policy manager_booking_delete on public.booking_details
  for delete to authenticated using(public.is_manager());

create or replace function public.confirm_enquiry(p_enquiry_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  e public.enquiries%rowtype;
  c public.calendar_dates%rowtype;
  required_slots text[];
  slot_name text;
begin
  if not public.is_manager() then raise exception 'Not authorized'; end if;
  select * into e from public.enquiries where id=p_enquiry_id for update;
  if not found then raise exception 'Enquiry not found'; end if;
  if e.status='declined' then raise exception 'A declined enquiry cannot be confirmed'; end if;

  required_slots := case e.slot
    when 'Morning' then array['morning']
    when 'Evening' then array['evening']
    else array['morning','evening']
  end;

  insert into public.calendar_dates(date) values(e.event_date) on conflict(date) do nothing;
  select * into c from public.calendar_dates where date=e.event_date for update;

  foreach slot_name in array required_slots loop
    if slot_name='morning' and c.morning_status='booked'
       and not exists(select 1 from public.booking_details where date=e.event_date and slot='morning' and enquiry_id=e.id) then
      raise exception 'Morning slot is already booked for %', e.event_date;
    end if;
    if slot_name='evening' and c.evening_status='booked'
       and not exists(select 1 from public.booking_details where date=e.event_date and slot='evening' and enquiry_id=e.id) then
      raise exception 'Evening slot is already booked for %', e.event_date;
    end if;
  end loop;

  update public.calendar_dates set
    morning_status=case when 'morning'=any(required_slots) then 'booked' else morning_status end,
    evening_status=case when 'evening'=any(required_slots) then 'booked' else evening_status end,
    updated_at=now(), updated_by=auth.uid()
  where date=e.event_date;

  foreach slot_name in array required_slots loop
    insert into public.booking_details(date,slot,event_name,customer_name,customer_phone,guest_count,booking_source,manager_notes,enquiry_id,updated_by,updated_at)
    values(e.event_date,slot_name,e.event_type,e.name,e.phone,e.guest_count,'Website enquiry',e.message,e.id,auth.uid(),now())
    on conflict(date,slot) do update set
      event_name=excluded.event_name, customer_name=excluded.customer_name, customer_phone=excluded.customer_phone,
      guest_count=excluded.guest_count, booking_source=excluded.booking_source, manager_notes=excluded.manager_notes,
      enquiry_id=excluded.enquiry_id, updated_by=auth.uid(), updated_at=now();
  end loop;

  update public.enquiries set status='confirmed', updated_at=now() where id=e.id;
  return jsonb_build_object('ok',true,'enquiry_id',e.id,'date',e.event_date,'slot',e.slot);
end;
$$;

create or replace function public.update_enquiry_status(p_enquiry_id uuid,p_status text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  e public.enquiries%rowtype;
  b record;
  c public.calendar_dates%rowtype;
begin
  if not public.is_manager() then raise exception 'Not authorized'; end if;
  if p_status not in ('new','contacted','advance_paid','declined','confirmed') then raise exception 'Invalid enquiry status'; end if;
  select * into e from public.enquiries where id=p_enquiry_id for update;
  if not found then raise exception 'Enquiry not found'; end if;
  if p_status='confirmed' then return public.confirm_enquiry(p_enquiry_id); end if;

  if e.status='confirmed' then
    for b in select date,slot from public.booking_details where enquiry_id=e.id loop
      select * into c from public.calendar_dates where date=b.date for update;
      delete from public.booking_details where date=b.date and slot=b.slot and enquiry_id=e.id;
      if b.slot='morning' and not exists(select 1 from public.booking_details where date=b.date and slot='morning') then
        update public.calendar_dates set morning_status='available',updated_at=now(),updated_by=auth.uid() where date=b.date;
      elsif b.slot='evening' and not exists(select 1 from public.booking_details where date=b.date and slot='evening') then
        update public.calendar_dates set evening_status='available',updated_at=now(),updated_by=auth.uid() where date=b.date;
      end if;
    end loop;
  end if;

  update public.enquiries set status=p_status,updated_at=now() where id=e.id;
  return jsonb_build_object('ok',true,'enquiry_id',e.id,'status',p_status);
end;
$$;

revoke all on function public.confirm_enquiry(uuid) from public;
grant execute on function public.confirm_enquiry(uuid) to authenticated;
revoke all on function public.update_enquiry_status(uuid,text) from public;
grant execute on function public.update_enquiry_status(uuid,text) to authenticated;
