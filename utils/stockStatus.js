export function getStockStatus(stock) {
  if (stock < 2) return "dead";
  if (stock < 5) return "low";
  return "positive";
}
