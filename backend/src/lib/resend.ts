import dotenv from "dotenv";
import { Resend } from "resend";

export function getResendClient() {
  dotenv.config();
  const key = process.env.RESEND_API_KEY?.trim();
  return key ? new Resend(key) : null;
}
