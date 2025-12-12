import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Public endpoint for creating notifications (called by other microservices)
router.post("/", notificationController.create);

// Protected endpoints (require authentication)
router.get("/", authenticate, notificationController.list);
router.get("/unread", authenticate, notificationController.listUnread);
router.patch("/:id/read", authenticate, notificationController.markAsRead);
router.patch("/read-all", authenticate, notificationController.markAllAsRead);
router.delete("/:id", authenticate, notificationController.delete);

export default router;
