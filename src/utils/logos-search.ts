/**
 * Utility functions for Logos Bible Software integration
 */

/**
 * Builds a Logos Bible Software search URL using the logos4: URI scheme
 * @param query - The text to search for
 * @param searchType - 'lexical' for precise search, 'semantic' for smart search
 * @returns The fully-formed logos4:Search URI
 */
export function buildLogosSearchUrl(query: string, searchType: 'lexical' | 'semantic' = 'lexical'): string {
    const encodedQuery = encodeURIComponent(query);
    const typeParam = searchType === 'semantic' ? 'Semantic' : 'Lexical';
    return `logos4:Search;t=${typeParam};s=${encodedQuery}`;
}
