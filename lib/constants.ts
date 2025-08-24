import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// Validate and get the backend URL (lazy evaluation)
let _cachedBackendUrl: string | null = null;

export function getWoollyBackendUrl(): string {
  if (_cachedBackendUrl !== null) {
    return _cachedBackendUrl;
  }
  
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const defaultUrl = 'http://localhost:80';
  
  if (!envUrl) {
    _cachedBackendUrl = defaultUrl;
    return defaultUrl;
  }
  
  try {
    new URL(envUrl);
    _cachedBackendUrl = envUrl;
    return envUrl;
  } catch (error) {
    console.warn(`Invalid NEXT_PUBLIC_BACKEND_URL: ${envUrl}. Using default: ${defaultUrl}`);
    _cachedBackendUrl = defaultUrl;
    return defaultUrl;
  }
}
