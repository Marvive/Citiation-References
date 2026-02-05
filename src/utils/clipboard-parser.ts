/**
 * Utility functions for parsing clipboard content and citation data
 */

import { CitationFormat, ParsedCitation } from '../types';

export interface ParsedClipboard {
    mainText: string;
    citation: ParsedCitation | null;
    page: string | null;
    reflyLink?: string | null;
}

/**
 * Detects the citation format from clipboard text
 */
export function detectCitationFormat(text: string): CitationFormat {
    const trimmed = text.trim();

    // BibTeX: starts with @ or contains @type{
    if (/^@\w+\{/.test(trimmed) || /\s@\w+\{/.test(trimmed)) {
        return 'bibtex';
    }

    // APA: Author, A. A. (Year). Title. Publisher. OR Author (Year)
    // Look for pattern: Name, Initial. (YYYY)
    if (/[A-Z][a-z]+,\s+[A-Z]\.\s*[A-Z]?\.\s*\(\d{4}\)/.test(trimmed)) {
        return 'apa';
    }

    // Chicago: Author. Title. Place: Publisher, Year.
    // Look for pattern with place: publisher (check before MLA since it's more specific)
    if (/[A-Z][a-z]+,\s+[A-Z][a-z]+\.\s+[^.]+\.\s+[^:]+:\s+[^,]+,\s+\d{4}/.test(trimmed)) {
        return 'chicago';
    }

    // MLA: Author. Title. Publisher, Year.
    // Look for pattern ending with publisher and year
    if (/[A-Z][a-z]+,\s+[A-Z][a-z]+\.\s+[^.]+\.\s+[^,]+,\s+\d{4}\.?$/.test(trimmed)) {
        return 'mla';
    }

    // Default to bibtex if we can't detect (since that's what Logos exports)
    return 'bibtex';
}

/**
 * Parses a BibTeX entry into a ParsedCitation
 */
export function parseBibtex(bibtex: string): ParsedCitation {
    const citeKeyMatch = bibtex.match(/^@\w+\{([^,]+),/);
    let citeKey = citeKeyMatch ? citeKeyMatch[1] : 'unknown';
    citeKey = citeKey.replace(/[_\W]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const authorMatch = bibtex.match(/author\s*=\s*\{([^}]+)\}/i);
    const titleMatch = bibtex.match(/title\s*=\s*\{([^}]+)\}/i);
    const yearMatch = bibtex.match(/year\s*=\s*\{?(\d{4})\}?/i);
    const pagesMatch = bibtex.match(/pages\s*=\s*\{([^}]+)\}/i);
    const publisherMatch = bibtex.match(/publisher\s*=\s*\{([^}]+)\}/i);
    const urlMatch = bibtex.match(/url\s*=\s*\{([^}]+)\}/i);

    // Clean title - remove markdown links
    let title = titleMatch ? titleMatch[1] : null;
    if (title) {
        title = title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }

    return {
        format: 'bibtex',
        citeKey,
        author: authorMatch ? authorMatch[1] : null,
        title,
        year: yearMatch ? yearMatch[1] : null,
        pages: pagesMatch ? pagesMatch[1] : null,
        publisher: publisherMatch ? publisherMatch[1] : null,
        url: urlMatch ? urlMatch[1] : null,
        rawCitation: bibtex,
    };
}

/**
 * Parses an MLA citation into a ParsedCitation
 * Format: LastName, FirstName. Title. Publisher, Year.
 */
export function parseMLA(text: string): ParsedCitation {
    const lines = text.trim().split('\n');
    const citation = lines.join(' ').trim();

    // Try to extract: Author. "Title." Container, Publisher, Year.
    const authorMatch = citation.match(/^([^.]+)\./);
    const titleMatch = citation.match(/\.\s*"?([^."]+)"?\./);
    const yearMatch = citation.match(/(\d{4})\.?$/);
    const publisherMatch = citation.match(/\.\s*([^,]+),\s*\d{4}/);

    const author = authorMatch ? authorMatch[1].trim() : null;
    const title = titleMatch ? titleMatch[1].trim() : null;
    const year = yearMatch ? yearMatch[1] : null;
    const publisher = publisherMatch ? publisherMatch[1].trim() : null;

    // Generate cite key from author and year
    const citeKey = author && year
        ? `${author.split(',')[0].toLowerCase().replace(/\s+/g, '-')}-${year}`
        : 'unknown';

    return {
        format: 'mla',
        citeKey,
        author,
        title,
        year,
        pages: null,
        publisher,
        url: null,
        rawCitation: citation,
    };
}

/**
 * Parses an APA citation into a ParsedCitation
 * Format: Author, A. A. (Year). Title. Publisher.
 */
export function parseAPA(text: string): ParsedCitation {
    const lines = text.trim().split('\n');
    const citation = lines.join(' ').trim();

    // Try to extract: Author, I. (Year). Title. Publisher.
    const authorMatch = citation.match(/^([^(]+)\s*\(/);
    const yearMatch = citation.match(/\((\d{4})\)/);
    const titleMatch = citation.match(/\)\.\s*([^.]+)\./);
    const publisherMatch = citation.match(/\)\.\s*[^.]+\.\s*([^.]+)\./);

    const author = authorMatch ? authorMatch[1].trim() : null;
    const title = titleMatch ? titleMatch[1].trim() : null;
    const year = yearMatch ? yearMatch[1] : null;
    const publisher = publisherMatch ? publisherMatch[1].trim() : null;

    // Generate cite key from author last name and year
    let citeKey = 'unknown';
    if (author && year) {
        const lastName = author.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
        citeKey = `${lastName}-${year}`;
    }

    return {
        format: 'apa',
        citeKey,
        author,
        title,
        year,
        pages: null,
        publisher,
        url: null,
        rawCitation: citation,
    };
}

