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

    // Check for Logos-style markdown links in titles: [_Title_](url) or [*Title*](url)
    const hasMarkdownLink = /\[[*_][^\]]+[*_]\]\([^)]+\)/.test(trimmed);

    if (hasMarkdownLink) {
        // Chicago/Turabian with markdown link: Author, [_Title_](...), Series (Place: Publisher, Year).
        // Key pattern: parenthetical with "Place: Publisher, Year" or just "(Publisher, Year)"
        if (/\([^)]*:\s*[^,)]+,\s*\d{4}\)/.test(trimmed) || /,\s*\d{4}\)\.$/.test(trimmed)) {
            return 'chicago';
        }

        // MLA with markdown link: Author. [_Title_](...). Publisher, Year.
        // Key pattern: ends with "Publisher, Year." (no parentheses around year)
        if (/\]\([^)]+\)\.\s+[^,]+,\s*\d{4}\.?\s*$/.test(trimmed)) {
            return 'mla';
        }

        // APA with markdown link: Author (Year). [_Title_](...). Publisher.
        if (/\(\d{4}\)\.\s*\[/.test(trimmed)) {
            return 'apa';
        }
    }

    // Standard format detection (no markdown links)

    // APA: Author, A. A. (Year). Title. Publisher. OR Author (Year)
    // Look for pattern: Name, Initial. (YYYY)
    if (/[A-Z][a-z]+,\s+[A-Z]\.\s*[A-Z]?\.\s*\(\d{4}\)/.test(trimmed)) {
        return 'apa';
    }

    // Chicago: Author. Title. Place: Publisher, Year.
    // Look for pattern with place: publisher, year (colon followed by non-period, comma, year)
    if (/[A-Z][a-z]+,?\s+[A-Z].*?\.\s+.*?\.\s+.*?:\s*[^.]+,?\s*\d{4}/.test(trimmed)) {
        return 'chicago';
    }

    // MLA: Author. Title. Publisher, Year.
    // Look for pattern with Author, Title, Publisher, Year (with optional pages)
    if (/[A-Z][a-z]+,?\s+[A-Z].*?\.\s+.*?\.\s+.*,\s+\d{4}/.test(trimmed)) {
        return 'mla';
    }

    // Default to bibtex if we can't detect (since that's what Logos exports)
    return 'bibtex';
}


/**
 * Parses a BibTeX entry into a ParsedCitation
 */
