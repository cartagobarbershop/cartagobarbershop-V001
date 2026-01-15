import { z } from "zod";

export const DATA_VERSION = 2;

export const notificationSchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  read: z.boolean().default(false),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  barber_id: z.number().optional(),
  customer_phone: z.string().optional()
});

export const customerSchema = z.object({
  id: z.number(),
  phone: z.string().regex(/^[0-9]{7,15}$/),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  opt_in_status: z.boolean().default(true),
  created_at: z.string(),
  last_visit: z.string().optional(),
  stamps_balance: z.number().nonnegative().default(0),
  credit_balance: z.number().nonnegative().default(0),
  tier: z.enum(["BRONZE", "SILVER", "GOLD"]).default("BRONZE")
});

export const appointmentSchema = z.object({
  id: z.number(),
  customer_phone: z.string(),
  customer_name: z.string().optional(),
  barber_id: z.number(),
  chair_id: z.number().optional().default(0),
  services: z.array(z.string()),
  scheduled_at: z.string(),
  status: z.string(),
  payment_status: z.string(),
  source: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional()
});

export const orderSchema = z.object({
  id: z.number(),
  appointment_id: z.number().optional(),
  customer_id: z.string(),
  customer_name: z.string(),
  barber_id: z.number(),
  chair_id: z.number().optional().default(0),
  services: z.array(z.string()),
  subtotal: z.number(),
  discount: z.number().default(0),
  credit_applied: z.number().default(0),
  reward_used: z.string().nullable().optional(),
  total_due: z.number(),
  total_paid: z.number(),
  status: z.string(),
  mp_order_ref: z.string().optional(),
  mp_payment_url: z.string().optional(),
  created_at: z.string(),
  paid_at: z.string().optional()
});

export const rewardSchema = z.object({
  id: z.number(),
  type: z.enum(["CREDIT", "SERVICE"]),
  name: z.string(),
  value_cop: z.number().optional(),
  service_code: z.string().optional(),
  stamp_cost: z.number().nonnegative(),
  tier_restriction: z.string().nullable().optional(),
  active: z.boolean().default(true)
});

export const settingsSchema = z.object({
  shop_name: z.string(),
  shop_address: z.string(),
  shop_phone: z.string(),
  business_hours: z.object({ start: z.string(), end: z.string() }),
  timezone: z.string(),
  currency: z.string(),
  tax_rate: z.number(),
  mercadopago_public_key: z.string().optional(),
  mercadopago_access_token: z.string().optional(),
  mercadopago_webhook_url: z.string().optional(),
  mercadopago_test_mode: z.boolean().optional(),
  google_calendar_enabled: z.boolean().optional(),
  google_calendar_client_id: z.string().optional(),
  google_calendar_client_secret: z.string().optional(),
  public_walkin_url: z.string().optional(),
  privacy_consent: z.boolean().optional(),
  green_api_instance_id: z.string().optional(),
  green_api_token: z.string().optional(),
  sheets_sync_enabled: z.boolean().optional(),
  sheets_web_app_url: z.string().optional(),
  whatsapp_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  auto_reminders: z.boolean().optional(),
  fresh_cut_days_clean: z.number().optional(),
  fresh_cut_days_full: z.number().optional(),
  winback_days: z.number().optional(),
  social_links: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional()
    })
    .optional(),
  permissions: z.record(z.any()).optional()
});

export const styleSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string(),
  img: z.string(),
  tag: z.string().optional(),
  pair: z.string().optional()
});

export const dataSchema = z.object({
  version: z.number().default(DATA_VERSION),
  barbers: z.array(z.any()),
  receptionists: z.array(z.any()),
  services: z.array(z.any()),
  rewards: z.array(rewardSchema),
  customers: z.array(customerSchema),
  orders: z.array(orderSchema),
  appointments: z.array(appointmentSchema),
  tips: z.array(z.any()),
  notifications: z.array(notificationSchema),
  loyaltyLedger: z.array(z.any()),
  messageTemplates: z.any(),
  settings: settingsSchema,
  hairStyles: z.array(styleSchema).default([]),
  beardStyles: z.array(styleSchema).default([])
});
