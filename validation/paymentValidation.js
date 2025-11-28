// api/validators/paymentValidation.js
import { z } from "zod";

export const createOrderSchema = z.object({
  amount: z.number().int().positive("Amount must be positive"),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});
