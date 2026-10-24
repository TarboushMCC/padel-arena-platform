import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/account/ProfileForm";

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);

  return (
    <ProfileForm
      initial={{
        fullName: session?.user.name || "",
        phone: session?.user.phone || ""
      }}
    />
  );
}
