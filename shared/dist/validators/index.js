"use strict";
/**
 * Zod Schemas for PharmaConnect Marketplace Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.flagActionSchema = exports.approvalActionSchema = exports.productSearchSchema = exports.nearbySearchSchema = exports.verifySecurityCodeSchema = exports.createReviewSchema = exports.sendMessageSchema = exports.startConversationSchema = exports.addRiderSchema = exports.deliveryProviderRegistrationSchema = exports.createOrderSchema = exports.pharmacyProductSchema = exports.pharmacyRegistrationSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyOtpSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
// ===== AUTH SCHEMAS =====
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    phoneNumber: zod_1.z.string().regex(constants_1.VALIDATION.PHONE_REGEX, "Invalid phone number"),
    firstName: zod_1.z.string().min(2, "First name must be at least 2 characters"),
    lastName: zod_1.z.string().min(2, "Last name must be at least 2 characters"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(constants_1.VALIDATION.PASSWORD_REGEX, "Password must contain uppercase, lowercase, number, and special character"),
    role: zod_1.z.enum([
        "customer",
        "pharmacy_admin",
        "delivery_admin",
        "platform_admin",
        "support_admin",
    ]),
    address: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    otp: zod_1.z.string().regex(constants_1.VALIDATION.OTP_REGEX, "OTP must be 6 digits"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    otp: zod_1.z.string().regex(constants_1.VALIDATION.OTP_REGEX, "OTP must be 6 digits"),
    newPassword: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(constants_1.VALIDATION.PASSWORD_REGEX, "Password must contain uppercase, lowercase, number, and special character"),
    confirmPassword: zod_1.z.string(),
});
// ===== PHARMACY SCHEMAS =====
exports.pharmacyRegistrationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Pharmacy name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    phoneNumber: zod_1.z.string().regex(constants_1.VALIDATION.PHONE_REGEX, "Invalid phone number"),
    address: zod_1.z.string().min(5, "Address is required"),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    licenseNumber: zod_1.z.string().min(1, "License number is required"),
    licenseDocUrl: zod_1.z.string().url("Invalid license document URL"),
    cacNumber: zod_1.z.string().min(1, "CAC number is required"),
    cacDocUrl: zod_1.z.string().url("Invalid CAC document URL"),
    ownerName: zod_1.z.string().min(2, "Owner name is required"),
    ownerIdDocUrl: zod_1.z.string().url("Invalid owner ID document URL"),
    operatingHours: zod_1.z.object({
        monday: zod_1.z.object({
            open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            closed: zod_1.z.boolean(),
        }),
        tuesday: zod_1.z.object({
            open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            closed: zod_1.z.boolean(),
        }),
        wednesday: zod_1.z.object({
            open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            closed: zod_1.z.boolean(),
        }),
        thursday: zod_1.z.object({
            open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            closed: zod_1.z.boolean(),
        }),
        friday: zod_1.z.object({
            open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            closed: zod_1.z.boolean(),
        }),
        saturday: zod_1.z.object({
            open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            closed: zod_1.z.boolean(),
        }),
        sunday: zod_1.z.object({
            open: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            close: zod_1.z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format HH:mm"),
            closed: zod_1.z.boolean(),
        }),
    }),
});
exports.pharmacyProductSchema = zod_1.z.object({
    drugCatalogItemId: zod_1.z.string().min(1, "Drug catalog item ID is required"),
    sku: zod_1.z.string().min(1, "SKU is required"),
    quantity: zod_1.z.number().int().min(0, "Quantity must be non-negative"),
    price: zod_1.z.number().min(0, "Price must be non-negative"),
    discount: zod_1.z.number().min(0).max(100, "Discount must be 0-100").optional(),
    expiryDate: zod_1.z.coerce.date().min(new Date(), "Expiry date must be in future"),
    batchNumber: zod_1.z.string().min(1, "Batch number is required"),
});
// ===== ORDER SCHEMAS =====
exports.createOrderSchema = zod_1.z.object({
    pharmacyId: zod_1.z.string().min(1, "Pharmacy ID is required"),
    items: zod_1.z
        .array(zod_1.z.object({
        pharmacyProductId: zod_1.z.string().min(1),
        quantity: zod_1.z.number().int().min(1, "Quantity must be at least 1"),
    }))
        .min(1, "At least one item is required"),
    deliveryAddress: zod_1.z.string().min(5, "Delivery address is required"),
    deliveryLatitude: zod_1.z.number().min(-90).max(90),
    deliveryLongitude: zod_1.z.number().min(-180).max(180),
    notes: zod_1.z.string().optional(),
    selectedDeliveryProviderId: zod_1.z.string().optional(),
});
// ===== DELIVERY PROVIDER SCHEMAS =====
exports.deliveryProviderRegistrationSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2, "Business name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    phoneNumber: zod_1.z.string().regex(constants_1.VALIDATION.PHONE_REGEX, "Invalid phone number"),
    address: zod_1.z.string().min(5, "Address is required"),
    cacNumber: zod_1.z.string().min(1, "CAC number is required"),
    cacDocUrl: zod_1.z.string().url("Invalid CAC document URL"),
    ownerName: zod_1.z.string().min(2, "Owner name is required"),
    ownerIdDocUrl: zod_1.z.string().url("Invalid owner ID document URL"),
    vehicleDocUrl: zod_1.z.string().url("Invalid vehicle document URL"),
    baseFee: zod_1.z.number().min(0, "Base fee must be non-negative"),
    perKmFee: zod_1.z.number().min(0, "Per-km fee must be non-negative"),
});
exports.addRiderSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "First name is required"),
    lastName: zod_1.z.string().min(2, "Last name is required"),
    phoneNumber: zod_1.z.string().regex(constants_1.VALIDATION.PHONE_REGEX, "Invalid phone number"),
    email: zod_1.z.string().email("Invalid email address"),
    vehicleType: zod_1.z.enum(["bicycle", "motorcycle", "car", "van"]),
    vehicleNumber: zod_1.z.string().min(1, "Vehicle number is required"),
    profileImageUrl: zod_1.z.string().url("Invalid image URL").optional(),
});
// ===== CHAT SCHEMAS =====
exports.startConversationSchema = zod_1.z.object({
    type: zod_1.z.enum(["customer_pharmacy", "customer_rider"]),
    pharmacyId: zod_1.z.string().optional(),
    deliveryRiderId: zod_1.z.string().optional(),
});
exports.sendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().min(1, "Conversation ID is required"),
    type: zod_1.z.enum(["text", "image", "system"]),
    content: zod_1.z.string().min(1, "Message content is required"),
    imageUrl: zod_1.z.string().url("Invalid image URL").optional(),
});
// ===== REVIEW SCHEMAS =====
exports.createReviewSchema = zod_1.z.object({
    reviewableType: zod_1.z.enum(["pharmacy", "delivery_provider"]),
    reviewableId: zod_1.z.string().min(1, "Reviewable ID is required"),
    rating: zod_1.z.number().int().min(1, "Rating must be 1-5").max(5),
    comment: zod_1.z.string().min(10, "Comment must be at least 10 characters"),
    orderId: zod_1.z.string().optional(),
    deliveryAssignmentId: zod_1.z.string().optional(),
});
// ===== DELIVERY VERIFICATION SCHEMAS =====
exports.verifySecurityCodeSchema = zod_1.z.object({
    deliveryAssignmentId: zod_1.z.string().min(1, "Delivery assignment ID is required"),
    code: zod_1.z
        .string()
        .regex(constants_1.VALIDATION.SECURITY_CODE_REGEX, "Code must be 6 digits"),
    verifiedBy: zod_1.z.enum(["customer", "rider"]),
});
// ===== SEARCH SCHEMAS =====
exports.nearbySearchSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    radiusKm: zod_1.z.number().min(1).max(50).default(10),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
});
exports.productSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, "Search query is required"),
    categoryFilter: zod_1.z
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
    maxPrice: zod_1.z.number().min(0).optional(),
    pharmacyId: zod_1.z.string().optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    offset: zod_1.z.number().int().min(0).default(0),
});
// ===== ADMIN SCHEMAS =====
exports.approvalActionSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID is required"),
    action: zod_1.z.enum(["approve", "reject", "suspend"]),
    reason: zod_1.z.string().optional(),
});
exports.flagActionSchema = zod_1.z.object({
    alertId: zod_1.z.string().min(1, "Alert ID is required"),
    action: zod_1.z.enum(["dismiss", "warning_sent", "conversation_closed", "user_suspended"]),
    notes: zod_1.z.string().optional(),
});
// ===== PAGINATION SCHEMA =====
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
});
