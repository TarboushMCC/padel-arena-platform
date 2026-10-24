import { prisma } from "@/lib/prisma";
import { SettingsManager } from "@/components/admin/SettingsManager";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <SettingsManager
      initialSettings={settings.map((setting) => ({
        id: setting.id,
        key: setting.key,
        value: setting.value
      }))}
    />
  );
}