export function parseBibtex(bibtex: string): ParsedCitation {
    // Pre-process: Logos sometimes wraps entire field lines in markdown links,
    // e.g. [journal={Title}](url) or [title={Title}](url)
    // Normalize these to field={[Title](url)} so standard regexes work correctly
    bibtex = bibtex.replace(
        /\[((?:title|journal|booktitle|series)\s*=\s*\{)([^}]+)(\})\]\(([^)]+)\)/gi,
        (_, fieldPrefix, fieldValue, closingBrace, linkUrl) => {
            return `${fieldPrefix}[${fieldValue}](${linkUrl})${closingBrace}`;
        }
    );

    const citeKeyMatch = bibtex.match(/^@\w+\{([^,]+),/);
    let citeKey = citeKeyMatch ? citeKeyMatch[1] : 'unknown';
    citeKey = citeKey.replace(/[_\W]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const authorMatch = bibtex.match(/author\s*=\s*\{([^}]+)\}/i);
    const titleMatch = bibtex.match(/title\s*=\s*\{([^}]+)\}/i);
    const yearMatch = bibtex.match(/year\s*=\s*\{?(\d{4})\}?/i);
    const pagesMatch = bibtex.match(/pages\s*=\s*\{([^}]+)\}/i);
    const publisherMatch = bibtex.match(/publisher\s*=\s*\{([^}]+)\}/i);
    const urlMatch = bibtex.match(/url\s*=\s*\{([^}]+)\}/i);
    const isbnMatch = bibtex.match(/isbn\s*=\s*\{([^}]+)\}/i);
    const abstractMatch = bibtex.match(/abstract\s*=\s*\{([^}]+)\}/i);
    const keywordsMatch = bibtex.match(/keywords\s*=\s*\{([^}]+)\}/i);

    // Fallback title fields: journal, booktitle, series (common in @misc, @article, @inproceedings)
    const journalMatch = bibtex.match(/journal\s*=\s*\{([^}]+)\}/i);
    const booktitleMatch = bibtex.match(/booktitle\s*=\s*\{([^}]+)\}/i);
    const seriesMatch = bibtex.match(/series\s*=\s*\{([^}]+)\}/i);

    // Determine the raw title value: journal → booktitle → series → title
    let rawTitleValue = journalMatch ? journalMatch[1]
        : booktitleMatch ? booktitleMatch[1]
            : seriesMatch ? seriesMatch[1]
                : titleMatch ? titleMatch[1]
                    : null;
    const titleSourceField = journalMatch ? 'journal'
        : booktitleMatch ? 'booktitle'
            : seriesMatch ? 'series'
                : titleMatch ? 'title'
                    : null;

    let title = rawTitleValue;
    let url = urlMatch ? urlMatch[1] : null;

    // Check if the title value already contains a markdown link [Text](url)
    if (title) {
        const embeddedLinkMatch = title.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (embeddedLinkMatch) {
            // Extract URL from the embedded markdown link if we don't already have one
            if (!url) {
                url = embeddedLinkMatch[2];
            }
            // Title is already linked — keep it as-is
        } else if (url && !title.includes('](')) {
            // If we have a URL and the title doesn't already have one, wrap it
            title = `[${title}](${url})`;
            // Update rawCitation to reflect the hyperlinked title
            if (rawTitleValue && titleSourceField) {
                bibtex = bibtex.replace(
                    new RegExp(`${titleSourceField}\\s*=\\s*\\{${rawTitleValue.replace(/[.*+?^${}()|[\]\\\\]/g, '\\$&')}\\}`, 'i'),
                    `${titleSourceField}={${title}}`
                );
            }
        }
    }

    // Generate a cleaned title for note names (no markdown links, no brackets)
    const cleanedTitle = title ? title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[[\]]/g, '') : null;

    // Generate cite key - use the BibTeX key if available, otherwise generate from author/year
    let finalCiteKey = citeKey;
    if (citeKey === 'unknown' && authorMatch && yearMatch) {
        const authorLastName = authorMatch[1].split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
        finalCiteKey = `${authorLastName}-${yearMatch[1]}`;
    }

    // Parse keywords into array
    const keywords = keywordsMatch
        ? keywordsMatch[1].split(/[;,]/).map(k => k.trim()).filter(k => k.length > 0)
        : null;

    return {
        format: 'bibtex',
        citeKey: finalCiteKey,
        author: authorMatch ? authorMatch[1] : null,
        title,
        cleanedTitle,
        year: yearMatch ? yearMatch[1] : null,
        pages: pagesMatch ? pagesMatch[1] : null,
        publisher: publisherMatch ? publisherMatch[1] : null,
        url: url,
        rawCitation: bibtex,
        isbn: isbnMatch ? isbnMatch[1] : null,
        abstract: abstractMatch ? abstractMatch[1] : null,
        keywords,
        series: seriesMatch ? seriesMatch[1] : null,
    };
}

/**
 * Parses an MLA citation into a ParsedCitation
 * Format: LastName, FirstName. Title. Publisher, Year.
 * Also handles Logos format: Author. [_Title_](url). Publisher, Year.
 */
