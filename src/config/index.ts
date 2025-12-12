import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5003,
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    url: process.env.DATABASE_URL!,
  },

  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
  },

  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
};
