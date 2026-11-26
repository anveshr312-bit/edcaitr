import test from 'node:test';
import assert from 'node:assert/strict';
import { eventAvailability } from '../frontend/src/lib/events/lifecycle.ts';
import { returnPath } from '../frontend/src/lib/auth/returnPath.ts';

test('event and registration boundaries use absolute instants', () => {
  const event = {status:'published',starts_at:'2026-03-18T09:00:00+05:30',ends_at:'2026-03-20T18:00:00+05:30',registration_opens_at:'2026-03-01T00:00:00+05:30',registration_closes_at:'2026-03-18T10:00:00+05:30'};
  const at = (value) => eventAvailability(event, Date.parse(value));
  assert.deepEqual(at('2026-02-28T18:29:59Z'),{lifecycle:'upcoming',open:false});
  assert.deepEqual(at('2026-02-28T18:30:00Z'),{lifecycle:'upcoming',open:true});
  assert.deepEqual(at('2026-03-18T03:30:00Z'),{lifecycle:'ongoing',open:true});
  assert.deepEqual(at('2026-03-18T04:30:00Z'),{lifecycle:'ongoing',open:false});
  assert.deepEqual(at('2026-03-20T12:30:00Z'),{lifecycle:'completed',open:false});
  for (const status of ['archived','cancelled']) assert.deepEqual(eventAvailability({...event,status}),{lifecycle:status,open:false});
});
test('event and track sign-in destinations are allowlisted', () => {
  for (const path of ['/events/e-summit#registration','/events/demo?track=12345678-1234-1234-1234-123456789abc#registration','/account/reset-password']) assert.equal(returnPath(path),path);
  for (const path of [null,'https://example.org','//example.org','/events/a/../x','/events/e?track=unknown']) assert.equal(returnPath(path),'/account/dashboard');
});
