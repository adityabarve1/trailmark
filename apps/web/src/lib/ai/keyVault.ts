/**
 * Device-only storage for users' LLM API keys.
 *
 * Web / desktop PWA: AES-GCM encrypted in IndexedDB with a NON-EXTRACTABLE CryptoKey that
 * never leaves this browser. The ciphertext is useless if copied elsewhere.
 * (The mobile app uses the OS keychain instead: apps/mobile/src/lib/keyVault.ts.)
 *
 * Keys are never written to Supabase, never logged, and never sent anywhere except the
 * chosen provider's API. The app owner has no way to read them.
 */
import type { ProviderId } from "@trailmark/core";

const DB = "trailmark-vault";
const STORE = "kv";
const MASTER = "__master_key__";

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet<T>(k: string): Promise<T | undefined> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, "readonly").objectStore(STORE).get(k);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}
async function idbSet(k: string, v: unknown): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(v, k);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDel(k: string): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(k);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function masterKey(): Promise<CryptoKey> {
  const existing = await idbGet<CryptoKey>(MASTER);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await idbSet(MASTER, key);
  return key;
}

interface Sealed { iv: Uint8Array; data: ArrayBuffer }
const slot = (userId: string, p: ProviderId) => `key:${userId}:${p}`;


export async function saveKey(userId: string, provider: ProviderId, apiKey: string): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, await masterKey(), new TextEncoder().encode(apiKey) as BufferSource);
  await idbSet(slot(userId, provider), { iv, data } satisfies Sealed);
}

export async function loadKey(userId: string, provider: ProviderId): Promise<string | null> {
  const sealed = await idbGet<Sealed>(slot(userId, provider));
  if (!sealed) return null;
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.iv as BufferSource }, await masterKey(), sealed.data);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export async function removeKey(userId: string, provider: ProviderId): Promise<void> {
  await idbDel(slot(userId, provider));
}

/** Masked preview, e.g. "sk-ant-…9f3a". */
export const maskKey = (k: string) => (k.length <= 10 ? "••••" : `${k.slice(0, 6)}…${k.slice(-4)}`);
