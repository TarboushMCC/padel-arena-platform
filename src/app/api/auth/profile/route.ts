import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { sanitizeNullableText, sanitizeText } from "@/lib/sanitize";
import { profileSchema } from "@/lib/validation";

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error || !auth.session) {
    return auth.error;
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: { fullName: string; phone: string | null; passwordHash?: string } = {
    fullName: sanitizeText(parsed.data.full_name),
    phone: sanitizeNullableText(parsed.data.phone)
  };

  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id: auth.session.user.id },
    data: updateData
  });

  return NextResponse.json({
    user: {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
}
