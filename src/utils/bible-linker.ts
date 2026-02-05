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

    // Regex to match Bible verse patterns
    // Group 1: Book prefix (1, 2, 3, I, II, III)
    // Group 2: Book name (John, Gen, etc.)
    // Group 3: Chapter
    // Group 4: Verse
    // Group 5: Optional end verse
    const verseRegex = /\b((?:[123]|I{1,3})\s*)?([A-Za-z]+)\.?\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b/g;

    // Regex to match sequential references like "; 21:1" or ", 22:1"
    // Group 1: Separator
    // Group 2: Chapter
    // Group 3: Verse
    // Group 4: Optional end verse
    const sequentialRegex = /([;,(])\s*(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b/g;

    let lastBookCode: string | null = null;

    // First pass: Link all full references and track the last book
    let processedText = text.replace(verseRegex, (match: string, prefix: string | undefined, book: string, chapter: string, verse: string, endVerse: string | undefined) => {
        let normalizedBook = ((prefix || '') + book).toLowerCase().replace(/\s+/g, '');
        normalizedBook = normalizedBook
            .replace(/^iii/, '3')
            .replace(/^ii/, '2')
            .replace(/^i/, '1');

        const bookCode = BIBLE_BOOKS[normalizedBook];

        if (!bookCode) {
            return match;
        }

        lastBookCode = bookCode;

        const ref = endVerse
            ? `${bookCode}${chapter}.${verse}-${endVerse}`
            : `${bookCode}${chapter}.${verse}`;

        return `[${match}](https://ref.ly/${ref};${logosVersion})`;
    });

    // Second pass: Handle sequential references if we have a lastBookCode
    // We need to be careful not to double-link or link things that aren't intended
    // We'll use a loop to maintain state correctly across the string

    // Reset state for new processing
    lastBookCode = null;
    let finalResult = "";
    let lastIndex = 0;

    // Combining both regexes to process the string chronologically
    const combinedRegex = /\b((?:[123]|I{1,3})\s*)?([A-Za-z]+)\.?\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b|([;,(])\s*(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b/g;

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
            normalizedBook = normalizedBook.replace(/^iii/, '3').replace(/^ii/, '2').replace(/^i/, '1');
            const bookCode = BIBLE_BOOKS[normalizedBook];

            if (bookCode) {
                lastBookCode = bookCode;
                const ref = endVerse ? `${bookCode}${chapter}.${verse}-${endVerse}` : `${bookCode}${chapter}.${verse}`;
                finalResult += `[${match[0]}](https://ref.ly/${ref};${logosVersion})`;
            } else {
                lastBookCode = null;
                finalResult += match[0];
            }
        } else if (match[6] && lastBookCode) {
            // Sequential match (; Chapter:Verse)
            const separator = match[6];
            const chapter = match[7];
            const verse = match[8];
            const endVerse = match[9];

            const ref = endVerse ? `${lastBookCode}${chapter}.${verse}-${endVerse}` : `${lastBookCode}${chapter}.${verse}`;
            // Capture the content without the separator to link it
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
