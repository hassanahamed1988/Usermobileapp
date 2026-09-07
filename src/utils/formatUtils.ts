/**
 * Formats a category string into a human-readable header by capitalizing
 * the first letter of each word (e.g. "diesel expense" -> "Diesel Expense").
 * @param category Category string to format
 * @returns Formatted category header, or an empty string if category is falsy
 */
export const formatCategoryHeader = (category: string | null): string => {
  if (!category) return '';
  return category
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};
