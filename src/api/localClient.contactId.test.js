import test from 'node:test';
import assert from 'node:assert/strict';

const STORAGE_KEY = 'atomos_local_data_v1';
const AUTH_KEY = 'atomos_local_auth_user';
const TOKEN_KEY = 'atomos_local_auth_token';

const makeStorage = () => {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
  };
};

const storage = makeStorage();
globalThis.localStorage = storage;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
  configurable: true,
});

const seededDb = {
  Note: [],
  Communication: [],
  Contact: [],
  Draft: [],
  Conversation: [],
  Waypoint: [],
  UsernameAlias: [],
  User: [{
    id: 'legacy-user-1',
    email: 'legacy@local.invalid',
    full_name: 'Legacy User',
    username: 'legacy',
    is_me: true,
    created_by_id: 'legacy-user-1',
    password: 'pass123',
  }],
};

storage.setItem(STORAGE_KEY, JSON.stringify(seededDb));
storage.removeItem(AUTH_KEY);
storage.removeItem(TOKEN_KEY);

const { appData } = await import('./localClient.js');

test('loginViaUsernamePassword backfills contact IDs for legacy accounts', async () => {
  const result = await appData.auth.loginViaUsernamePassword('legacy', 'pass123');
  assert.equal(result.user.username, 'legacy');
  const users = await appData.entities.User.list();
  assert.equal(users.length, 1);
  assert.match(users[0].contact_id, /^USER-/);
  assert.equal(users[0].password, 'pass123');

  const me = await appData.auth.me();
  assert.match(me.contact_id, /^USER-/);
  assert.equal(me.username, 'legacy');
});
