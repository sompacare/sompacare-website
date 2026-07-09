import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNurseApiClient } from "@sompacare/mobile-shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN
  ? `dev_${process.env.EXPO_PUBLIC_DEV_TOKEN}`
  : "dev_dev_nurse_rn";

export const api = createNurseApiClient({
  baseUrl: API_URL,
  getToken: async () => null,
  devToken: DEV_TOKEN,
});

export const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};
