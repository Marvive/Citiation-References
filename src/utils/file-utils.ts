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
 * Generates YAML frontmatter from citation data and custom fields
 */
export function generateCitationFrontmatter(citation: ParsedCitation, customFields: string[] = []): string {
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
    if (citation.url) {
        metadata += `url: "${citation.url}"\n`;
    }
    metadata += `cite-key: "${citation.citeKey}"\n`;
    metadata += `citation-format: ${citation.format}\n`;

    // Add custom user-defined fields as empty
    customFields.forEach(field => {
        metadata += `${field}: \n`;
    });

    metadata += '---\n\n';
    return metadata;
}
