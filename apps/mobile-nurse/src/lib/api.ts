import { createNurseApiClient } from "@sompacare/mobile-shared";
import { resolveAuthToken } from "@sompacare/mobile-shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://sompacare-api.onrender.com/api/v1";

const devToken =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_TOKEN
    ? `dev_${process.env.EXPO_PUBLIC_DEV_TOKEN}`
    : null;

export const api = createNurseApiClient({
  baseUrl: API_URL,
  getToken: resolveAuthToken,
  devToken,
});

export const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};
