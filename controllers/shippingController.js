export async function createShipment(order) {
  try {
    const token = await getShiprocketToken();

    const payload = {
      order_id: order._id,
      order_date: new Date().toISOString(),
      pickup_location: "Warehouse A",
      channel_id: "",
      comment: "Auto-generated Order",

      billing_customer_name: order.shippingAddress.fullName,
      billing_address: order.shippingAddress.street,
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.pincode,
      billing_state: order.shippingAddress.state,
      billing_country: "India",
      billing_email: "user@test.com",
      billing_phone: order.shippingAddress.phone,

      order_items: order.items.map((i) => ({
        name: i.product.name,
        qty: i.qty,
        price: i.price,
      })),

      payment_method: "Prepaid",
      shipping_charges: 0,
      total_discount: 0,
      sub_total: order.totalAmount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data;
  } catch (err) {
    console.error("Shipment error:", err.response?.data);
    return null;
  }
}
