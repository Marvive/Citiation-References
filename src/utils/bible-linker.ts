/**
 * Utility functions for Bible verse detection and Logos linking
 */

import { BIBLE_BOOKS, VERSION_MAPPING } from '../constants/bible-books';

/**
 * Detects Bible verse references in text and converts them to Logos links
 * Supports formats like "John 3:16", "Jn 3:16", "Genesis 1:1-5", "1 John 1:9"
 */
export function linkBibleVerses(text: string, version: string = 'esv'): string {
    const logosVersion = VERSION_MAPPING[version.toLowerCase()] || version;

    let lastBookCode: string | null = null;
    let lastChapter: string | null = null;
    let finalResult = "";
    let lastIndex = 0;

    // Combining regexes to process the string chronologically
    // Pattern 1: Book Chapter:Verse
    // Pattern 2: separator Chapter:Verse
    // Pattern 3: separator Verse (only if Book and Chapter are already known)
    const combinedRegex = /\b((?:[123]|I{1,3})\s*)?([A-Za-z]+)\.?\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b|([;,(])\s*(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b|([,])\s*(\d+)(?:\s*[-–]\s*(\d+))?\b/g;

    let match;
    while ((match = combinedRegex.exec(text)) !== null) {
        // Add text before the match
        finalResult += text.substring(lastIndex, match.index);

        if (match[2]) {
            // Full reference match (Book Chapter:Verse)
            const prefix = match[1];
            const book = match[2];
            const chapter = match[3];
            const verse = match[4];
            const endVerse = match[5];

            let normalizedBook = ((prefix || '') + book).toLowerCase().replace(/\s+/g, '');
            if (!BIBLE_BOOKS[normalizedBook]) {
                normalizedBook = normalizedBook.replace(/^iii/, '3').replace(/^ii/, '2').replace(/^i/, '1');
            }
            const bookCode = BIBLE_BOOKS[normalizedBook];

            if (bookCode) {
                lastBookCode = bookCode;
                lastChapter = chapter;
                const ref = endVerse ? `${bookCode}${chapter}.${verse}-${endVerse}` : `${bookCode}${chapter}.${verse}`;
                finalResult += `[${match[0]}](https://ref.ly/${ref};${logosVersion})`;
            } else {
                lastBookCode = null;
                lastChapter = null;
                finalResult += match[0];
            }
        } else if (match[6] && lastBookCode) {
            // Sequential match (separator Chapter:Verse)
            const separator = match[6];
            const chapter = match[7];
            const verse = match[8];
            const endVerse = match[9];

            lastChapter = chapter;
            const ref = endVerse ? `${lastBookCode}${chapter}.${verse}-${endVerse}` : `${lastBookCode}${chapter}.${verse}`;
            const contentToLink = match[0].substring(separator.length).trim();
            finalResult += `${separator} [${contentToLink}](https://ref.ly/${ref};${logosVersion})`;
        } else if (match[10] && lastBookCode && lastChapter) {
            // Sequential match (separator Verse only)
            const separator = match[10];
            const verse = match[11];
            const endVerse = match[12];

            const ref = endVerse ? `${lastBookCode}${lastChapter}.${verse}-${endVerse}` : `${lastBookCode}${lastChapter}.${verse}`;
            const contentToLink = match[0].substring(separator.length).trim();
            finalResult += `${separator} [${contentToLink}](https://ref.ly/${ref};${logosVersion})`;
        } else {
            finalResult += match[0];
        }

        lastIndex = combinedRegex.lastIndex;
    }

    finalResult += text.substring(lastIndex);
    return finalResult;
}

/**
 * Returns the Logos version code for a given translation
 */
export function getLogosVersionCode(version: string): string {
    return VERSION_MAPPING[version.toLowerCase()] || version;
}
