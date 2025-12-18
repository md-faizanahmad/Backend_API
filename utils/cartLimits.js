// utils/cartLimits.js
export function getMaxQtyForProduct(product) {
  if (product.price >= 60000) return 1;
  if (product.price >= 40000) return 2;
  if (product.price >= 20000) return 3;
  return 6;
}
