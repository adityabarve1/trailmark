/**
 * Mobile storage for users' LLM API keys: iOS Keychain / Android Keystore via expo-secure-store.
 * Keys never leave the device except in requests to the chosen provider, and are never
 * written to Supabase. The app owner can't read them.
 */
import * as SecureStore from "expo-secure-store";
import type { ProviderId } from "@trailmark/core";

// SecureStore keys may contain only letters, digits, ".", "-" and "_".
const slot = (userId: string, p: ProviderId) => `aikey.${userId.replace(/[^A-Za-z0-9._-]/g, "")}.${p}`;

export const saveKey = (userId: string, p: ProviderId, key: string) =>
  SecureStore.setItemAsync(slot(userId, p), key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
export const loadKey = (userId: string, p: ProviderId) => SecureStore.getItemAsync(slot(userId, p));
export const removeKey = (userId: string, p: ProviderId) => SecureStore.deleteItemAsync(slot(userId, p));
export const maskKey = (k: string) => (k.length <= 10 ? "••••" : `${k.slice(0, 6)}…${k.slice(-4)}`);
