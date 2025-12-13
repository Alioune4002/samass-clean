export type Service = {
  id: number;
  title: string;
  description: string;
  durations_prices: Record<string, number>;
  image?: string | null;
  is_active?: boolean;
};

export type Availability = {
  id: number;
  start_datetime: string;
  end_datetime: string;
  is_booked: boolean;
  created_at: string;
  updated_at: string;
};

export type BookingStatus = "pending" | "confirmed" | "canceled";

export type Booking = {
  id: number;
  service: Service;
  availability: Availability;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_comment?: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};
