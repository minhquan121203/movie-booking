import slugify from "slugify";

/**
 * Generate slug from text using consistent options
 * @param {string} text - Text to convert to slug
 * @param {object} options - Additional slugify options
 * @returns {string} Generated slug
 */
export function generateSlug(text, options = {}) {
  if (!text || typeof text !== "string") {
    return "";
  }

  const defaultOptions = {
    lower: true,
    strict: true,
    locale: "vi",
    remove: /[*+~.()'"!:@]/g,
  };

  return slugify(text, { ...defaultOptions, ...options });
}

/**
 * Generate unique slug by appending number if needed
 * @param {string} text - Text to convert to slug
 * @param {Function} checkExists - Function to check if slug exists (should return Promise<boolean>)
 * @param {object} options - Additional slugify options
 * @returns {Promise<string>} Unique slug
 */
export async function generateUniqueSlug(text, checkExists, options = {}) {
  let baseSlug = generateSlug(text, options);
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid slug
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  // Slug should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with hyphen
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

export default {
  generateSlug,
  generateUniqueSlug,
  isValidSlug,
};
