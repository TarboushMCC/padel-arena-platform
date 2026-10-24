import { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminSession } from "@/lib/guards";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();

  return (
    <div className="page container admin-shell">
      <AdminNav />
      <div className="grid admin-main" style={{ gap: "1rem" }}>
        {children}
      </div>
    </div>
  );
}
