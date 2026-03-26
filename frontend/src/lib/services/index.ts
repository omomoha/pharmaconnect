/**
 * Barrel export of all service modules
 */

export * as authService from './auth.service';
export * as pharmacyService from './pharmacy.service';
export * as orderService from './order.service';
export * as deliveryService from './delivery.service';
export * as paymentService from './payment.service';
export * as chatService from './chat.service';
export * as adminService from './admin.service';

// Re-export commonly used functions for convenience
export {
  getProfile,
  updateProfile,
} from './auth.service';
export {
  getNearbyPharmacies,
  searchPharmacies,
  getPharmacy,
  getPharmacyProducts,
  registerPharmacy,
  addProduct,
} from './pharmacy.service';
export {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} from './order.service';
export {
  registerProvider,
  getAvailableProviders,
  createAssignment,
  getAssignment,
  updateAssignmentStatus,
  verifySecurityCode,
} from './delivery.service';
export {
  initializePayment,
  verifyPayment,
  requestRefund,
} from './payment.service';
export {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  closeConversation,
} from './chat.service';
export {
  getPendingPharmacies,
  approvePharmacy,
  rejectPharmacy,
  getPendingProviders,
  approveProvider,
  rejectProvider,
  getFlaggedAlerts,
  reviewFlaggedAlert,
  getDashboard,
  getTransactions,
} from './admin.service';
