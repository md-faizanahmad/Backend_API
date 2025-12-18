// utils/validateCategoryInput.js
import normalizeCategoryName from "./normalizeCategoryName.js";

export function validateCategoryInput(rawName) {
  const errors = [];

  if (rawName === undefined || rawName === null) {
    errors.push("Category name is required.");
    return { isValid: false, errors, normalizedName: null };
  }

  if (typeof rawName !== "string") {
    errors.push("Category name must be a string.");
    return { isValid: false, errors, normalizedName: null };
  }

  const normalizedName = normalizeCategoryName(rawName);

  if (!normalizedName) {
    errors.push("Category name cannot be empty.");
    return { isValid: false, errors, normalizedName: null };
  }

  if (normalizedName.length < 2) {
    errors.push("Category name must be at least 2 characters.");
  }

  if (normalizedName.length > 40) {
    errors.push("Category name must be at most 40 characters.");
  }

  // Optional: restrict characters
  const allowedPattern = /^[a-zA-Z0-9&' -]+$/;
  if (!allowedPattern.test(normalizedName)) {
    errors.push(
      "Category name has invalid characters. Only letters, numbers, spaces, &, -, ' are allowed."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedName,
  };
}
