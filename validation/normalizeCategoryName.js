// utils/normalizeCategoryName.js

export default function normalizeCategoryName(rawName) {
  if (typeof rawName !== "string") return null;

  let name = rawName.trim();
  if (!name) return null;

  // Collapse multiple spaces
  name = name.replace(/\s+/g, " ");

  // Simple title case: capitalize each word
  name = name
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""
    )
    .join(" ");

  return name;
}