export function parseMLA(text: string): ParsedCitation {
    const lines = text.trim().split('\n');
    const citation = lines.join(' ').trim();

    let author: string | null = null;
    let title: string | null = null;
    let url: string | null = null;
    let year: string | null = null;
    let publisher: string | null = null;

    // Check for Logos-style markdown link: [_Title_](url) or [*Title*](url)
    const markdownLinkMatch = citation.match(/\[[*_]([^\]]+)[*_]\]\(([^)]+)\)/);

    if (markdownLinkMatch) {
        // Logos format: Author. [_Title_](url). Publisher, Year.
        title = markdownLinkMatch[1].trim();
        url = markdownLinkMatch[2];

        // Author is everything before the markdown link, up to the first period or comma before the link
        const beforeLink = citation.substring(0, citation.indexOf('['));
        const authorMatch = beforeLink.match(/^([^.]+(?:\.\s*[A-Z]\.)?)/);
        author = authorMatch ? authorMatch[1].replace(/,?\s*$/, '').trim() : null;

        // Publisher and year are after the link
        const afterLink = citation.substring(citation.indexOf(')') + 1);
        const pubYearMatch = afterLink.match(/\.\s*([^,]+),\s*(\d{4})/);
        if (pubYearMatch) {
            publisher = pubYearMatch[1].trim();
            year = pubYearMatch[2];
        }
    } else {
        // Standard MLA format
        // Heuristic: Titles are often italicized or quoted
        const titleRegex = /[_*"]([^_*"]+)[_*"]/;
        const titleMatch = citation.match(titleRegex);

        if (titleMatch) {
            title = titleMatch[1].trim();
            const titleStart = citation.indexOf(titleMatch[0]);
            author = citation.substring(0, titleStart).replace(/\.?\s*$/, '').trim();

            const afterTitle = citation.substring(titleStart + titleMatch[0].length).trim();
            const yearMatch = afterTitle.match(/(\d{4})\.?$/);
            year = yearMatch ? yearMatch[1] : null;

            // Publisher is everything after the title except the year, usually separated by a comma
            let pubRaw = afterTitle.replace(/^[.,\s]+/, '').replace(/,?\s*\d{4}\.?$/, '').trim();
            // Remove edition info like "2nd ed.,"
            publisher = pubRaw.replace(/^[^,]+ed\.,\s*/i, '').trim();
        } else {
            // Fallback for very simple formats
            // Author usually ends with a period followed by a word that doesn't look like an initial
            const authorMatch = citation.match(/^(.+?)\.(?=\s+[A-Z][A-Za-z\d]+(?!\.))/) || citation.match(/^([^.]+)\./);
            const titleMatch = citation.match(/\.\s*"?([^."]+)"?\./);
            // Year: 4 digits, possibly preceded by comma/space, possibly followed by punctuation
            const yearMatch = citation.match(/(\d{4})[.,]?$/) || citation.match(/(\d{4})/);
            const publisherMatch = citation.match(/\.\s*([^,]+),\s*\d{4}/);

            author = authorMatch ? authorMatch[1].trim() : null;
            title = titleMatch ? titleMatch[1].trim() : null;
            year = yearMatch ? yearMatch[1] : null;
            publisher = publisherMatch ? publisherMatch[1].trim() : null;
        }
    }

    // Generate cite key from author and year
    const citeKey = author && year
        ? `${author.split(',')[0].toLowerCase().replace(/\s+/g, '-')}-${year}`
        : 'unknown';

    const cleanedTitle = title ? title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[[\]]/g, '') : null;

    return {
        format: 'mla',
        citeKey,
        author,
        title,
        cleanedTitle,
        year,
        pages: null,
        publisher,
        url,
        rawCitation: citation,
        isbn: null,
        abstract: null,
        keywords: null,
        series: null,
    };
}

/**
 * Parses an APA citation into a ParsedCitation
 * Format: Author, A. A. (Year). Title. Publisher.
 * Also handles Logos format: Author (Year). [_Title_](url). Publisher.
 */
