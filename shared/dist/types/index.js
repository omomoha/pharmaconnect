"use strict";
/**
 * Enums and Types for PharmaConnect Marketplace
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketCategory = exports.TicketStatus = exports.SubscriptionStatus = exports.SubscriptionTier = exports.NotificationType = exports.ReviewableType = exports.DrugCategory = exports.FlagAction = exports.MessageType = exports.ConversationStatus = exports.ConversationType = exports.VehicleType = exports.DeliveryAssignmentStatus = exports.PaymentStatus = exports.OrderStatus = exports.ApprovalStatus = exports.UserRole = void 0;
// ===== USER ROLES =====
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "customer";
    UserRole["PHARMACY_ADMIN"] = "pharmacy_admin";
    UserRole["DELIVERY_ADMIN"] = "delivery_admin";
    UserRole["PLATFORM_ADMIN"] = "platform_admin";
    UserRole["SUPPORT_ADMIN"] = "support_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
// ===== APPROVAL & STATUS ENUMS =====
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "pending";
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
    ApprovalStatus["SUSPENDED"] = "suspended";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["READY_FOR_PICKUP"] = "ready_for_pickup";
    OrderStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var DeliveryAssignmentStatus;
(function (DeliveryAssignmentStatus) {
    DeliveryAssignmentStatus["PENDING"] = "pending";
    DeliveryAssignmentStatus["ACCEPTED"] = "accepted";
    DeliveryAssignmentStatus["PICKED_UP"] = "picked_up";
    DeliveryAssignmentStatus["IN_TRANSIT"] = "in_transit";
    DeliveryAssignmentStatus["ARRIVED"] = "arrived";
    DeliveryAssignmentStatus["DELIVERED"] = "delivered";
    DeliveryAssignmentStatus["CANCELLED"] = "cancelled";
})(DeliveryAssignmentStatus || (exports.DeliveryAssignmentStatus = DeliveryAssignmentStatus = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["BICYCLE"] = "bicycle";
    VehicleType["MOTORCYCLE"] = "motorcycle";
    VehicleType["CAR"] = "car";
    VehicleType["VAN"] = "van";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var ConversationType;
(function (ConversationType) {
    ConversationType["CUSTOMER_PHARMACY"] = "customer_pharmacy";
    ConversationType["CUSTOMER_RIDER"] = "customer_rider";
})(ConversationType || (exports.ConversationType = ConversationType = {}));
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["ACTIVE"] = "active";
    ConversationStatus["CLOSED"] = "closed";
    ConversationStatus["FLAGGED"] = "flagged";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
var FlagAction;
(function (FlagAction) {
    FlagAction["DISMISSED"] = "dismissed";
    FlagAction["WARNING_SENT"] = "warning_sent";
    FlagAction["CONVERSATION_CLOSED"] = "conversation_closed";
    FlagAction["USER_SUSPENDED"] = "user_suspended";
})(FlagAction || (exports.FlagAction = FlagAction = {}));
var DrugCategory;
(function (DrugCategory) {
    DrugCategory["PAIN_RELIEF"] = "pain_relief";
    DrugCategory["COLD_FLU"] = "cold_flu";
    DrugCategory["VITAMINS"] = "vitamins";
    DrugCategory["FIRST_AID"] = "first_aid";
    DrugCategory["SKIN_CARE"] = "skin_care";
    DrugCategory["DIGESTIVE"] = "digestive";
    DrugCategory["ALLERGY"] = "allergy";
    DrugCategory["EYE_CARE"] = "eye_care";
    DrugCategory["ORAL_CARE"] = "oral_care";
    DrugCategory["BABY_CARE"] = "baby_care";
    DrugCategory["SUPPLEMENTS"] = "supplements";
    DrugCategory["ANTISEPTICS"] = "antiseptics";
    DrugCategory["OTHER"] = "other";
})(DrugCategory || (exports.DrugCategory = DrugCategory = {}));
var ReviewableType;
(function (ReviewableType) {
    ReviewableType["PHARMACY"] = "pharmacy";
    ReviewableType["DELIVERY_PROVIDER"] = "delivery_provider";
})(ReviewableType || (exports.ReviewableType = ReviewableType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_UPDATE"] = "order_update";
    NotificationType["DELIVERY_UPDATE"] = "delivery_update";
    NotificationType["CHAT_MESSAGE"] = "chat_message";
    NotificationType["FLAG_ALERT"] = "flag_alert";
    NotificationType["REGISTRATION_UPDATE"] = "registration_update";
    NotificationType["PAYOUT_UPDATE"] = "payout_update";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// ===== SUBSCRIPTION TYPES =====
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["PHARMA_LITE"] = "pharma_lite";
    SubscriptionTier["PHARMA_PRO"] = "pharma_pro";
    SubscriptionTier["PHARMA_ELITE"] = "pharma_elite";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELLED"] = "cancelled";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["TRIAL"] = "trial";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
// ===== SUPPORT TICKETS =====
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketCategory;
(function (TicketCategory) {
    TicketCategory["ORDER_ISSUE"] = "order_issue";
    TicketCategory["ACCOUNT"] = "account";
    TicketCategory["PAYMENT"] = "payment";
    TicketCategory["TECHNICAL"] = "technical";
    TicketCategory["OTHER"] = "other";
})(TicketCategory || (exports.TicketCategory = TicketCategory = {}));
