/**
 * Mock for @pharmaconnect/shared package
 */

// Constants
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  PHARMACIES: 'pharmacies',
  PHARMACY_PRODUCTS: 'pharmacy_products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PAYMENTS: 'payments',
  DELIVERY_PROVIDERS: 'delivery_providers',
  DELIVERY_ASSIGNMENTS: 'delivery_assignments',
  DELIVERY_VERIFICATIONS: 'delivery_verifications',
  CHATS: 'chats',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  REVIEWS: 'reviews',
  MODERATION_FLAGS: 'moderation_flags',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  FLAGGED_ALERTS: 'flagged_alerts',
};

export const COMMISSION = {
  PHARMACY_COMMISSION_PERCENT: 5,
  SERVICE_FEE_PERCENT: 10,
};

export const DELIVERY = {
  SECURITY_CODE_EXPIRY_HOURS: 24,
};

// Enums
export enum UserRole {
  CUSTOMER = 'customer',
  PHARMACY = 'pharmacy',
  DELIVERY = 'delivery',
  ADMIN = 'admin',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum DeliveryAssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PICKED_UP = 'picked_up',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DrugCategory {
  PAIN_RELIEF = 'pain_relief',
  FEVER = 'fever',
  COUGH = 'cough',
  COLD = 'cold',
  ALLERGY = 'allergy',
  DIGESTIVE = 'digestive',
  VITAMINS = 'vitamins',
  TOPICAL = 'topical',
  OTHER = 'other',
}

export enum ConversationType {
  CUSTOMER_PHARMACY = 'customer_pharmacy',
  CUSTOMER_RIDER = 'customer_rider',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  FLAGGED = 'flagged',
  CLOSED = 'closed',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

export enum FlagAction {
  DISMISSED = 'dismissed',
  APPROVED = 'approved',
  WARNED = 'warned',
}

export interface Order {
  id: string;
  customerId: string;
  pharmacyId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  pharmacyCommission: number;
  deliveryFee: number;
  deliveryCommission: number;
  serviceFee: number;
  total: number;
  paymentMethod: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paymentReference?: string;
  cancellationReason?: string;
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

export interface DeliveryProvider {
  id: string;
  userId: string;
  businessName: string;
  email: string;
  phoneNumber: string;
  address: string;
  cacNumber: string;
  cacDocUrl: string;
  ownerName: string;
  ownerIdDocUrl: string;
  vehicleDocUrl: string;
  baseFee: number;
  perKmFee: number;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableDeliveryProvider {
  id: string;
  businessName: string;
  baseFee: number;
  perKmFee: number;
  estimatedFee: number;
  estimatedDuration: number;
  rating: number;
  totalReviews: number;
  distance: number;
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
  estimatedDuration: number;
  actualDistance: number;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  arrivingAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

export interface DeliveryVerification {
  id: string;
  deliveryAssignmentId: string;
  customerCode: string;
  riderCode: string;
  codeExpiryAt: Date;
  createdAt: Date;
  updatedAt: Date;
  customerVerifiedAt?: Date;
  riderVerifiedAt?: Date;
  bothVerifiedAt?: Date;
}

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
  imageUrl?: string;
  flagged: boolean;
  flaggedReason?: string;
  readAt?: Date;
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
  nlpClassification: string;
  confidenceScore: number;
  action: FlagAction;
  actionTakenBy?: string;
  actionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pharmacy {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  licenseNumber: string;
  licenseDocUrl: string;
  cacNumber: string;
  cacDocUrl: string;
  ownerName: string;
  ownerIdDocUrl: string;
  operatingHours: OperatingHours;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PharmacyProduct {
  id: string;
  pharmacyId: string;
  drugCatalogItemId: string;
  sku: string;
  quantity: number;
  price: number;
  discount?: number;
  expiryDate: Date;
  batchNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  [key: string]: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
