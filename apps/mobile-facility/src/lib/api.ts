import { createFacilityApiClient, resolveAuthToken } from "@sompacare/mobile-shared";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.sompacare.com/api/v1";

const devToken =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_TOKEN
    ? `dev_${process.env.EXPO_PUBLIC_DEV_TOKEN}`
    : null;

export const api = createFacilityApiClient({
  baseUrl: API_URL,
  getToken: resolveAuthToken,
  devToken,
});
