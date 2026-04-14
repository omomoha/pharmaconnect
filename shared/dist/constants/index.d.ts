/**
 * Constants for PharmaConnect Marketplace
 */
export declare const AUTH: {
    readonly OTP_EXPIRY_MINUTES: 5;
    readonly MAX_OTP_RETRIES: 3;
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly LOGIN_LOCKOUT_MINUTES: 15;
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly SESSION_TIMEOUT_MINUTES: 60;
};
export declare const PAGINATION: {
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly MIN_LIMIT: 1;
};
export declare const RATE_LIMITS: {
    readonly PUBLIC_REQUESTS_PER_MINUTE: 60;
    readonly AUTHENTICATED_REQUESTS_PER_MINUTE: 120;
    readonly ADMIN_REQUESTS_PER_MINUTE: 300;
    readonly CHAT_MESSAGES_PER_MINUTE: 30;
};
export declare const FILE_UPLOAD: {
    readonly MAX_DOCUMENT_SIZE_MB: 10;
    readonly MAX_DOCUMENT_SIZE_BYTES: number;
    readonly MAX_IMAGE_SIZE_MB: 5;
    readonly MAX_IMAGE_SIZE_BYTES: number;
    readonly ALLOWED_DOC_TYPES: readonly ["application/pdf", "image/jpeg", "image/png"];
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly ALLOWED_DOC_EXTENSIONS: readonly [".pdf", ".jpg", ".jpeg", ".png"];
    readonly ALLOWED_IMAGE_EXTENSIONS: readonly [".jpg", ".jpeg", ".png", ".webp"];
};
export declare const DELIVERY: {
    readonly SECURITY_CODE_LENGTH: 6;
    readonly SECURITY_CODE_MAX_ATTEMPTS: 3;
    readonly SECURITY_CODE_EXPIRY_HOURS: 2;
    readonly GPS_UPDATE_INTERVAL_SECONDS: 10;
    readonly MAX_DELIVERY_TIME_HOURS: 4;
    readonly INITIAL_ASSIGNMENT_TIMEOUT_MINUTES: 5;
};
export declare const COMMISSION: {
    readonly PHARMACY_COMMISSION_PERCENT: 0.1;
    readonly DELIVERY_COMMISSION_PERCENT: 0.1;
    readonly SERVICE_FEE_PERCENT: 2;
};
export declare const SUBSCRIPTION_TIERS: {
    readonly PHARMA_LITE: {
        readonly id: "pharma_lite";
        readonly name: "PharmaLite";
        readonly priceNGN: 0;
        readonly maxProducts: 50;
        readonly features: readonly ["basic_listing", "order_management", "basic_analytics"];
        readonly commissionPercent: 0.1;
        readonly aiChatEnabled: false;
        readonly prioritySupport: false;
        readonly promotedListing: false;
        readonly customStorefront: false;
    };
    readonly PHARMA_PRO: {
        readonly id: "pharma_pro";
        readonly name: "PharmaPro";
        readonly priceNGN: 15000;
        readonly maxProducts: 500;
        readonly features: readonly ["basic_listing", "order_management", "advanced_analytics", "ai_chat_assistant", "priority_support", "promoted_listing"];
        readonly commissionPercent: 0.1;
        readonly aiChatEnabled: true;
        readonly prioritySupport: true;
        readonly promotedListing: true;
        readonly customStorefront: false;
    };
    readonly PHARMA_ELITE: {
        readonly id: "pharma_elite";
        readonly name: "PharmaElite";
        readonly priceNGN: 25000;
        readonly maxProducts: -1;
        readonly features: readonly ["basic_listing", "order_management", "advanced_analytics", "ai_chat_assistant", "priority_support", "promoted_listing", "custom_storefront", "dedicated_account_manager", "bulk_upload", "api_access"];
        readonly commissionPercent: 0.1;
        readonly aiChatEnabled: true;
        readonly prioritySupport: true;
        readonly promotedListing: true;
        readonly customStorefront: true;
    };
};
export declare const SEARCH: {
    readonly DEFAULT_RADIUS_KM: 10;
    readonly MAX_RADIUS_KM: 50;
    readonly NEARBY_PHARMACY_LIMIT: 20;
};
export declare const PRESCRIPTION_KEYWORDS: {
    readonly ANTIBIOTICS: readonly ["amoxicillin", "penicillin", "azithromycin", "doxycycline", "tetracycline", "erythromycin", "ciprofloxacin", "levofloxacin", "ampicillin", "cephalexin"];
    readonly CONTROLLED: readonly ["codeine", "morphine", "tramadol", "valium", "diazepam", "lorazepam", "xanax", "alprazolam", "oxycodone", "hydrocodone", "methadone"];
    readonly PRESCRIPTION_PHRASES: readonly ["prescription required", "prescription only", "rx only", "doctor's prescription", "controlled substance", "by prescription", "schedule 2", "schedule 3", "scheduled drug"];
    readonly CONTEXTUAL: readonly ["for my doctor", "prescribed by", "doctor prescribed", "medical condition", "serious illness", "major surgery"];
};
export declare const OTC_WHITELIST: {
    readonly COMMON_OTCS: readonly ["paracetamol", "acetaminophen", "ibuprofen", "naproxen", "aspirin", "diphenhydramine", "loratadine", "cetirizine", "omeprazole", "ranitidine", "antacid", "calcium carbonate", "vitamin c", "multivitamin", "zinc", "vitamin d", "vitamin b12", "folic acid", "iron supplement", "magnesium", "cough syrup", "decongestant", "antihistamine", "hydrocortisone cream", "antibacterial ointment", "bandage", "gauze", "thermometer", "blood pressure meter"];
};
export declare const SOCKET_EVENTS: {
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly CHAT_ROOM_JOIN: "chat:join_room";
    readonly CHAT_ROOM_LEAVE: "chat:leave_room";
    readonly CHAT_MESSAGE_SEND: "chat:send_message";
    readonly CHAT_MESSAGE_RECEIVE: "chat:receive_message";
    readonly CHAT_MESSAGE_READ: "chat:mark_read";
    readonly CHAT_TYPING: "chat:typing";
    readonly CHAT_STOPPED_TYPING: "chat:stopped_typing";
    readonly CHAT_CONVERSATION_UPDATED: "chat:conversation_updated";
    readonly DELIVERY_LOCATION_UPDATE: "delivery:location_update";
    readonly DELIVERY_STATUS_CHANGE: "delivery:status_changed";
    readonly DELIVERY_RIDER_ARRIVING: "delivery:rider_arriving";
    readonly DELIVERY_COMPLETED: "delivery:completed";
    readonly DELIVERY_CANCELLED: "delivery:cancelled";
    readonly NOTIFICATION_RECEIVED: "notification:received";
    readonly NOTIFICATION_READ: "notification:read";
    readonly ERROR: "error";
};
export declare const FIRESTORE_COLLECTIONS: {
    readonly USERS: "users";
    readonly PHARMACIES: "pharmacies";
    readonly DRUG_CATALOG: "drug_catalog";
    readonly PHARMACY_PRODUCTS: "pharmacy_products";
    readonly ORDERS: "orders";
    readonly ORDER_ITEMS: "order_items";
    readonly DELIVERY_PROVIDERS: "delivery_providers";
    readonly DELIVERY_RIDERS: "delivery_riders";
    readonly DELIVERY_ASSIGNMENTS: "delivery_assignments";
    readonly DELIVERY_VERIFICATIONS: "delivery_verifications";
    readonly CONVERSATIONS: "conversations";
    readonly MESSAGES: "messages";
    readonly FLAGGED_ALERTS: "flagged_alerts";
    readonly REVIEWS: "reviews";
    readonly NOTIFICATIONS: "notifications";
    readonly AUDIT_LOGS: "audit_logs";
    readonly PHARMACY_SUBSCRIPTIONS: "pharmacy_subscriptions";
    readonly SUBSCRIPTION_INVOICES: "subscription_invoices";
    readonly PAYOUT_REQUESTS: "payout_requests";
    readonly DELIVERY_LOCATION_HISTORY: "delivery_location_history";
};
export declare const VALIDATION: {
    readonly EMAIL_REGEX: RegExp;
    readonly PHONE_REGEX: RegExp;
    readonly PASSWORD_REGEX: RegExp;
    readonly OTP_REGEX: RegExp;
    readonly SECURITY_CODE_REGEX: RegExp;
};
export declare const ERROR_CODES: {
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_NOT_ACTIVE: "USER_NOT_ACTIVE";
    readonly INVALID_OTP: "INVALID_OTP";
    readonly OTP_EXPIRED: "OTP_EXPIRED";
    readonly OTP_MAX_RETRIES: "OTP_MAX_RETRIES";
    readonly LOGIN_LOCKED: "LOGIN_LOCKED";
    readonly WEAK_PASSWORD: "WEAK_PASSWORD";
    readonly EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS";
    readonly PHONE_ALREADY_EXISTS: "PHONE_ALREADY_EXISTS";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INVALID_FILE: "INVALID_FILE";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly PHARMACY_NOT_FOUND: "PHARMACY_NOT_FOUND";
    readonly PHARMACY_NOT_APPROVED: "PHARMACY_NOT_APPROVED";
    readonly PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND";
    readonly PRODUCT_OUT_OF_STOCK: "PRODUCT_OUT_OF_STOCK";
    readonly ORDER_NOT_FOUND: "ORDER_NOT_FOUND";
    readonly DELIVERY_PROVIDER_NOT_FOUND: "DELIVERY_PROVIDER_NOT_FOUND";
    readonly NO_DELIVERY_PROVIDERS_AVAILABLE: "NO_DELIVERY_PROVIDERS_AVAILABLE";
    readonly DELIVERY_ASSIGNMENT_NOT_FOUND: "DELIVERY_ASSIGNMENT_NOT_FOUND";
    readonly INVALID_SECURITY_CODE: "INVALID_SECURITY_CODE";
    readonly SECURITY_CODE_EXPIRED: "SECURITY_CODE_EXPIRED";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED";
    readonly PRESCRIPTION_DRUG_DETECTED: "PRESCRIPTION_DRUG_DETECTED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
};
