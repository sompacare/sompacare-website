import { createFacilityApiClient } from "@sompacare/mobile-shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN
  ? `dev_${process.env.EXPO_PUBLIC_DEV_TOKEN}`
  : "dev_dev_facility_mgr";

export const api = createFacilityApiClient({
  baseUrl: API_URL,
  getToken: async () => null,
  devToken: DEV_TOKEN,
});
