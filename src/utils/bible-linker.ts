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
    // Pattern 1: Book Chapter:Verse, e.g. "Prov. 3:21" (requires capitalization, handles numbers out front)
    // Pattern 2: separator Chapter:Verse, e.g. "; 4:13" or " (4:22)"
    // Pattern 3: plain Chapter:Verse without preceding separator, e.g. " 16:15," or " 16:15."
    // Pattern 4: separator Verse (only if Book and Chapter are already known)
    const combinedRegex = /\b((?:[123]|I{1,3})\s*)?([A-Z][a-z]+)\.?\s+(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b|([;,(])\s*(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b|(?:^|[^A-Za-z0-9])([ \t]+|)(\d+):(\d+)(?:\s*[-–]\s*(\d+))?\b|([,])\s*(\d+)(?:\s*[-–]\s*(\d+))?\b/g;

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
            const spacing = separator === '(' ? '' : ' ';
            finalResult += `${separator}${spacing}[${contentToLink}](https://ref.ly/${ref};${logosVersion})`;
        } else if (match[10] !== undefined && lastBookCode) {
            // Sequential match without explicitly matching a preceding punctuation separator (bare Chapter:Verse)
            // match[10] contains whitespace or is empty
            const separator = match[10];
            const chapter = match[11];
            const verse = match[12];
            const endVerse = match[13];

            lastChapter = chapter;
            const ref = endVerse ? `${lastBookCode}${chapter}.${verse}-${endVerse}` : `${lastBookCode}${chapter}.${verse}`;

            // To figure out exactly what was captured, we need to locate the matched string inside match[0]
            // We find "chapter:verse" inside the full match string.
            const cvString = endVerse ? `${chapter}:${verse}–${endVerse}` : `${chapter}:${verse}`;
            const rawCvStringFallback = endVerse ? `${chapter}:${verse}-${endVerse}` : `${chapter}:${verse}`;

            let matchTextIndex = match[0].indexOf(cvString);
            if (matchTextIndex === -1) matchTextIndex = match[0].indexOf(rawCvStringFallback);

            const precedingChars = match[0].substring(0, matchTextIndex);
            const contentToLink = match[0].substring(matchTextIndex).trim();

            finalResult += `${precedingChars}[${contentToLink}](https://ref.ly/${ref};${logosVersion})`;

        } else if (match[14] && lastBookCode && lastChapter) {
            // Sequential match (separator Verse only)
            const separator = match[14];
            const verse = match[15];
            const endVerse = match[16];

            const ref = endVerse ? `${lastBookCode}${lastChapter}.${verse}-${endVerse}` : `${lastBookCode}${lastChapter}.${verse}`;
            const contentToLink = match[0].substring(separator.length).trim();
            const spacing = separator === '(' ? '' : ' ';
            finalResult += `${separator}${spacing}[${contentToLink}](https://ref.ly/${ref};${logosVersion})`;
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
