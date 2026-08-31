import { appParams } from '@/lib/app-params';

const STORAGE_KEY = 'atomos_local_data_v1';
const AUTH_KEY = 'atomos_local_auth_user';
const TOKEN_KEY = 'atomos_local_auth_token';
const LEGACY_AUTH_KEY = 'atomos_user';
const LEGACY_TOKEN_KEY = 'atomos_token';
const RESET_KEY = 'atomos_local_reset_tokens_v1';

const migrateLegacyAuth = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const currentUser = localStorage.getItem(AUTH_KEY);
  const currentToken = localStorage.getItem(TOKEN_KEY);
  const legacyUserRaw = localStorage.getItem(LEGACY_AUTH_KEY);
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);

  if (!currentUser && legacyUserRaw) {
    try {
      const parsed = JSON.parse(legacyUserRaw);
      if (parsed && typeof parsed === 'object' && parsed.username) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(parsed));
      }
    } catch {
      // ignore malformed legacy payloads
    }
  }

  if (!currentToken && legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
  }

  if (legacyUserRaw || legacyToken) {
    localStorage.removeItem(LEGACY_AUTH_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
};

const clearLegacyAuth = () => {
  localStorage.removeItem(LEGACY_AUTH_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

migrateLegacyAuth();

const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@atomos.local',
  full_name: 'Demo User',
  username: 'demo',
  contact_id: 'ATOMOS-1',
  is_me: true,
  created_by_id: 'demo-user',
  password: 'demo123',
};

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = {
        Note: [],
        Communication: [],
        Contact: [],
        Draft: [],
        Conversation: [],
        Waypoint: [],
        UsernameAlias: [],
        User: [DEMO_USER],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return {
      Note: Array.isArray(parsed.Note) ? parsed.Note : [],
      Communication: Array.isArray(parsed.Communication) ? parsed.Communication : [],
      Contact: Array.isArray(parsed.Contact) ? parsed.Contact : [],
      Draft: Array.isArray(parsed.Draft) ? parsed.Draft : [],
      Conversation: Array.isArray(parsed.Conversation) ? parsed.Conversation : [],
      Waypoint: Array.isArray(parsed.Waypoint) ? parsed.Waypoint : [],
      UsernameAlias: Array.isArray(parsed.UsernameAlias) ? parsed.UsernameAlias : [],
      User: Array.isArray(parsed.User) && parsed.User.length ? parsed.User : [DEMO_USER],
    };
  } catch {
    const seeded = {
      Note: [],
      Communication: [],
      Contact: [],
      Draft: [],
      Conversation: [],
      Waypoint: [],
      UsernameAlias: [],
      User: [DEMO_USER],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const writeStorage = (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const getUserRecord = (emailOrUsername) => {
  const db = readStorage();
  const value = String(emailOrUsername || '').trim().toLowerCase();
  if (!value) return null;
  const normalized = value.toLowerCase();
  return db.User.find((user) => {
    const matchesEmail = user.email?.toLowerCase() === normalized;
    const matchesUsername = user.username?.toLowerCase() === normalized;
    return matchesEmail || matchesUsername;
  }) || null;
};

const resolveUsernameUser = (username) => {
  const db = readStorage();
  const normalized = String(username || '').trim().toLowerCase();
  if (!normalized) return null;

  const aliasMatch = db.UsernameAlias.find((entry) => String(entry.username || '').toLowerCase() === normalized);
  const aliasEmail = aliasMatch?.user_email ? String(aliasMatch.user_email).toLowerCase() : null;

  return (
    db.User.find((user) => String(user.username || '').toLowerCase() === normalized) ||
    (aliasEmail ? db.User.find((user) => String(user.email || '').toLowerCase() === aliasEmail) : null) ||
    null
  );
};

const sortValues = (a, b, sortField) => {
  const descending = sortField.startsWith('-');
  const field = descending ? sortField.slice(1) : sortField;

  const left = a?.[field];
  const right = b?.[field];
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
    return descending ? rightTime - leftTime : leftTime - rightTime;
  }

  return descending ? String(right).localeCompare(String(left)) : String(left).localeCompare(String(right));
};

const createEntityAdapter = (entityName) => ({
  list: async (sortField = '-created_date', limit = 200) => {
    const list = [...readStorage()[entityName] || []];
    list.sort((a, b) => sortValues(a, b, sortField));
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  },
  filter: async (query = {}, sortField = '-created_date', limit = 200) => {
    const records = [...readStorage()[entityName] || []];
    const filtered = records.filter((record) => {
      return Object.entries(query).every(([key, expected]) => {
        const actual = record?.[key];
        if (expected === undefined || expected === null) {
          return actual == null || actual === expected;
        }
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        if (typeof expected === 'string' && actual !== undefined && actual !== null) {
          return String(actual) === expected;
        }
        return actual === expected;
      });
    });
    filtered.sort((a, b) => sortValues(a, b, sortField));
    return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
  },
  get: async (id) => {
    const records = readStorage()[entityName] || [];
    return records.find((record) => record.id === id) || null;
  },
  create: async (payload = {}) => {
    const db = readStorage();
    const created = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      ...payload,
    };
    db[entityName] = [created, ...(db[entityName] || [])];
    writeStorage(db);
    return created;
  },
  update: async (id, updates = {}) => {
    const db = readStorage();
    const index = (db[entityName] || []).findIndex((record) => record.id === id);
    if (index === -1) return null;
    const updated = {
      ...(db[entityName][index] || {}),
      ...updates,
      id,
      updated_date: new Date().toISOString(),
    };
    db[entityName][index] = updated;
    writeStorage(db);
    return updated;
  },
  delete: async (id) => {
    const db = readStorage();
    const next = (db[entityName] || []).filter((record) => record.id !== id);
    db[entityName] = next;
    writeStorage(db);
    return true;
  },
  subscribe: () => () => undefined,
});

const readResetTokens = () => {
  try {
    const raw = localStorage.getItem(RESET_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeResetTokens = (tokens) => {
  localStorage.setItem(RESET_KEY, JSON.stringify(tokens));
};

const authApi = {
  me: async () => {
    const storedUser = localStorage.getItem(AUTH_KEY);
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return { ...DEMO_USER, token };
    }
    return { ...DEMO_USER };
  },
  loginViaUsernamePassword: async (username, password) => {
    const normalized = String(username || '').trim().toLowerCase();
    if (!normalized) {
      throw new Error('Username is required');
    }

    const user = resolveUsernameUser(normalized) || getUserRecord(normalized) || {
      ...DEMO_USER,
      email: `${normalized}@local.invalid`,
      username: normalized,
    };

    if (!user || !user.username) {
      throw new Error('Username not found');
    }

    const providedPassword = String(password ?? '');
    const storedPassword = String(user.password ?? '');
    const isLegacyDemoUser = !storedPassword && user.username === 'demo' && providedPassword === 'demo123';
    if (!isLegacyDemoUser && storedPassword !== providedPassword) {
      throw new Error('Invalid username or password');
    }

    const repairedUser = { ...user, password: storedPassword || providedPassword };
    const db = readStorage();
    const existingUserIndex = db.User.findIndex((entry) => entry.id === user.id || entry.username?.toLowerCase() === normalized);
    if (existingUserIndex >= 0) {
      db.User[existingUserIndex] = { ...db.User[existingUserIndex], ...repairedUser };
    } else {
      db.User.push(repairedUser);
    }
    writeStorage(db);
    clearLegacyAuth();
    localStorage.setItem(AUTH_KEY, JSON.stringify(repairedUser));
    localStorage.setItem(TOKEN_KEY, 'local-demo-token');
    return { access_token: 'local-demo-token', user: repairedUser };
  },
  register: async ({ username, password }) => {
    const normalized = String(username || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      throw new Error('Username must be 3–20 characters: letters, numbers, underscore');
    }
    if (!password || String(password).length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const db = readStorage();
    const duplicateUser = db.User.some((entry) => String(entry.username || '').toLowerCase() === normalized);
    const duplicateAlias = db.UsernameAlias.some((entry) => String(entry.username || '').toLowerCase() === normalized);
    if (duplicateUser || duplicateAlias) {
      throw new Error('That username is already taken');
    }

    const email = `${normalized}@local.invalid`;
    const user = {
      id: `user-${Date.now()}`,
      email,
      full_name: normalized,
      username: normalized,
      contact_id: `USER-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      is_me: true,
      created_by_id: `user-${Date.now()}`,
      password: String(password),
    };

    db.User = [user, ...db.User];
    db.UsernameAlias = [{
      id: `alias-${Date.now()}`,
      username: normalized,
      user_email: email,
      created_date: new Date().toISOString(),
    }, ...db.UsernameAlias];
    writeStorage(db);
    clearLegacyAuth();
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, 'local-demo-token');
    return { user };
  },
  resetPasswordRequest: async (username) => {
    const normalized = String(username || '').trim();
    const user = resolveUsernameUser(normalized) || getUserRecord(normalized);
    if (!user) {
      return { ok: true, resetToken: null, username: normalized };
    }
    const resetToken = `reset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const resetTokens = readResetTokens();
    resetTokens[resetToken] = {
      username: user.username,
      userId: user.id,
      createdAt: Date.now(),
    };
    writeResetTokens(resetTokens);
    return { ok: true, resetToken, username: normalized };
  },
  resetPassword: async ({ resetToken, newPassword }) => {
    const token = String(resetToken || '').trim();
    if (!token) {
      throw new Error('Missing reset token');
    }
    const resetTokens = readResetTokens();
    const tokenEntry = resetTokens[token];
    if (!tokenEntry) {
      throw new Error('Invalid or expired reset link');
    }
    const db = readStorage();
    const index = db.User.findIndex((entry) => entry.id === tokenEntry.userId || String(entry.username || '').toLowerCase() === String(tokenEntry.username || '').toLowerCase());
    if (index === -1) {
      throw new Error('User not found');
    }
    db.User[index] = {
      ...db.User[index],
      password: String(newPassword || ''),
      updated_date: new Date().toISOString(),
    };
    writeStorage(db);
    delete resetTokens[token];
    writeResetTokens(resetTokens);
    return { ok: true };
  },
  setToken: (token) => {
    clearLegacyAuth();
    localStorage.setItem(TOKEN_KEY, token || 'local-demo-token');
  },
  logout: (redirectTo = '/') => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    clearLegacyAuth();
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  },
  redirectToLogin: (redirectTo = '/login') => {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  },
  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY) || localStorage.getItem(AUTH_KEY)),
};

const functionsApi = {
  invoke: async (name, payload = {}) => {
    if (name === 'listAppUsers') {
      const users = readStorage().User.filter((user) => !user.deleted);
      return { data: { users } };
    }

    if (name === 'username') {
      const db = readStorage();
      const action = payload.action;
      const username = String(payload.username || '').trim().toLowerCase();
      if (action === 'resolve') {
        const match = db.UsernameAlias.find((entry) => String(entry.username || '').toLowerCase() === username);
        if (!match) {
          return { data: { email: null } };
        }
        return { data: { email: match.user_email } };
      }
      if (action === 'claim') {
        if (!username) return { data: { ok: false, error: 'Username required' } };
        const existing = db.UsernameAlias.some((entry) => String(entry.username || '').toLowerCase() === username);
        if (existing) {
          return { data: { ok: false, error: 'Username taken' } };
        }
        const currentUser = await authApi.me();
        const created = { id: `alias-${Date.now()}`, username, user_email: currentUser.email, created_date: new Date().toISOString() };
        db.UsernameAlias = [created, ...db.UsernameAlias];
        writeStorage(db);
        return { data: { ok: true, username } };
      }
      return { data: { ok: false, error: 'Unsupported username action' } };
    }

    if (name === 'logCommunication') {
      const { type, sender, sender_email, recipient_email, content, call_status, scheduled_at, ...rest } = payload;
      const entry = await createEntityAdapter('Communication').create({
        type,
        sender,
        sender_email,
        recipient_email,
        content,
        status: 'unread',
        call_status,
        scheduled_at,
        ...rest,
      });
      return { data: entry };
    }

    throw new Error(`Unhandled local function: ${name}`);
  },
};

export const appData = {
  auth: authApi,
  functions: functionsApi,
  entities: {
    Note: createEntityAdapter('Note'),
    Communication: createEntityAdapter('Communication'),
    Contact: createEntityAdapter('Contact'),
    Draft: createEntityAdapter('Draft'),
    Conversation: createEntityAdapter('Conversation'),
    Waypoint: createEntityAdapter('Waypoint'),
    User: createEntityAdapter('User'),
    UsernameAlias: createEntityAdapter('UsernameAlias'),
  },
  asServiceRole: {
    entities: {
      User: createEntityAdapter('User'),
      UsernameAlias: createEntityAdapter('UsernameAlias'),
    },
  },
  appParams,
};

export default appData;