/**
 * Parses a Chicago citation into a ParsedCitation
 * Format: Author. Title. Place: Publisher, Year.
 */
export function parseChicago(text: string): ParsedCitation {
    const lines = text.trim().split('\n');
    const citation = lines.join(' ').trim();

    // Try to extract: Author. Title. Place: Publisher, Year.
    const authorMatch = citation.match(/^([^.]+)\./);
    const titleMatch = citation.match(/\.\s*([^.]+)\.\s*[^:]+:/);
    const yearMatch = citation.match(/,\s*(\d{4})\.?$/);
    const publisherMatch = citation.match(/:\s*([^,]+),\s*\d{4}/);

    const author = authorMatch ? authorMatch[1].trim() : null;
    const title = titleMatch ? titleMatch[1].trim() : null;
    const year = yearMatch ? yearMatch[1] : null;
    const publisher = publisherMatch ? publisherMatch[1].trim() : null;

    // Generate cite key from author and year
    let citeKey = 'unknown';
    if (author && year) {
        const lastName = author.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
        citeKey = `${lastName}-${year}`;
    }

    return {
        format: 'chicago',
        citeKey,
        author,
        title,
        year,
        pages: null,
        publisher,
        url: null,
        rawCitation: citation,
    };
}

/**
 * Parses the Logos clipboard content into structured data
 */
export function parseLogosClipboard(clipboard: string, preferredFormat: CitationFormat = 'auto'): ParsedClipboard {
    const trimmed = clipboard.trim();

    // Detect format
    const format = preferredFormat === 'auto' ? detectCitationFormat(trimmed) : preferredFormat;

    // Extract ref.ly link if present anywhere in the clipboard
    const reflyRegex = /https?:\/\/ref\.ly\/[^\s)}]+/;
    const reflyMatch = trimmed.match(reflyRegex);
    const reflyLink = reflyMatch ? reflyMatch[0] : null;

    if (format === 'bibtex') {
        return parseBibtexClipboard(trimmed, reflyLink);
    }

    // For other formats, try to parse the whole thing as a citation
    let citation: ParsedCitation;
    switch (format) {
        case 'mla':
            citation = parseMLA(trimmed);
            break;
        case 'apa':
            citation = parseAPA(trimmed);
            break;
        case 'chicago':
            citation = parseChicago(trimmed);
            break;
        default:
            citation = parseBibtex(trimmed);
    }

    return {
        mainText: '',
        citation,
        page: citation.pages,
        reflyLink,
    };
}

/**
 * Parses BibTeX-specific clipboard format (text + bibtex)
 */
function parseBibtexClipboard(trimmed: string, reflyLink: string | null): ParsedClipboard {
    // Case 1: Clipboard is just the BibTeX entry
    if (trimmed.startsWith('@')) {
        const citation = parseBibtex(trimmed);
        return { mainText: "", citation, page: citation.pages, reflyLink };
    }

    // Case 2: Clipboard contains both text and BibTeX
    const parts = trimmed.split(/\s+(?=@[\w]+{)/);

    if (parts.length < 2) {
        return { mainText: trimmed, citation: null, page: null };
    }

    const mainTextRaw = parts[0].trim();
    const bibtexRaw = parts[1]?.trim() || "";

    // Clean mainText by removing the ref.ly link and its container
    let mainText = mainTextRaw;
    if (reflyLink && mainTextRaw.includes(reflyLink)) {
        mainText = mainText.replace(new RegExp(`\\s*\\(?Resource Link:\\s*${reflyLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)?`, 'i'), "");
        mainText = mainText.replace(reflyLink, "").trim();
    }

    const citation = parseBibtex(bibtexRaw);

    return { mainText: mainText.trim(), citation, page: citation.pages, reflyLink };
}

/**
 * Extracts the cite key from BibTeX content (legacy function for compatibility)
 */
export function extractCiteKey(bibtex: string): string {
    const match = bibtex.match(/^@\w+\{([^,]+),/);
    if (!match) throw new Error("Could not extract cite key");

    let citeKey = match[1];
    citeKey = citeKey.replace(/[_\W]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return citeKey;
}

/**
 * Extracts page number from text (typically at the end of a citation)
 */
export function extractPageNumber(text: string): { cleanedText: string, page: string | null } {
    const pageRegex = /[([ ]?(p{1,2}\.? ?\d+([–-]\d+)?)[)\]]?\.?$/i;
    const match = text.match(pageRegex);
    if (match) {
        const page = match[1];
        const cleanedText = text.replace(pageRegex, "").trim();
        return { cleanedText, page };
    }
    return { cleanedText: text.trim(), page: null };
}

/**
 * Extracts pages field from BibTeX content
 */
export function extractPagesFromBibtex(bibtex: string): string | null {
    const match = bibtex.match(/pages\s*=\s*[{"']([^}"']+)[}"']/i);
    return match ? match[1] : null;
}

/**
 * Extracts book title from BibTeX content
 */
export function extractBookTitle(bibtex: string): string | null {
    const titleMatch = bibtex.match(/title\s*=\s*\{([^}]+)\}/i);
    return titleMatch ? titleMatch[1] : null;
}

/**
 * Cleans and transforms formatting in Logos text
 * - Double underscores (__) to <sup>...</sup>
 * - Single underscores (_) to *...*
 */
export function cleanFormattedText(text: string): string {
    if (!text) return text;

    // 1. Handle double underscores first (bold -> superscript)
    let processed = text.replace(/__(.*?)__/g, '<sup>$1</sup>');

    // 2. Handle single underscores (italics -> asterisk)
    processed = processed.replace(/_(.*?)_/g, '*$1*');

    return processed;
}
