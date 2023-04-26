/**
 * Replace any un-matched surrogate pairs with \uFFFD so that
 * the string is guaranteed to be a valid utf8 string.
 */
export declare function removeInvalidUnicode(str: string): string;
/**
 * Return true if there are no un-matched surrogate pairs, otherwise
 * return false.
 */
export declare function isValidUnicode(str: string): boolean;
/**
 * Throw an error if the string has unmatched surrogate pairs
 */
export default function assertValidUnicode(str: string): string;
