"use strict";
/**
 * Constants for PharmaConnect Marketplace
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.ERROR_CODES = exports.VALIDATION = exports.FIRESTORE_COLLECTIONS = exports.SOCKET_EVENTS = exports.OTC_WHITELIST = exports.PRESCRIPTION_KEYWORDS = exports.SEARCH = exports.SUBSCRIPTION_TIERS = exports.COMMISSION = exports.DELIVERY = exports.FILE_UPLOAD = exports.RATE_LIMITS = exports.PAGINATION = exports.AUTH = void 0;
// ===== AUTHENTICATION CONSTANTS =====
exports.AUTH = {
    OTP_EXPIRY_MINUTES: 5,
    MAX_OTP_RETRIES: 3,
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_LOCKOUT_MINUTES: 15,
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT_MINUTES: 60,
};
// ===== PAGINATION CONSTANTS =====
exports.PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
};
// ===== RATE LIMITING CONSTANTS =====
exports.RATE_LIMITS = {
    PUBLIC_REQUESTS_PER_MINUTE: 60,
    AUTHENTICATED_REQUESTS_PER_MINUTE: 120,
    ADMIN_REQUESTS_PER_MINUTE: 300,
    CHAT_MESSAGES_PER_MINUTE: 30,
};
// ===== FILE UPLOAD CONSTANTS =====
exports.FILE_UPLOAD = {
    MAX_DOCUMENT_SIZE_MB: 10,
    MAX_DOCUMENT_SIZE_BYTES: 10 * 1024 * 1024,
    MAX_IMAGE_SIZE_MB: 5,
    MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_DOC_TYPES: ["application/pdf", "image/jpeg", "image/png"],
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
    ALLOWED_DOC_EXTENSIONS: [".pdf", ".jpg", ".jpeg", ".png"],
    ALLOWED_IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
};
// ===== DELIVERY CONSTANTS =====
exports.DELIVERY = {
    SECURITY_CODE_LENGTH: 6,
    SECURITY_CODE_MAX_ATTEMPTS: 3,
    SECURITY_CODE_EXPIRY_HOURS: 2,
    GPS_UPDATE_INTERVAL_SECONDS: 10,
    MAX_DELIVERY_TIME_HOURS: 4,
    INITIAL_ASSIGNMENT_TIMEOUT_MINUTES: 5,
};
// ===== COMMISSION & PRICING CONSTANTS =====
exports.COMMISSION = {
    PHARMACY_COMMISSION_PERCENT: 0.1,
    DELIVERY_COMMISSION_PERCENT: 0.1,
    SERVICE_FEE_PERCENT: 2,
};
// ===== SUBSCRIPTION TIER CONSTANTS =====
exports.SUBSCRIPTION_TIERS = {
    PHARMA_LITE: {
        id: "pharma_lite",
        name: "PharmaLite",
        priceNGN: 0,
        maxProducts: 50,
        features: ["basic_listing", "order_management", "basic_analytics"],
        commissionPercent: 0.1,
        aiChatEnabled: false,
        prioritySupport: false,
        promotedListing: false,
        customStorefront: false,
    },
    PHARMA_PRO: {
        id: "pharma_pro",
        name: "PharmaPro",
        priceNGN: 15000,
        maxProducts: 500,
        features: [
            "basic_listing",
            "order_management",
            "advanced_analytics",
            "ai_chat_assistant",
            "priority_support",
            "promoted_listing",
        ],
        commissionPercent: 0.1,
        aiChatEnabled: true,
        prioritySupport: true,
        promotedListing: true,
        customStorefront: false,
    },
    PHARMA_ELITE: {
        id: "pharma_elite",
        name: "PharmaElite",
        priceNGN: 25000,
        maxProducts: -1, // Unlimited
        features: [
            "basic_listing",
            "order_management",
            "advanced_analytics",
            "ai_chat_assistant",
            "priority_support",
            "promoted_listing",
            "custom_storefront",
            "dedicated_account_manager",
            "bulk_upload",
            "api_access",
        ],
        commissionPercent: 0.1,
        aiChatEnabled: true,
        prioritySupport: true,
        promotedListing: true,
        customStorefront: true,
    },
};
// ===== SEARCH CONSTANTS =====
exports.SEARCH = {
    DEFAULT_RADIUS_KM: 10,
    MAX_RADIUS_KM: 50,
    NEARBY_PHARMACY_LIMIT: 20,
};
// ===== PRESCRIPTION DETECTION KEYWORDS =====
exports.PRESCRIPTION_KEYWORDS = {
    // Antibiotic keywords
    ANTIBIOTICS: [
        "amoxicillin",
        "penicillin",
        "azithromycin",
        "doxycycline",
        "tetracycline",
        "erythromycin",
        "ciprofloxacin",
        "levofloxacin",
        "ampicillin",
        "cephalexin",
    ],
    // Controlled substance keywords
    CONTROLLED: [
        "codeine",
        "morphine",
        "tramadol",
        "valium",
        "diazepam",
        "lorazepam",
        "xanax",
        "alprazolam",
        "oxycodone",
        "hydrocodone",
        "methadone",
    ],
    // Prescription-only phrases
    PRESCRIPTION_PHRASES: [
        "prescription required",
        "prescription only",
        "rx only",
        "doctor's prescription",
        "controlled substance",
        "by prescription",
        "schedule 2",
        "schedule 3",
        "scheduled drug",
    ],
    // Contextual phrases that suggest prescription need
    CONTEXTUAL: [
        "for my doctor",
        "prescribed by",
        "doctor prescribed",
        "medical condition",
        "serious illness",
        "major surgery",
    ],
};
// ===== OTC WHITELIST (Common OTC Drugs) =====
exports.OTC_WHITELIST = {
    COMMON_OTCS: [
        "paracetamol",
        "acetaminophen",
        "ibuprofen",
        "naproxen",
        "aspirin",
        "diphenhydramine",
        "loratadine",
        "cetirizine",
        "omeprazole",
        "ranitidine",
        "antacid",
        "calcium carbonate",
        "vitamin c",
        "multivitamin",
        "zinc",
        "vitamin d",
        "vitamin b12",
        "folic acid",
        "iron supplement",
        "magnesium",
        "cough syrup",
        "decongestant",
        "antihistamine",
        "hydrocortisone cream",
        "antibacterial ointment",
        "bandage",
        "gauze",
        "thermometer",
        "blood pressure meter",
    ],
};
// ===== SOCKET.IO EVENTS =====
exports.SOCKET_EVENTS = {
    // Connection
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    // Chat Events
    CHAT_ROOM_JOIN: "chat:join_room",
    CHAT_ROOM_LEAVE: "chat:leave_room",
    CHAT_MESSAGE_SEND: "chat:send_message",
    CHAT_MESSAGE_RECEIVE: "chat:receive_message",
    CHAT_MESSAGE_READ: "chat:mark_read",
    CHAT_TYPING: "chat:typing",
    CHAT_STOPPED_TYPING: "chat:stopped_typing",
    CHAT_CONVERSATION_UPDATED: "chat:conversation_updated",
    // Delivery Tracking
    DELIVERY_LOCATION_UPDATE: "delivery:location_update",
    DELIVERY_STATUS_CHANGE: "delivery:status_changed",
    DELIVERY_RIDER_ARRIVING: "delivery:rider_arriving",
    DELIVERY_COMPLETED: "delivery:completed",
    DELIVERY_CANCELLED: "delivery:cancelled",
    // Notifications
    NOTIFICATION_RECEIVED: "notification:received",
    NOTIFICATION_READ: "notification:read",
    // Error handling
    ERROR: "error",
};
// ===== FIRESTORE COLLECTIONS =====
exports.FIRESTORE_COLLECTIONS = {
    USERS: "users",
    PHARMACIES: "pharmacies",
    DRUG_CATALOG: "drug_catalog",
    PHARMACY_PRODUCTS: "pharmacy_products",
    ORDERS: "orders",
    ORDER_ITEMS: "order_items",
    DELIVERY_PROVIDERS: "delivery_providers",
    DELIVERY_RIDERS: "delivery_riders",
    DELIVERY_ASSIGNMENTS: "delivery_assignments",
    DELIVERY_VERIFICATIONS: "delivery_verifications",
    CONVERSATIONS: "conversations",
    MESSAGES: "messages",
    FLAGGED_ALERTS: "flagged_alerts",
    REVIEWS: "reviews",
    NOTIFICATIONS: "notifications",
    AUDIT_LOGS: "audit_logs",
    PHARMACY_SUBSCRIPTIONS: "pharmacy_subscriptions",
    SUBSCRIPTION_INVOICES: "subscription_invoices",
    PAYOUT_REQUESTS: "payout_requests",
    DELIVERY_LOCATION_HISTORY: "delivery_location_history",
};
// ===== VALIDATION RULES =====
exports.VALIDATION = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^[0-9]{10,15}$/,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    OTP_REGEX: /^[0-9]{6}$/,
    SECURITY_CODE_REGEX: /^[0-9]{6}$/,
};
// ===== ERROR CODES =====
exports.ERROR_CODES = {
    // Auth errors
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    USER_NOT_FOUND: "USER_NOT_FOUND",
    USER_NOT_ACTIVE: "USER_NOT_ACTIVE",
    INVALID_OTP: "INVALID_OTP",
    OTP_EXPIRED: "OTP_EXPIRED",
    OTP_MAX_RETRIES: "OTP_MAX_RETRIES",
    LOGIN_LOCKED: "LOGIN_LOCKED",
    WEAK_PASSWORD: "WEAK_PASSWORD",
    EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
    PHONE_ALREADY_EXISTS: "PHONE_ALREADY_EXISTS",
    // Authorization errors
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
    // Validation errors
    INVALID_INPUT: "INVALID_INPUT",
    MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
    INVALID_FILE: "INVALID_FILE",
    FILE_TOO_LARGE: "FILE_TOO_LARGE",
    // Business logic errors
    PHARMACY_NOT_FOUND: "PHARMACY_NOT_FOUND",
    PHARMACY_NOT_APPROVED: "PHARMACY_NOT_APPROVED",
    PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
    PRODUCT_OUT_OF_STOCK: "PRODUCT_OUT_OF_STOCK",
    ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
    DELIVERY_PROVIDER_NOT_FOUND: "DELIVERY_PROVIDER_NOT_FOUND",
    NO_DELIVERY_PROVIDERS_AVAILABLE: "NO_DELIVERY_PROVIDERS_AVAILABLE",
    DELIVERY_ASSIGNMENT_NOT_FOUND: "DELIVERY_ASSIGNMENT_NOT_FOUND",
    INVALID_SECURITY_CODE: "INVALID_SECURITY_CODE",
    SECURITY_CODE_EXPIRED: "SECURITY_CODE_EXPIRED",
    // Payment errors
    PAYMENT_FAILED: "PAYMENT_FAILED",
    PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED",
    // Prescription detection
    PRESCRIPTION_DRUG_DETECTED: "PRESCRIPTION_DRUG_DETECTED",
    // Rate limiting
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    // Server errors
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};
// ===== HTTP STATUS CODES =====
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
};
