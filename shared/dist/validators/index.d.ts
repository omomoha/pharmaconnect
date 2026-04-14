/**
 * Zod Schemas for PharmaConnect Marketplace Validation
 */
import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    phoneNumber: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["customer", "pharmacy_admin", "delivery_admin", "platform_admin", "support_admin"]>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    password: string;
    role: "customer" | "pharmacy_admin" | "delivery_admin" | "platform_admin" | "support_admin";
    address?: string | undefined;
}, {
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    password: string;
    role: "customer" | "pharmacy_admin" | "delivery_admin" | "platform_admin" | "support_admin";
    address?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    otp: string;
}, {
    email: string;
    otp: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}, {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}>;
export declare const pharmacyRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodString;
    address: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    licenseNumber: z.ZodString;
    licenseDocUrl: z.ZodString;
    cacNumber: z.ZodString;
    cacDocUrl: z.ZodString;
    ownerName: z.ZodString;
    ownerIdDocUrl: z.ZodString;
    operatingHours: z.ZodObject<{
        monday: z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            closed: boolean;
            open: string;
            close: string;
        }, {
            closed: boolean;
            open: string;
            close: string;
        }>;
        tuesday: z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            closed: boolean;
            open: string;
            close: string;
        }, {
            closed: boolean;
            open: string;
            close: string;
        }>;
        wednesday: z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            closed: boolean;
            open: string;
            close: string;
        }, {
            closed: boolean;
            open: string;
            close: string;
        }>;
        thursday: z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            closed: boolean;
            open: string;
            close: string;
        }, {
            closed: boolean;
            open: string;
            close: string;
        }>;
        friday: z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            closed: boolean;
            open: string;
            close: string;
        }, {
            closed: boolean;
            open: string;
            close: string;
        }>;
        saturday: z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            closed: boolean;
            open: string;
            close: string;
        }, {
            closed: boolean;
            open: string;
            close: string;
        }>;
        sunday: z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
            closed: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            closed: boolean;
            open: string;
            close: string;
        }, {
            closed: boolean;
            open: string;
            close: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        monday: {
            closed: boolean;
            open: string;
            close: string;
        };
        tuesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        wednesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        thursday: {
            closed: boolean;
            open: string;
            close: string;
        };
        friday: {
            closed: boolean;
            open: string;
            close: string;
        };
        saturday: {
            closed: boolean;
            open: string;
            close: string;
        };
        sunday: {
            closed: boolean;
            open: string;
            close: string;
        };
    }, {
        monday: {
            closed: boolean;
            open: string;
            close: string;
        };
        tuesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        wednesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        thursday: {
            closed: boolean;
            open: string;
            close: string;
        };
        friday: {
            closed: boolean;
            open: string;
            close: string;
        };
        saturday: {
            closed: boolean;
            open: string;
            close: string;
        };
        sunday: {
            closed: boolean;
            open: string;
            close: string;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phoneNumber: string;
    address: string;
    name: string;
    latitude: number;
    longitude: number;
    licenseNumber: string;
    licenseDocUrl: string;
    cacNumber: string;
    cacDocUrl: string;
    ownerName: string;
    ownerIdDocUrl: string;
    operatingHours: {
        monday: {
            closed: boolean;
            open: string;
            close: string;
        };
        tuesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        wednesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        thursday: {
            closed: boolean;
            open: string;
            close: string;
        };
        friday: {
            closed: boolean;
            open: string;
            close: string;
        };
        saturday: {
            closed: boolean;
            open: string;
            close: string;
        };
        sunday: {
            closed: boolean;
            open: string;
            close: string;
        };
    };
}, {
    email: string;
    phoneNumber: string;
    address: string;
    name: string;
    latitude: number;
    longitude: number;
    licenseNumber: string;
    licenseDocUrl: string;
    cacNumber: string;
    cacDocUrl: string;
    ownerName: string;
    ownerIdDocUrl: string;
    operatingHours: {
        monday: {
            closed: boolean;
            open: string;
            close: string;
        };
        tuesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        wednesday: {
            closed: boolean;
            open: string;
            close: string;
        };
        thursday: {
            closed: boolean;
            open: string;
            close: string;
        };
        friday: {
            closed: boolean;
            open: string;
            close: string;
        };
        saturday: {
            closed: boolean;
            open: string;
            close: string;
        };
        sunday: {
            closed: boolean;
            open: string;
            close: string;
        };
    };
}>;
export declare const pharmacyProductSchema: z.ZodObject<{
    drugCatalogItemId: z.ZodString;
    sku: z.ZodString;
    quantity: z.ZodNumber;
    price: z.ZodNumber;
    discount: z.ZodOptional<z.ZodNumber>;
    expiryDate: z.ZodDate;
    batchNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    drugCatalogItemId: string;
    sku: string;
    quantity: number;
    price: number;
    expiryDate: Date;
    batchNumber: string;
    discount?: number | undefined;
}, {
    drugCatalogItemId: string;
    sku: string;
    quantity: number;
    price: number;
    expiryDate: Date;
    batchNumber: string;
    discount?: number | undefined;
}>;
export declare const createOrderSchema: z.ZodObject<{
    pharmacyId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        pharmacyProductId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        pharmacyProductId: string;
    }, {
        quantity: number;
        pharmacyProductId: string;
    }>, "many">;
    deliveryAddress: z.ZodString;
    deliveryLatitude: z.ZodNumber;
    deliveryLongitude: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    selectedDeliveryProviderId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    pharmacyId: string;
    items: {
        quantity: number;
        pharmacyProductId: string;
    }[];
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    notes?: string | undefined;
    selectedDeliveryProviderId?: string | undefined;
}, {
    pharmacyId: string;
    items: {
        quantity: number;
        pharmacyProductId: string;
    }[];
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    notes?: string | undefined;
    selectedDeliveryProviderId?: string | undefined;
}>;
export declare const deliveryProviderRegistrationSchema: z.ZodObject<{
    businessName: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodString;
    address: z.ZodString;
    cacNumber: z.ZodString;
    cacDocUrl: z.ZodString;
    ownerName: z.ZodString;
    ownerIdDocUrl: z.ZodString;
    vehicleDocUrl: z.ZodString;
    baseFee: z.ZodNumber;
    perKmFee: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    email: string;
    phoneNumber: string;
    address: string;
    cacNumber: string;
    cacDocUrl: string;
    ownerName: string;
    ownerIdDocUrl: string;
    businessName: string;
    vehicleDocUrl: string;
    baseFee: number;
    perKmFee: number;
}, {
    email: string;
    phoneNumber: string;
    address: string;
    cacNumber: string;
    cacDocUrl: string;
    ownerName: string;
    ownerIdDocUrl: string;
    businessName: string;
    vehicleDocUrl: string;
    baseFee: number;
    perKmFee: number;
}>;
export declare const addRiderSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    phoneNumber: z.ZodString;
    email: z.ZodString;
    vehicleType: z.ZodEnum<["bicycle", "motorcycle", "car", "van"]>;
    vehicleNumber: z.ZodString;
    profileImageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    vehicleType: "bicycle" | "motorcycle" | "car" | "van";
    vehicleNumber: string;
    profileImageUrl?: string | undefined;
}, {
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    vehicleType: "bicycle" | "motorcycle" | "car" | "van";
    vehicleNumber: string;
    profileImageUrl?: string | undefined;
}>;
export declare const startConversationSchema: z.ZodObject<{
    type: z.ZodEnum<["customer_pharmacy", "customer_rider"]>;
    pharmacyId: z.ZodOptional<z.ZodString>;
    deliveryRiderId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "customer_pharmacy" | "customer_rider";
    pharmacyId?: string | undefined;
    deliveryRiderId?: string | undefined;
}, {
    type: "customer_pharmacy" | "customer_rider";
    pharmacyId?: string | undefined;
    deliveryRiderId?: string | undefined;
}>;
export declare const sendMessageSchema: z.ZodObject<{
    conversationId: z.ZodString;
    type: z.ZodEnum<["text", "image", "system"]>;
    content: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "text" | "image" | "system";
    conversationId: string;
    content: string;
    imageUrl?: string | undefined;
}, {
    type: "text" | "image" | "system";
    conversationId: string;
    content: string;
    imageUrl?: string | undefined;
}>;
export declare const createReviewSchema: z.ZodObject<{
    reviewableType: z.ZodEnum<["pharmacy", "delivery_provider"]>;
    reviewableId: z.ZodString;
    rating: z.ZodNumber;
    comment: z.ZodString;
    orderId: z.ZodOptional<z.ZodString>;
    deliveryAssignmentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reviewableType: "pharmacy" | "delivery_provider";
    reviewableId: string;
    rating: number;
    comment: string;
    orderId?: string | undefined;
    deliveryAssignmentId?: string | undefined;
}, {
    reviewableType: "pharmacy" | "delivery_provider";
    reviewableId: string;
    rating: number;
    comment: string;
    orderId?: string | undefined;
    deliveryAssignmentId?: string | undefined;
}>;
export declare const verifySecurityCodeSchema: z.ZodObject<{
    deliveryAssignmentId: z.ZodString;
    code: z.ZodString;
    verifiedBy: z.ZodEnum<["customer", "rider"]>;
}, "strip", z.ZodTypeAny, {
    code: string;
    deliveryAssignmentId: string;
    verifiedBy: "customer" | "rider";
}, {
    code: string;
    deliveryAssignmentId: string;
    verifiedBy: "customer" | "rider";
}>;
export declare const nearbySearchSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    radiusKm: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    radiusKm: number;
    limit: number;
}, {
    latitude: number;
    longitude: number;
    radiusKm?: number | undefined;
    limit?: number | undefined;
}>;
export declare const productSearchSchema: z.ZodObject<{
    query: z.ZodString;
    categoryFilter: z.ZodOptional<z.ZodEnum<["pain_relief", "cold_flu", "vitamins", "first_aid", "skin_care", "digestive", "allergy", "eye_care", "oral_care", "baby_care", "supplements", "antiseptics", "other"]>>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    pharmacyId: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    query: string;
    offset: number;
    pharmacyId?: string | undefined;
    categoryFilter?: "pain_relief" | "cold_flu" | "vitamins" | "first_aid" | "skin_care" | "digestive" | "allergy" | "eye_care" | "oral_care" | "baby_care" | "supplements" | "antiseptics" | "other" | undefined;
    maxPrice?: number | undefined;
}, {
    query: string;
    pharmacyId?: string | undefined;
    limit?: number | undefined;
    categoryFilter?: "pain_relief" | "cold_flu" | "vitamins" | "first_aid" | "skin_care" | "digestive" | "allergy" | "eye_care" | "oral_care" | "baby_care" | "supplements" | "antiseptics" | "other" | undefined;
    maxPrice?: number | undefined;
    offset?: number | undefined;
}>;
export declare const approvalActionSchema: z.ZodObject<{
    userId: z.ZodString;
    action: z.ZodEnum<["approve", "reject", "suspend"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    action: "approve" | "reject" | "suspend";
    reason?: string | undefined;
}, {
    userId: string;
    action: "approve" | "reject" | "suspend";
    reason?: string | undefined;
}>;
export declare const flagActionSchema: z.ZodObject<{
    alertId: z.ZodString;
    action: z.ZodEnum<["dismiss", "warning_sent", "conversation_closed", "user_suspended"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "warning_sent" | "conversation_closed" | "user_suspended" | "dismiss";
    alertId: string;
    notes?: string | undefined;
}, {
    action: "warning_sent" | "conversation_closed" | "user_suspended" | "dismiss";
    alertId: string;
    notes?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PharmacyRegistrationInput = z.infer<typeof pharmacyRegistrationSchema>;
export type PharmacyProductInput = z.infer<typeof pharmacyProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type DeliveryProviderRegistrationInput = z.infer<typeof deliveryProviderRegistrationSchema>;
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