export function parseAPA(text: string): ParsedCitation {
    const lines = text.trim().split('\n');
    const citation = lines.join(' ').trim();

    let author: string | null = null;
    let title: string | null = null;
    let url: string | null = null;
    let year: string | null = null;
    let publisher: string | null = null;

    // Check for Logos-style markdown link: [_Title_](url) or [*Title*](url)
    const markdownLinkMatch = citation.match(/\[[*_]([^\]]+)[*_]\]\(([^)]+)\)/);

    if (markdownLinkMatch) {
        // Logos APA format: Author (Year). [_Title_](url). Publisher.
        title = markdownLinkMatch[1].trim();
        url = markdownLinkMatch[2];

        // Year is in parentheses before the title
        const yearMatch = citation.match(/\((\d{4})\)/);
        year = yearMatch ? yearMatch[1] : null;

        // Author is everything before "(Year)"
        const yearIndex = citation.indexOf('(');
        if (yearIndex > 0) {
            author = citation.substring(0, yearIndex).replace(/,$/, '').trim();
        }

        // Publisher is after the markdown link closing
        const afterLink = citation.substring(citation.lastIndexOf(')') + 1);
        const publisherMatch = afterLink.match(/\.\s*([^.]+)\./);
        if (publisherMatch) {
            publisher = publisherMatch[1].trim();
        }
    } else {
        // Standard APA format: Author, I. (Year). Title. Publisher.
        const yearMatch = citation.match(/\((\d{4})\)/);
        year = yearMatch ? yearMatch[1] : null;

        // Author is before the year
        const yearIndex = citation.indexOf('(');
        if (yearIndex > 0) {
            author = citation.substring(0, yearIndex).replace(/,$/, '').trim();
        }

        const afterYear = yearIndex > 0 ? citation.substring(citation.indexOf(')', yearIndex) + 1).trim() : citation;
        // Format: . Title. Publisher.
        const titleRegex = /[_*"]([^_*"]+)[_*"]/;
        const titleMatch = afterYear.match(titleRegex);

        if (titleMatch) {
            title = titleMatch[1].trim();
            const afterTitle = afterYear.substring(afterYear.indexOf(titleMatch[0]) + titleMatch[0].length).trim();
            publisher = afterTitle.replace(/^[.,\s(]+[^)]*\)[.,\s]*/, '').replace(/\.$/, '').trim();
        } else {
            const parts = afterYear.replace(/^\.\s*/, '').split(/\.\s+/);
            if (parts.length >= 1) {
                title = parts[0].trim();
                if (parts.length >= 2) {
                    publisher = parts[1].replace(/\.$/, '').trim();
                }
            }
        }
    }

    // Generate cite key from author last name and year
    let citeKey = 'unknown';
    if (author && year) {
        // Handle multiple authors or names with punctuation
        const firstAuthor = author.split(/[&,]|and/)[0].trim();
        const lastName = firstAuthor.split(/\s+/).pop()?.toLowerCase().replace(/[^\w]/g, '') || 'unknown';
        citeKey = `${lastName}-${year}`;
    }

    const cleanedTitle = title ? title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[[\]]/g, '') : null;

    return {
        format: 'apa',
        citeKey,
        author,
        title,
        cleanedTitle,
        year,
        pages: null,
        publisher,
        url,
        rawCitation: citation,
        isbn: null,
        abstract: null,
        keywords: null,
        series: null,
    };
}

/**
 * Parses a Chicago citation into a ParsedCitation
 * Format: Author. Title. Place: Publisher, Year.
 * Also handles Logos format: Author, [_Title_](url), Series (Place: Publisher, Year).
 */
