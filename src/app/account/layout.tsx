import { ReactNode } from "react";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { requireUser } from "@/lib/guards";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div className="page container grid grid-2" style={{ alignItems: "start" }}>
      <AccountSidebar />
      <div className="grid" style={{ gap: "1rem" }}>
        {children}
      </div>
    </div>
  );
}
