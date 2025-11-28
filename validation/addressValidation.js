// // api/validation/addressValidation.js
// import { z } from "zod";

// export const addressSchema = z.object({
//   fullName: z.string().min(2).max(80),
//   phone: z.string().min(8).max(15),
//   street: z.string().min(3).max(200),
//   city: z.string().min(2).max(80),
//   state: z.string().min(2).max(80),
//   pincode: z.string().min(4).max(10),
//   landmark: z.string().max(200).optional().or(z.literal("")),
//   isDefault: z.boolean().optional(),
// });

// export function validateAddress(req, res, next) {
//   try {
//     req.body = addressSchema.parse(req.body);
//     next();
//   } catch (err) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid address data",
//       errors: err.errors,
//     });
//   }
// }
/////////////////////////new from old chat
// api/validators/addressValidation.js
import { z } from "zod";

// Zod schema for address
export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Phone must be valid").max(15),
  street: z.string().min(3, "Street required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().min(4, "Pincode must be valid").max(10),
  landmark: z.string().optional(),
});

// Validation middleware
export function validateAddress(req, res, next) {
  const parsed = addressSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid address data",
      errors: parsed.error.format(), // ✔ no flatten() warning
    });
  }

  req.validatedAddress = parsed.data;
  next();
}

export default validateAddress;
