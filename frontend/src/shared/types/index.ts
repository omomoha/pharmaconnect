/**
 * Enums and Types for PharmaConnect Marketplace
 */

// ===== USER ROLES =====
export enum UserRole {
  CUSTOMER = "customer",
  PHARMACY_ADMIN = "pharmacy_admin",
  DELIVERY_ADMIN = "delivery_admin",
  PLATFORM_ADMIN = "platform_admin",
  SUPPORT_ADMIN = "support_admin",
}

// ===== APPROVAL & STATUS ENUMS =====
export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY_FOR_PICKUP = "ready_for_pickup",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum DeliveryAssignmentStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  PICKED_UP = "picked_up",
  IN_TRANSIT = "in_transit",
  ARRIVED = "arrived",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum VehicleType {
  BICYCLE = "bicycle",
  MOTORCYCLE = "motorcycle",
  CAR = "car",
  VAN = "van",
}

export enum ConversationType {
  CUSTOMER_PHARMACY = "customer_pharmacy",
  CUSTOMER_RIDER = "customer_rider",
}

export enum ConversationStatus {
  ACTIVE = "active",
  CLOSED = "closed",
  FLAGGED = "flagged",
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  SYSTEM = "system",
}

export enum FlagAction {
  DISMISSED = "dismissed",
  WARNING_SENT = "warning_sent",
  CONVERSATION_CLOSED = "conversation_closed",
  USER_SUSPENDED = "user_suspended",
}

export enum DrugCategory {
  PAIN_RELIEF = "pain_relief",
  COLD_FLU = "cold_flu",
  VITAMINS = "vitamins",
  FIRST_AID = "first_aid",
  SKIN_CARE = "skin_care",
  DIGESTIVE = "digestive",
  ALLERGY = "allergy",
  EYE_CARE = "eye_care",
  ORAL_CARE = "oral_care",
  BABY_CARE = "baby_care",
  SUPPLEMENTS = "supplements",
  ANTISEPTICS = "antiseptics",
  OTHER = "other",
}

export enum ReviewableType {
  PHARMACY = "pharmacy",
  DELIVERY_PROVIDER = "delivery_provider",
}

export enum NotificationType {
  ORDER_UPDATE = "order_update",
  DELIVERY_UPDATE = "delivery_update",
  CHAT_MESSAGE = "chat_message",
  FLAG_ALERT = "flag_alert",
  REGISTRATION_UPDATE = "registration_update",
  PAYOUT_UPDATE = "payout_update",
  SYSTEM = "system",
}

// ===== USER INTERFACES =====
export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImageUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string; // HH:mm format
  close: string; // HH:mm format
  closed: boolean;
}

export interface ServiceZone {
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface Pharmacy {
  id: string;
  userId: string; // pharmacy_admin user ID
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  licenseNumber: string;
  licenseDocUrl: string; // Pharmacy License document
  cacNumber: string; // Corporate Affairs Commission
  cacDocUrl: string; // CAC Certificate
  ownerName: string;
  ownerIdDocUrl: string; // Owner's Government ID
  operatingHours: OperatingHours;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  rating: number; // 0-5
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PharmacyProduct {
  id: string;
  pharmacyId: string;
  drugCatalogItemId: string; // Reference to OTC whitelist
  sku: string;
  quantity: number;
  price: number;
  discount?: number; // percentage
  expiryDate: Date;
  batchNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrugCatalogItem {
  id: string;
  commonName: string;
  scientificName: string;
  category: DrugCategory;
  strength?: string; // e.g., "500mg"
  form?: string; // e.g., "tablet", "liquid", "capsule"
  isOTC: boolean; // true = approved for OTC, false = prescription/restricted
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== ORDER INTERFACES =====
export interface Order {
  id: string;
  customerId: string;
  pharmacyId: string;
  deliveryProviderId?: string;
  deliveryRiderId?: string;
  deliveryAssignmentId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  pharmacyCommission: number; // amount kept by pharmacy
  deliveryFee: number;
  deliveryCommission: number; // amount kept by delivery provider
  serviceFee: number;
  total: number;
  paymentMethod: string; // "paystack", etc.
  paymentReference?: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  pharmacyProductId: string;
  drugName: string;
  category: DrugCategory;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== DELIVERY PROVIDER INTERFACES =====
export interface DeliveryProvider {
  id: string;
  userId: string; // delivery_admin user ID
  businessName: string;
  email: string;
  phoneNumber: string;
  address: string;
  cacNumber: string;
  cacDocUrl: string; // CAC Certificate
  ownerName: string;
  ownerIdDocUrl: string; // Owner's Government ID
  vehicleDocUrl: string; // Vehicle registration/insurance
  baseFee: number; // Base delivery fee in currency
  perKmFee: number; // Per-km rate in currency
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  rating: number; // 0-5
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryRider {
  id: string;
  deliveryProviderId: string;
  userId: string; // delivery rider user (customer role but linked to provider)
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  profileImageUrl?: string;
  vehicleType: VehicleType;
  vehicleNumber?: string;
  isActive: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: Date;
  rating: number; // 0-5
  totalDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryRiderId: string;
  deliveryProviderId: string;
  status: DeliveryAssignmentStatus;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  estimatedDuration: number; // minutes
  actualDistance?: number; // km
  acceptedAt?: Date;
  pickedUpAt?: Date;
  arrivingAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryVerification {
  id: string;
  deliveryAssignmentId: string;
  customerCode: string; // 6-digit code
  riderCode: string; // 6-digit code
  customerVerifiedAt?: Date;
  riderVerifiedAt?: Date;
  bothVerifiedAt?: Date;
  codeExpiryAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===== CHAT INTERFACES =====
export interface Conversation {
  id: string;
  type: ConversationType;
  customerId: string;
  pharmacyId?: string;
  deliveryRiderId?: string;
  status: ConversationStatus;
  lastMessage?: string;
  lastMessageAt?: Date;
  flaggedAt?: Date;
  flaggedBy?: string; // user ID who flagged it
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  type: MessageType;
  content: string;
  imageUrl?: string; // if type === IMAGE
  readAt?: Date;
  flagged: boolean;
  flaggedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlaggedAlert {
  id: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  suspiciousKeywords: string[];
  nlpClassification: string; // e.g., "prescription_request", "abuse", "normal"
  confidenceScore: number; // 0-1
  action: FlagAction;
  actionTakenBy?: string; // support admin ID
  actionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== REVIEW INTERFACES =====
export interface Review {
  id: string;
  reviewableType: ReviewableType;
  reviewableId: string; // pharmacy or delivery provider ID
  reviewerId: string; // customer ID
  orderId?: string;
  deliveryAssignmentId?: string;
  rating: number; // 1-5
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== NOTIFICATION INTERFACES =====
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // order/delivery/conversation ID
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, unknown>; // additional context
  createdAt: Date;
  updatedAt: Date;
}

// ===== AUDIT LOG INTERFACES =====
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string; // "user", "pharmacy", "order", "delivery_assignment", etc.
  resourceId: string;
  changes?: Record<string, unknown>; // what changed
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure";
  createdAt: Date;
}

// ===== API RESPONSE INTERFACES =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ===== AUTH INTERFACES =====
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AvailableDeliveryProvider {
  id: string;
  businessName: string;
  baseFee: number;
  perKmFee: number;
  estimatedFee: number; // calculated for this delivery
  estimatedDuration: number; // minutes
  rating: number;
  totalReviews: number;
  distance: number; // km from pharmacy to customer
}
