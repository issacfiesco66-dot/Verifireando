import { clsx } from 'clsx'

/**
 * Utility function to combine class names conditionally
 * @param {...any} inputs - Class names or conditional objects
 * @returns {string} Combined class names
 */
export function cn(...inputs) {
  return clsx(inputs)
}

export default cn