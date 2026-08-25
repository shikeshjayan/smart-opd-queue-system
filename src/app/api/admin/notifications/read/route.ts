import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { NotificationModel, NotificationDeliveryModel } from "@/lib/models";
import { getSession } from "@/lib/auth";
import { roleHasPermission } from "@/features/auth/permissions";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user || !roleHasPermission(user.role, "VIEW_NOTIFICATION_HEALTH")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, hospitalId } = await request.json();
  if (!id || !hospitalId) {
    return NextResponse.json({ error: "Missing id or hospitalId" }, { status: 400 });
  }

  await dbConnect();
  const now = new Date().toISOString();

  await NotificationModel.updateOne(
    { _id: id, hospitalId },
    { $set: { read: true, readAt: now } }
  );

  await NotificationDeliveryModel.updateMany(
    { notificationId: id, channel: "in_app" },
    { $set: { state: "read", readAt: now, updatedAt: now } }
  );

  return NextResponse.json({ ok: true });
}