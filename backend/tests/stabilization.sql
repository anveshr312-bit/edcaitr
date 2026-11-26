-- Isolated development database only. Fixtures roll back on completion.
begin;
create function pg_temp.check_true(ok boolean, description text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAILED: %', description; end if;
end $$;

do $$
declare
  manager uuid := gen_random_uuid();
  participant uuid := gen_random_uuid();
  other_user uuid := gen_random_uuid();
  single_event uuid := gen_random_uuid();
  multi_event uuid := gen_random_uuid();
  track uuid := gen_random_uuid();
  ticket jsonb;
  payment jsonb;
  scan jsonb;
begin
  insert into auth.users(id) values (manager),(participant),(other_user);
  insert into public.org_memberships(user_id,role,status,effective_from) values(manager,'advisor','approved',current_date);
  insert into public.events(id,slug,title,status,created_by,ends_at,max_capacity) values
    (single_event,'test-single','Single','published',manager,now()+interval '1 day',1),
    (multi_event,'test-tracks','Multiple tracks','published',manager,now()+interval '1 day',4);
  insert into public.event_tracks(id,event_id,title,capacity) values(track,multi_event,'Founder',1),(gen_random_uuid(),multi_event,'Builder',2);
  update public.events set is_paid=true,fee_amount=100 where id=multi_event;
  ticket := public.register_for_event(single_event,participant);
  perform pg_temp.check_true(ticket->>'status'='confirmed','single-track confirmation');
  begin perform public.register_for_event(single_event,participant); raise exception 'duplicate accepted';
  exception when others then if sqlerrm not like '%already registered%' then raise; end if; end;
  begin perform public.register_for_event(single_event,other_user); raise exception 'capacity exceeded';
  exception when others then if sqlerrm not like '%capacity is full%' then raise; end if; end;
  begin perform public.register_for_event(multi_event,participant); raise exception 'track omitted';
  exception when others then if sqlerrm not like '%Select a track%' then raise; end if; end;
  payment := public.register_for_event(multi_event,participant,'student',null,'test-payment',null,track);
  perform pg_temp.check_true(payment->>'payment_status'='pending_verification','paid multi-track reservation');
  begin perform public.register_for_event(multi_event,other_user,'student',null,'test-payment',null,track); raise exception 'track oversold';
  exception when others then if sqlerrm not like '%Track is full%' then raise; end if; end;
  perform pg_temp.check_true((select track_id=track from public.registrations where id=(payment->>'registration_id')::uuid),'track persisted');
  begin perform public.verify_registration_payment((payment->>'registration_id')::uuid,participant,'verified'); raise exception 'unauthorized verifier';
  exception when others then if sqlerrm not like '%can verify payments%' then raise; end if; end;
  perform public.verify_registration_payment((payment->>'registration_id')::uuid,manager,'verified');
  begin perform public.checkin_by_qr(single_event,(ticket->>'qr_token')::uuid,other_user); raise exception 'unauthorized scanner';
  exception when others then if sqlerrm not like '%can scan tickets%' then raise; end if; end;
  scan := public.checkin_by_qr(single_event,(ticket->>'qr_token')::uuid,manager);
  perform pg_temp.check_true(scan->>'already_checked_in'='false','first scan records attendance');
  scan := public.checkin_by_qr(single_event,(ticket->>'qr_token')::uuid,manager);
  perform pg_temp.check_true(scan->>'already_checked_in'='true','second scan is idempotent');
  perform pg_temp.check_true((public.issue_event_certificates(single_event,manager)->>'issued_count')::int=1,'attendance certificate');
  begin perform public.issue_event_certificates(single_event,participant); raise exception 'unauthorized issuer';
  exception when others then if sqlerrm not like '%can issue certificates%' then raise; end if; end;
  update public.events set starts_at=now()-interval '2 days', ends_at=now()-interval '1 day' where id=single_event;
  begin perform public.register_for_event(single_event,other_user); raise exception 'ended event accepted registration';
  exception when others then if sqlerrm not like '%Event has ended%' then raise; end if; end;
  insert into public.org_memberships(user_id,role,status,effective_from) values(other_user,'core_team','approved',current_date + 1);
  perform pg_temp.check_true(public.get_user_role(other_user)='participant','future role inactive');
  update public.org_memberships set effective_from=current_date where user_id=other_user;
  insert into public.event_team_members(event_id,user_id,team_code) values(single_event,other_user,'RD');
  insert into public.tasks(event_id,created_by,title,team_code) values(single_event,manager,'RD task','RD'),(single_event,manager,'Other team','AV'),(multi_event,manager,'Other event','RD');
  insert into public.alumni_profiles(user_id,show_in_directory) values(manager,false);
  perform set_config('request.jwt.claim.sub',other_user::text,true);
  perform set_config('request.jwt.claims',json_build_object('sub',other_user,'role','authenticated')::text,true);
  set local role authenticated;
  perform pg_temp.check_true((select count(*) from public.registrations where user_id=participant)=0,'cross-user registration privacy');
  perform pg_temp.check_true(not has_function_privilege(current_user,'public.register_for_event(uuid,uuid,text,text,text,text,uuid)','execute'),'privileged RPC grant');
  perform pg_temp.check_true((select count(*) from public.get_public_team_profiles() where id=manager)=0,'hidden public profile');
  perform pg_temp.check_true((select count(*) from public.tasks where created_by=manager)=1,'event and team task isolation');
  perform pg_temp.check_true((select count(*) from public.alumni_profiles where user_id=manager)=0,'hidden alumni profile');
  begin update public.profiles set designation='Advisor' where id=other_user; raise exception 'editable designation';
  exception when others then if sqlerrm not like '%Only Advisors%' then raise; end if; end;
  reset role;
end $$;
rollback;
