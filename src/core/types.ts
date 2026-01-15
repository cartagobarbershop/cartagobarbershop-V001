import type { z } from "zod";
import {
  dataSchema,
  notificationSchema,
  customerSchema,
  appointmentSchema,
  orderSchema,
  rewardSchema,
  settingsSchema,
  styleSchema
} from "./schemas";

export type Notification = z.infer<typeof notificationSchema>;
export type Customer = z.infer<typeof customerSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Reward = z.infer<typeof rewardSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Style = z.infer<typeof styleSchema>;
export type Data = z.infer<typeof dataSchema>;

export { DATA_VERSION } from "./schemas";
