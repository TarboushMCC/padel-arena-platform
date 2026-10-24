import { prisma } from "@/lib/prisma";
import { FaqManager } from "@/components/admin/FaqManager";

export default async function AdminFaqPage() {
  const items = await prisma.faqItem.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] });

  return (
    <FaqManager
      initialFaq={items.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        category: item.category,
        displayOrder: item.displayOrder,
        isPublished: item.isPublished
      }))}
    />
  );
}
