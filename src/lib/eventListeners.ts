import { createClient } from "redis";
import { Server as SocketServer } from "socket.io";
import { notificationService } from "../services/notification.service.js";

const subscriber = createClient({
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD!,
  socket: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

subscriber.on("error", (err: any) =>
  console.error("Redis Subscriber Error:", err)
);

await subscriber.connect();
console.log("✅ Redis Subscriber connected");

// Helper to format date like "2nd December 2025 at 12:00 PM"
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  const day = date.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
      ? "nd"
      : day === 3 || day === 23
      ? "rd"
      : "th";

  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${day}${suffix} ${month} ${year} at ${time}`;
}

export async function setupEventListeners(io: SocketServer) {
  // Listen to appointment.created event
  await subscriber.subscribe("appointment.created", async (message: string) => {
    const data = JSON.parse(message);
    console.log("📥 Event received: appointment.created", data);

    const formattedDate = formatDateTime(data.dateTime);

    // Notify the DOCTOR that a new appointment request has been made
    const notification = await notificationService.create({
      userId: data.doctorId,
      type: "APPOINTMENT_CREATED",
      title: "New Appointment Request",
      message: `Patient ${
        data.patientName || "A patient"
      } has requested an appointment on ${formattedDate}.`,
      appointmentId: data.appointmentId,
    });

    // Emit notification to doctor
    io.to(data.doctorId).emit("notification", notification);

    // Emit real-time appointment update to doctor's dashboard
    io.to(data.doctorId).emit("appointmentNew", {
      id: data.appointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      dateTime: data.dateTime,
      status: "PENDING",
    });
  });

  // Listen to appointment.approved event
  await subscriber.subscribe(
    "appointment.approved",
    async (message: string) => {
      const data = JSON.parse(message);
      console.log("📥 Event received: appointment.approved", data);

      const formattedDate = formatDateTime(data.dateTime);

      const notification = await notificationService.create({
        userId: data.patientId,
        type: "APPOINTMENT_APPROVED",
        title: "Appointment Approved ✅",
        message: `Dr. ${
          data.doctorName || "Your doctor"
        } approved your appointment on ${formattedDate}.`,
        appointmentId: data.appointmentId,
      });

      io.to(data.patientId).emit("notification", notification);

      // Emit real-time status update to patient's dashboard
      io.to(data.patientId).emit("appointmentStatusUpdated", {
        id: data.appointmentId,
        status: "APPROVED",
      });
    }
  );

  // Listen to appointment.rejected event
  await subscriber.subscribe(
    "appointment.rejected",
    async (message: string) => {
      const data = JSON.parse(message);
      console.log("📥 Event received: appointment.rejected", data);

      const formattedDate = formatDateTime(data.dateTime);

      const notification = await notificationService.create({
        userId: data.patientId,
        type: "APPOINTMENT_REJECTED",
        title: "Appointment Rejected",
        message: `Dr. ${
          data.doctorName || "Your doctor"
        } rejected your appointment on ${formattedDate}.`,
        appointmentId: data.appointmentId,
      });

      io.to(data.patientId).emit("notification", notification);

      // Emit real-time status update to patient's dashboard
      io.to(data.patientId).emit("appointmentStatusUpdated", {
        id: data.appointmentId,
        status: "REJECTED",
      });
    }
  );

  // Listen to appointment.cancelled event
  await subscriber.subscribe(
    "appointment.cancelled",
    async (message: string) => {
      const data = JSON.parse(message);
      console.log("📥 Event received: appointment.cancelled", data);

      const formattedDate = formatDateTime(data.dateTime);

      const notification = await notificationService.create({
        userId: data.patientId,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment Cancelled",
        message: `Your appointment on ${formattedDate} has been cancelled.`,
        appointmentId: data.appointmentId,
      });

      io.to(data.patientId).emit("notification", notification);

      // Emit real-time status update to patient's dashboard
      io.to(data.patientId).emit("appointmentStatusUpdated", {
        id: data.appointmentId,
        status: "CANCELLED",
      });
    }
  );

  console.log("✅ Event listeners registered for appointment events");
}
