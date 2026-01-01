/**
 * Utility functions for file name handling
 */

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
 * Generates YAML frontmatter from a list of metadata fields
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