export function parseChicago(text: string): ParsedCitation {
    const lines = text.trim().split('\n');
    const citation = lines.join(' ').trim();

    let author: string | null = null;
    let title: string | null = null;
    let url: string | null = null;
    let year: string | null = null;
    let publisher: string | null = null;

    // Check for Logos-style markdown link: [_Title_](url) or ["Title"](url) or [“Title”](url)
    const markdownLinkMatch = citation.match(/\[([^\]]+)\]\(([^)]+)\)/);

    if (markdownLinkMatch) {
        url = markdownLinkMatch[2];

        // Check if it's an article/chapter in a larger book (e.g., in _Baker Encyclopedia of the Bible_)
        const inBookMatch = citation.match(/\bin\s+[_*]([^_*]+)[_*]/);
        if (inBookMatch) {
            title = inBookMatch[1].trim();
        } else {
            // Remove surrounding formatting (quotes, italics, asterisks) from the link text
            title = markdownLinkMatch[1].replace(/^[_*“"‘']+|[_*”"’',]+$/g, '').trim();
        }

        // Author is everything before the markdown link (before the comma or just before the bracket)
        const beforeLink = citation.substring(0, citation.indexOf('['));
        // Remove trailing comma and whitespace
        author = beforeLink.replace(/,?\s*$/, '').trim();

        // Year is typically in parentheses: (Place: Publisher, Year) or just , Year)
        // If there are page numbers after the parentheses, we shouldn't confuse them with the year.
        const yearMatch = citation.match(/,\s*(\d{4})\)/) || citation.match(/,\s*(\d{4})\.?\s*$/);
        year = yearMatch ? yearMatch[1] : null;

        // Publisher is in parentheses: (Place: Publisher, Year) - extract "Publisher"
        // Or just after colon: Place: Publisher, Year
        const publisherMatch = citation.match(/:\s*([^,)]+),\s*\d{4}/);
        if (publisherMatch) {
            publisher = publisherMatch[1].trim();
        }
    } else {
        // Standard Chicago format: Author. Title. Place: Publisher, Year.

        // Heuristic: Use Title boundaries if possible
        const titleRegex = /[_*"]([^_*"]+)[_*"]/;
        const titleMatch = citation.match(titleRegex);

        if (titleMatch) {
            title = titleMatch[1].trim();
            const titleStart = citation.indexOf(titleMatch[0]);
            author = citation.substring(0, titleStart).replace(/\.?\s*$/, '').trim();

            const afterTitle = citation.substring(titleStart + titleMatch[0].length).trim();
            const yearMatch = afterTitle.match(/,\s*(\d{4})\.?$/);
            year = yearMatch ? yearMatch[1] : null;

            // Publisher is after the LAST colon in Chicago style
            if (afterTitle.includes(':')) {
                const parts = afterTitle.split(':');
                const lastPart = parts[parts.length - 1].trim();
                publisher = lastPart.replace(/,\s*\d{4}\.?$/, '').trim();
            } else {
                publisher = afterTitle.replace(/^[.,\s]+/, '').replace(/,?\s*\d{4}\.?$/, '').trim();
            }
            // Filter out edition notes like "2nd ed." from publisher
            if (publisher) {
                publisher = publisher.replace(/^[^,]*ed\.\s*/i, '').replace(/^[.,\s]+/, '').trim();
            }
        } else {
            // Author usually ends with a period followed by a word that doesn't look like an initial
            const authorMatch = citation.match(/^(.+?)\.(?=\s+[A-Z][A-Za-z\d]+(?!\.))/) || citation.match(/^([^.]+)\./);
            author = authorMatch ? authorMatch[1].trim() : citation.split(/\.\s+/)[0].trim();

            // Try to extract title - everything between author and publisher/year
            const afterAuthor = authorMatch ? citation.substring(authorMatch[0].length).trim() : citation.substring(author.length + 1).trim();
            title = afterAuthor.split(/\.\s+|(?=Place:)/)[0].trim();

            const yearMatch = citation.match(/,\s*(\d{4})[.,]?$/) || citation.match(/(\d{4})/);
            year = yearMatch ? yearMatch[1] : null;

            const colons = citation.split(':');
            if (colons.length > 1) {
                publisher = colons[colons.length - 1].replace(/,?\s*\d{4}[.,]?$/, '').trim();
            }
        }
    }


    // Generate cite key from author and year
    let citeKey = 'unknown';
    if (author && year) {
        const firstAuthor = author.split(/[&,]|and/)[0].trim();
        const lastName = firstAuthor.split(/\s+/).pop()?.toLowerCase().replace(/[^\w]/g, '') || 'unknown';
        citeKey = `${lastName}-${year}`;
    }

    const cleanedTitle = title ? title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[[\]]/g, '') : null;

    return {
        format: 'chicago',
        citeKey,
        author,
        title,
        cleanedTitle,
        year,
        pages: null,
        publisher,
        url,
        rawCitation: citation,
        isbn: null,
        abstract: null,
        keywords: null,
        series: null,
    };
}

/**
 * Parses the Logos clipboard content into structured data
 */
