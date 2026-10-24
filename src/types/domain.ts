export type UserRole = "customer" | "admin";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partial";

export interface AvailabilityRequest {
  date: string;
  durationMinutes: number;
  startTime?: string;
  courtType?: string;
  locationType?: "indoor" | "outdoor";
}

export interface AvailabilitySlot {
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
}

export interface AvailabilityResponse {
  date: string;
  durationMinutes: number;
  slots: AvailabilitySlot[];
}
