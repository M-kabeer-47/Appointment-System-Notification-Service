import { CreateNotificationDto } from "../types/index.js";
import { prisma } from "../lib/prisma.js";

export const notificationService = {
  // Create a new notification
  async create(data: CreateNotificationDto) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        appointmentId: data.appointmentId,
      },
    });

    return notification;
  },

  // Get all notifications for a user
  async findByUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  // Get unread notifications for a user
  async findUnreadByUser(userId: string) {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Mark notification as read
  async markAsRead(id: string, userId: string) {
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  // Delete a notification
  async delete(id: string, userId: string) {
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return prisma.notification.delete({
      where: { id },
    });
  },
};