export function parseLogosClipboard(clipboard: string, preferredFormat: CitationFormat = 'auto'): ParsedClipboard {
    const trimmed = clipboard.trim();

    // Extract ref.ly link if present anywhere in the clipboard
    // Refined regex to avoid capturing trailing punctuation that isn't part of the URL
    const reflyRegex = /https?:\/\/ref\.ly\/[^\s)}]+/;
    const reflyMatch = trimmed.match(reflyRegex);
    let reflyLink = reflyMatch ? reflyMatch[0] : null;

    // Remove trailing backslash or other unwanted punctuation if present
    if (reflyLink) {
        reflyLink = reflyLink.replace(/[\\.,;!]+$/, '');
    }

    // Detect format
    const format = preferredFormat === 'auto' ? detectCitationFormat(trimmed) : preferredFormat;

    let mainText = "";
    let citationText = trimmed;

    // Split text and citation
    if (format === 'bibtex') {
        const parts = trimmed.split(/\s+(?=@[\w]+{)/);
        if (parts.length >= 2) {
            mainText = parts[0].trim();
            citationText = parts[1].trim();
        } else if (!trimmed.startsWith('@')) {
            // If it doesn't start with @ and we couldn't split, it might just be text
            mainText = trimmed;
            citationText = "";
        }
    } else {
        // For other formats (MLA, APA, Chicago), look for a newline separation
        // Logos typically puts the citation at the end after one or more newlines
        const lines = trimmed.split(/\r?\n/);

        // Search from the bottom for something that looks like the start of a citation
        let citationStartIndex = -1;

        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (!line) {
                if (citationStartIndex !== -1) {
                    // We found a gap between citation and text!
                    break;
                }
                continue;
            }

            // Heuristics for citation start:
            // APA: Author (Year)
            // MLA: Author. Title
            // Chicago: Author. Title
            const looksLikeCitation =
                (format === 'apa' && /\(\d{4}\)/.test(line)) ||
                (format === 'mla' && /[A-Z][a-z]+,?\s+[A-Z]/.test(line) && (line.includes('.') || line.includes('_') || line.includes('*'))) ||
                (format === 'chicago' && /[A-Z][a-z]+,?\s+[A-Z]/.test(line) && (line.includes('.') || line.includes('_') || line.includes('*')));

            if (looksLikeCitation) {
                citationStartIndex = i;
                // Keep looking up in case the citation is multiple lines
            } else if (citationStartIndex !== -1) {
                // We were in a citation and now we found something that doesn't look like one
                break;
            }
        }

        if (citationStartIndex > 0) {
            mainText = lines.slice(0, citationStartIndex).join('\n').trim();
            citationText = lines.slice(citationStartIndex).join('\n').trim();
        }
    }

    // Clean mainText by removing the ref.ly link and its container
    if (mainText && reflyLink) {
        mainText = mainText.replace(new RegExp(`\\s*\\(?Resource Link:\\s*${reflyLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)?`, 'i'), "");
        mainText = mainText.replace(reflyLink, "").trim();
    }

    // Extract page number if present (before parsing format-specific fields)
    let pageFromText: string | null = null;
    if (citationText) {
        const { cleanedText, page } = extractPageNumber(citationText);
        citationText = cleanedText;
        pageFromText = page;
    }

    // Parse the citation part
    let citation: ParsedCitation | null = null;
    if (citationText) {
        switch (format) {
            case 'mla':
                citation = parseMLA(citationText);
                break;
            case 'apa':
                citation = parseAPA(citationText);
                break;
            case 'chicago':
                citation = parseChicago(citationText);
                break;
            case 'bibtex':
                citation = parseBibtex(citationText);
                break;
            default:
                citation = parseBibtex(citationText);
        }
    }

    return {
        mainText: mainText.trim(),
        citation,
        page: pageFromText || (citation ? citation.pages : null),
        reflyLink,
    };
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
    // Match common page patterns at the end of a citation
    // Added comma and space to the leading character class to clean the remaining string better
    const pageRegex = /[([ ,]?(p{1,2}\.? ?\d+([–-]\d+)?)[)\]]?\.?$/i;
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
