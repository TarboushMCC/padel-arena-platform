import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const registerSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(32).optional().or(z.literal("")),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const profileSchema = z.object({
  full_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(32).optional().or(z.literal("")),
  password: z.string().min(8).optional().or(z.literal(""))
});

export const availabilitySchema = z.object({
  date: z.string().date(),
  duration_minutes: z.coerce.number().int().positive(),
  court_type: z.string().optional(),
  location_type: z.enum(["indoor", "outdoor"]).optional(),
  start_time: z.string().regex(timeRegex).optional()
});

export const holdSchema = z.object({
  court_id: z.string().min(1),
  booking_date: z.string().date(),
  start_time: z.string().regex(timeRegex),
  duration_minutes: z.number().int().positive()
});

export const bookingSchema = z.object({
  hold_id: z.string().min(1),
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().max(500).optional(),
  payment_mode: z.enum(["stripe", "venue"])
});

export const rescheduleSchema = z.object({
  new_date: z.string().date(),
  new_start_time: z.string().regex(timeRegex),
  new_duration: z.number().int().positive()
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(32).optional().or(z.literal("")),
  subject: z.string().max(150).optional().or(z.literal("")),
  message: z.string().min(5).max(2000)
});
