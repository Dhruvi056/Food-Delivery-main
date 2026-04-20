import mongoose from "mongoose";

const ORDER_STATUSES = [
  "Food Processing",
  "Ready for Pickup",
  "Accepted by Rider",
  "At Restaurant",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, enum: ORDER_STATUSES, default: "Food Processing" },
  // Rider assignment
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false },
  paymentMethod: { type: String, default: "Stripe" },
  estimatedDelivery: { type: Date },
  orderedForSomeoneElse: { type: Boolean, default: false },

  // --- NEW FINANCIAL FIELDS ---
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 50 },

  // Stripe Identifiers (Needed for Refunds & Verification)
  stripeSessionId: { type: String },
  stripePaymentIntentId: { type: String },

  // Refund Management
  isRefunded: { type: Boolean, default: false },
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String },

  // Invoicing
  invoiceNumber: { type: String },
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
