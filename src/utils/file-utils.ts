/**
 * Utility functions for file name handling
 */

import { ParsedCitation } from '../types';

/**
 * Sanitizes a note name by removing characters that are invalid in file paths
 * Removes: / \ :
 */
export function sanitizeNoteName(name: string): string {
    return name.replace(/[\\/:]/g, '');
}

/**
 * Generates a note file path from a name and optional folder
 */
export function generateNotePath(noteName: string, folder: string): string {
    const sanitized = sanitizeNoteName(noteName);
    return folder ? `${folder}/${sanitized}.md` : `${sanitized}.md`;
}

/**
 * Generates YAML frontmatter from a list of metadata fields (legacy)
 */
export function generateMetadataFrontmatter(fields: string[]): string {
    if (fields.length === 0) return '';

    let metadata = '---\n';
    fields.forEach(field => {
        metadata += `${field}: \n`;
    });
    metadata += '---\n\n';
    return metadata;
}

/**
 * Options for enhanced metadata in frontmatter
 */
export interface FrontmatterOptions {
    fetchLogosMetadata?: boolean;
    coverImagePath?: string;
}

/**
 * Generates YAML frontmatter from citation data and custom fields
 */
export function generateCitationFrontmatter(
    citation: ParsedCitation,
    customFields: string[] = [],
    options: FrontmatterOptions = {}
): string {
    let metadata = '---\n';

    // Add citation fields
    if (citation.title) {
        metadata += `title: "${citation.title.replace(/"/g, '\\"')}"\n`;
    }
    if (citation.author) {
        metadata += `author: "${citation.author.replace(/"/g, '\\"')}"\n`;
    }
    if (citation.year) {
        metadata += `year: ${citation.year}\n`;
    }
    if (citation.publisher) {
        metadata += `publisher: "${citation.publisher.replace(/"/g, '\\"')}"\n`;
    }
    metadata += `cite-key: "${citation.citeKey}"\n`;

    // Enhanced Logos metadata
    if (options.fetchLogosMetadata) {
        // local*cover - path to cover image
        if (options.coverImagePath) {
            metadata += `"local*cover": [[${options.coverImagePath}]]\n`;
        } else {
            metadata += `"local*cover": \n`;
        }

        // description from abstract
        if (citation.abstract) {
            metadata += `description: "${citation.abstract.replace(/"/g, '\\"')}"\n`;
        } else {
            metadata += `description: \n`;
        }

        // isbn
        if (citation.isbn) {
            metadata += `isbn: "${citation.isbn}"\n`;
        } else {
            metadata += `isbn: \n`;
        }

        // tags from keywords
        if (citation.keywords && citation.keywords.length > 0) {
            metadata += `tags:\n`;
            citation.keywords.forEach(tag => {
                metadata += `  - "${tag.replace(/"/g, '\\"')}"\n`;
            });
        } else {
            metadata += `tags: \n`;
        }

        // publication-date from year
        if (citation.year) {
            metadata += `publication-date: ${citation.year}\n`;
        } else {
            metadata += `publication-date: \n`;
        }

        // series
        if (citation.series) {
            metadata += `series: "${citation.series.replace(/"/g, '\\"')}"\n`;
        } else {
            metadata += `series: \n`;
        }
    }

    // Add custom user-defined fields as empty (skip fields already covered by enhanced metadata)
    const enhancedFields = options.fetchLogosMetadata
        ? ['local*cover', 'description', 'isbn', 'tags', 'publication-date', 'series']
        : [];
    customFields.forEach(field => {
        if (enhancedFields.includes(field.toLowerCase())) return;
        metadata += `${field}: \n`;
    });

    metadata += '---\n\n';
    return metadata;
}
/**
 * Converts a string to Title Case
 */
export function toTitleCase(str: string): string {
    if (!str) return str;

    // List of words that should remain lowercase (unless first/last)
    const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v\.?|via|vs\.?)$/i;

    return str.split(/\s+/).map((word, index, array) => {
        // If word has uppercase characters beyond the first letter, preserve its casing
        // e.g., OT300, NIV, iPhone, USA
        const hasExtraCapitals = /[A-Z]/.test(word.slice(1));
        const hasNumbers = /[0-9]/.test(word);

        if (hasExtraCapitals || (index === 0 && hasNumbers && /[A-Z]/.test(word))) {
            return word;
        }

        if (
            index > 0 &&
            index < array.length - 1 &&
            smallWords.test(word)
        ) {
            return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}
