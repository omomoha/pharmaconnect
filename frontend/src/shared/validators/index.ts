/**
 * Zod Schemas for PharmaConnect Marketplace Validation
 */

import { z } from "zod";
import { VALIDATION } from "../constants";

// ===== AUTH SCHEMAS =====
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().regex(VALIDATION.PHONE_REGEX, "Invalid phone number"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      VALIDATION.PASSWORD_REGEX,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
  role: z.enum([
    "customer",
    "pharmacy_admin",
    "delivery_admin",
    "platform_admin",
    "support_admin",
  ]),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(VALIDATION.OTP_REGEX, "OTP must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(VALIDATION.OTP_REGEX, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      VALIDATION.PASSWORD_REGEX,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
  confirmPassword: z.string(),
});

// ===== PHARMACY SCHEMAS =====
export const pharmacyRegistrationSchema = z.object({
  name: z.string().min(2, "Pharmacy name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().regex(VALIDATION.PHONE_REGEX, "Invalid phone number"),
  address: z.string().min(5, "Address is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseDocUrl: z.string().url("Invalid license document URL"),
  cacNumber: z.string().min(1, "CAC number is required"),
  cacDocUrl: z.string().url("Invalid CAC document URL"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerIdDocUrl: z.string().url("Invalid owner ID document URL"),
  operatingHours: z.object({
    monday: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      closed: z.boolean(),
    }),
    tuesday: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      closed: z.boolean(),
    }),
    wednesday: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      closed: z.boolean(),
    }),
    thursday: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      closed: z.boolean(),
    }),
    friday: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      closed: z.boolean(),
    }),
    saturday: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      closed: z.boolean(),
    }),
    sunday: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
      closed: z.boolean(),
    }),
  }),
});

export const pharmacyProductSchema = z.object({
  drugCatalogItemId: z.string().min(1, "Drug catalog item ID is required"),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  price: z.number().min(0, "Price must be non-negative"),
  discount: z.number().min(0).max(100, "Discount must be 0-100").optional(),
  expiryDate: z.coerce.date().min(new Date(), "Expiry date must be in future"),
  batchNumber: z.string().min(1, "Batch number is required"),
});

// ===== ORDER SCHEMAS =====
export const createOrderSchema = z.object({
  pharmacyId: z.string().min(1, "Pharmacy ID is required"),
  items: z
    .array(
      z.object({
        pharmacyProductId: z.string().min(1),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
  deliveryAddress: z.string().min(5, "Delivery address is required"),
  deliveryLatitude: z.number().min(-90).max(90),
  deliveryLongitude: z.number().min(-180).max(180),
  notes: z.string().optional(),
  selectedDeliveryProviderId: z.string().optional(),
});

// ===== DELIVERY PROVIDER SCHEMAS =====
export const deliveryProviderRegistrationSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().regex(VALIDATION.PHONE_REGEX, "Invalid phone number"),
  address: z.string().min(5, "Address is required"),
  cacNumber: z.string().min(1, "CAC number is required"),
  cacDocUrl: z.string().url("Invalid CAC document URL"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerIdDocUrl: z.string().url("Invalid owner ID document URL"),
  vehicleDocUrl: z.string().url("Invalid vehicle document URL"),
  baseFee: z.number().min(0, "Base fee must be non-negative"),
  perKmFee: z.number().min(0, "Per-km fee must be non-negative"),
});

export const addRiderSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phoneNumber: z.string().regex(VALIDATION.PHONE_REGEX, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  vehicleType: z.enum(["bicycle", "motorcycle", "car", "van"]),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  profileImageUrl: z.string().url("Invalid image URL").optional(),
});

// ===== CHAT SCHEMAS =====
export const startConversationSchema = z.object({
  type: z.enum(["customer_pharmacy", "customer_rider"]),
  pharmacyId: z.string().optional(),
  deliveryRiderId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  type: z.enum(["text", "image", "system"]),
  content: z.string().min(1, "Message content is required"),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

// ===== REVIEW SCHEMAS =====
export const createReviewSchema = z.object({
  reviewableType: z.enum(["pharmacy", "delivery_provider"]),
  reviewableId: z.string().min(1, "Reviewable ID is required"),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
  orderId: z.string().optional(),
  deliveryAssignmentId: z.string().optional(),
});

// ===== DELIVERY VERIFICATION SCHEMAS =====
export const verifySecurityCodeSchema = z.object({
  deliveryAssignmentId: z.string().min(1, "Delivery assignment ID is required"),
  code: z
    .string()
    .regex(VALIDATION.SECURITY_CODE_REGEX, "Code must be 6 digits"),
  verifiedBy: z.enum(["customer", "rider"]),
});

// ===== SEARCH SCHEMAS =====
export const nearbySearchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(50).default(10),
  limit: z.number().int().min(1).max(100).default(20),
});

export const productSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  categoryFilter: z
    .enum([
      "pain_relief",
      "cold_flu",
      "vitamins",
      "first_aid",
      "skin_care",
      "digestive",
      "allergy",
      "eye_care",
      "oral_care",
      "baby_care",
      "supplements",
      "antiseptics",
      "other",
    ])
    .optional(),
  maxPrice: z.number().min(0).optional(),
  pharmacyId: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ===== ADMIN SCHEMAS =====
export const approvalActionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().optional(),
});

export const flagActionSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required"),
  action: z.enum(["dismiss", "warning_sent", "conversation_closed", "user_suspended"]),
  notes: z.string().optional(),
});

// ===== PAGINATION SCHEMA =====
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ===== INFERRED TYPES =====
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PharmacyRegistrationInput = z.infer<typeof pharmacyRegistrationSchema>;
export type PharmacyProductInput = z.infer<typeof pharmacyProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type DeliveryProviderRegistrationInput = z.infer<
  typeof deliveryProviderRegistrationSchema
>;
export type AddRiderInput = z.infer<typeof addRiderSchema>;
export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type VerifySecurityCodeInput = z.infer<typeof verifySecurityCodeSchema>;
export type NearbySearchInput = z.infer<typeof nearbySearchSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
export type FlagActionInput = z.infer<typeof flagActionSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
