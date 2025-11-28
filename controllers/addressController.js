// // api/controllers/addressController.js
// import User from "../models/User.js";

// /**
//  * GET /api/addresses
//  * Return all addresses for logged-in user
//  */
// export async function getAddresses(req, res) {
//   try {
//     const user = await User.findById(req.userId).select("addresses");
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     return res.json({ success: true, addresses: user.addresses || [] });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: err.message || "Failed to fetch" });
//   }
// }

// /**
//  * POST /api/addresses/add
//  */
// export async function addAddress(req, res) {
//   try {
//     const user = await User.findById(req.userId).select("addresses");

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     const newAddress = {
//       fullName: req.body.fullName,
//       phone: req.body.phone,
//       street: req.body.street,
//       city: req.body.city,
//       state: req.body.state,
//       pincode: req.body.pincode,
//       landmark: req.body.landmark ?? "",
//       isDefault: user.addresses.length === 0, // first address auto default
//     };

//     user.addresses.push(newAddress);
//     await user.save();

//     return res.json({ success: true, message: "Address added" });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: err.message || "Failed to add" });
//   }
// }

// /**
//  * DELETE /api/addresses/:addressId
//  */
// export async function deleteAddress(req, res) {
//   try {
//     const { addressId } = req.params;
//     const user = await User.findById(req.userId).select("addresses");

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     user.addresses = user.addresses.filter(
//       (a) => a._id.toString() !== addressId
//     );

//     // if default removed, mark first one as default
//     if (!user.addresses.some((a) => a.isDefault) && user.addresses[0]) {
//       user.addresses[0].isDefault = true;
//     }

//     await user.save();
//     return res.json({ success: true, message: "Address deleted" });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: err.message || "Failed to delete" });
//   }
// }

// /**
//  * PUT /api/addresses/default/:addressId
//  */
// export async function setDefaultAddress(req, res) {
//   try {
//     const { addressId } = req.params;
//     const user = await User.findById(req.userId).select("addresses");

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     user.addresses.forEach((a) => {
//       a.isDefault = a._id.toString() === addressId;
//     });

//     await user.save();
//     return res.json({ success: true });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: err.message || "Failed to update" });
//   }
// }

// /**
//  * PUT /api/addresses/update/:id
//  */
// export async function updateAddress(req, res) {
//   try {
//     const { id } = req.params;

//     const user = await User.findOneAndUpdate(
//       { _id: req.userId, "addresses._id": id },
//       {
//         $set: {
//           "addresses.$.fullName": req.body.fullName,
//           "addresses.$.phone": req.body.phone,
//           "addresses.$.street": req.body.street,
//           "addresses.$.city": req.body.city,
//           "addresses.$.state": req.body.state,
//           "addresses.$.pincode": req.body.pincode,
//           "addresses.$.landmark": req.body.landmark ?? "",
//         },
//       },
//       { new: true }
//     ).select("addresses");

//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Address not found" });
//     }

//     return res.json({
//       success: true,
//       message: "Address updated successfully",
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: err.message || "Failed to update" });
//   }
// }
////////////////////////// new updated with zod
// api/controllers/addressController.js
import User from "../models/User.js";

/**
 * GET /api/addresses
 * Return all addresses for logged-in user
 */
export async function getAddresses(req, res) {
  try {
    const user = await User.findById(req.userId).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch addresses",
    });
  }
}

/**
 * POST /api/addresses/add
 */
export async function addAddress(req, res) {
  try {
    // Zod-validated data
    const data = req.validatedAddress;

    const user = await User.findById(req.userId).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newAddress = {
      ...data,
      isDefault: user.addresses.length === 0, // auto default for first address
    };

    user.addresses.push(newAddress);
    await user.save();

    return res.json({
      success: true,
      message: "Address added successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to add address",
    });
  }
}

/**
 * DELETE /api/addresses/:addressId
 */
export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.userId).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== addressId
    );

    // Ensure at least one address is default
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Address deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete address",
    });
  }
}

/**
 * PUT /api/addresses/default/:addressId
 */
export async function setDefaultAddress(req, res) {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.userId).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === addressId;
    });

    await user.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update default address",
    });
  }
}

/**
 * PUT /api/addresses/update/:id
 */
export async function updateAddress(req, res) {
  try {
    const { id } = req.params;
    const data = req.validatedAddress; // validated fields

    const user = await User.findOneAndUpdate(
      { _id: req.userId, "addresses._id": id },
      {
        $set: {
          "addresses.$.fullName": data.fullName,
          "addresses.$.phone": data.phone,
          "addresses.$.street": data.street,
          "addresses.$.city": data.city,
          "addresses.$.state": data.state,
          "addresses.$.pincode": data.pincode,
          "addresses.$.landmark": data.landmark ?? "",
        },
      },
      { new: true }
    ).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.json({
      success: true,
      message: "Address updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update address",
    });
  }
}
