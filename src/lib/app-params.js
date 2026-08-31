const isNode = typeof window === 'undefined';
const storage = isNode ? { getItem: () => null, setItem: () => undefined, removeItem: () => undefined } : window.localStorage;

const getParam = (key, fallback = undefined) => {
  if (isNode) return fallback;
  const value = new URLSearchParams(window.location.search).get(key);
  if (value !== null) {
    storage.setItem(`atomos_${key}`, value);
    return value;
  }
  const stored = storage.getItem(`atomos_${key}`);
  if (stored !== null) return stored;
  return fallback;
};

export const appParams = {
  appId: getParam('app_id', import.meta.env.VITE_APP_ID || 'local-atomos-app'),
  token: getParam('access_token', localStorage.getItem('atomos_local_auth_token') || ''),
  fromUrl: getParam('from_url', typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173'),
  functionsVersion: getParam('functions_version', 'local'),
  appBaseUrl: getParam('app_base_url', 'http://localhost:5173'),
};

