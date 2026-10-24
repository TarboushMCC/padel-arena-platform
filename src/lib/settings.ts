import { prisma } from "@/lib/prisma";

type SettingValue = string | number | boolean | Record<string, unknown> | unknown[] | null;

export async function getSetting<T = SettingValue>(key: string, fallback: T): Promise<T> {
  const item = await prisma.siteSetting.findUnique({ where: { key } });
  if (!item || item.value === null || item.value === undefined) {
    return fallback;
  }
  return item.value as T;
}

export async function getSettings(keys: string[]) {
  const items = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const map: Record<string, unknown> = {};
  for (const key of keys) {
    map[key] = null;
  }
  for (const item of items) {
    map[item.key] = item.value;
  }
  return map;
}

export async function getPublicSettings() {
  const keys = [
    "arena_name",
    "address",
    "phone",
    "email",
    "whatsapp_url",
    "opening_notice",
    "map_embed_url",
    "social_links"
  ];
  return getSettings(keys);
}
