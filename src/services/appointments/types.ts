export type AppointmentType = "new_visit" | "follow_up" | "review" | "procedure" | "other";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type Appointment = {
  id: string;
  patientId: string;
  hospitalId: string;
  departmentId: string;
  doctorId?: string;
  type: AppointmentType;
  scheduledDate: string;
  scheduledTime?: string;
  status: AppointmentStatus;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  rescheduledFrom?: string;
  rescheduledTo?: string;
  cancelledReason?: string;
  cancelledAt?: string;
  tokenNumber?: string;
  encounterId?: string;
};

export type Workday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DailySchedule = { open: string; close: string } | "closed";

export type ScheduleConfig = {
  id: string;
  departmentId: string;
  doctorId?: string;
  workdays: Record<Workday, DailySchedule>;
  slotDurationMinutes: number;
  maxBookingsPerSlot: number;
  holidayDates: string[];
  appointmentTypes: AppointmentType[];
  updatedAt?: string;
};

export type AppointmentSlot = {
  date: string;
  time: string;
  capacity: number;
  available: number;
};

export type AppointmentBookingInput = {
  patientId: string;
  hospitalId: string;
  departmentId: string;
  doctorId?: string;
  type: AppointmentType;
  scheduledDate: string;
  scheduledTime?: string;
  reason?: string;
};

export type AppointmentWithToken = {
  appointment: Appointment;
  token: {
    tokenNumber: string;
    queuePosition: number;
    opdName: string;
    departmentName: string;
  };
};