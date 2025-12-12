import { Response } from "express";
import { notificationService } from "../services/notification.service.js";
import { AuthenticatedRequest, CreateNotificationDto } from "../types/index.js";

export const notificationController = {
  // POST / - Create notification (called by other microservices)
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = req.body as CreateNotificationDto;

      if (!data.userId || !data.type || !data.title || !data.message) {
        return res.status(400).json({
          error: "userId, type, title, and message are required",
        });
      }

      const notification = await notificationService.create(data);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  },

  // GET / - Get all notifications for current user
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const notifications = await notificationService.findByUser(
        req.user!.userId
      );
      res.json(notifications);
    } catch (error) {
      console.error("List notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  },

  // GET /unread - Get unread notifications for current user
  async listUnread(req: AuthenticatedRequest, res: Response) {
    try {
      const notifications = await notificationService.findUnreadByUser(
        req.user!.userId
      );
      res.json(notifications);
    } catch (error) {
      console.error("List unread notifications error:", error);
      res.status(500).json({ error: "Failed to fetch unread notifications" });
    }
  },

  // PATCH /:id/read - Mark notification as read
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(
        id,
        req.user!.userId
      );
      res.json(notification);
    } catch (error: any) {
      if (error.message === "Notification not found") {
        return res.status(404).json({ error: "Notification not found" });
      }
      console.error("Mark as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  },

  // PATCH /read-all - Mark all notifications as read
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all as read error:", error);
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  },

  // DELETE /:id - Delete notification
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await notificationService.delete(id, req.user!.userId);
      res.json({ message: "Notification deleted" });
    } catch (error: any) {
      if (error.message === "Notification not found") {
        return res.status(404).json({ error: "Notification not found" });
      }
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  },
};
