import { prisma } from "@/lib/prisma";
import { ContactsManager } from "@/components/admin/ContactsManager";

export default async function AdminContactsPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <ContactsManager
      initialMessages={messages.map((msg) => ({
        id: msg.id,
        name: msg.name,
        email: msg.email,
        phone: msg.phone,
        subject: msg.subject,
        message: msg.message,
        isRead: msg.isRead,
        createdAt: msg.createdAt.toISOString()
      }))}
    />
  );
}
