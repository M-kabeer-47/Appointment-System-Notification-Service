import { Request } from "express";

// User roles (must match user-service)
export type Role = "PATIENT" | "DOCTOR";

// JWT payload from user-service
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

// Extend Express Request with user info
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Notification DTOs
export interface CreateNotificationDto {
  userId: string;
  type:
    | "APPOINTMENT_CREATED"
    | "APPOINTMENT_APPROVED"
    | "APPOINTMENT_REJECTED"
    | "APPOINTMENT_CANCELLED";
  title: string;
  message: string;
  appointmentId?: string;
}
