/**
 * Reads book metadata from the local Logos Bible Software catalog database.
 * Uses the sqlite3 CLI (pre-installed on macOS) via child_process.
 * Path: ~/Library/Application Support/Logos4/Data/<id>/LibraryCatalog/catalog.db
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import { readdirSync, existsSync } from 'fs';

/**
 * A book entry from the Logos library catalog.
 */
export interface LogosCatalogEntry {
    recordId: number;
    resourceId: string;
    title: string;
    abbreviatedTitle: string;
    authors: string;
    description: string;
    series: string;
    publicationDate: string;
    subjects: string;
    publisher: string;
    type: string;
}

/**
 * Auto-detect the catalog.db path by scanning the Logos4 data directory.
 * Returns the full path to catalog.db or null if not found.
 */
export function findCatalogDbPath(customBasePath?: string): string | null {
    const basePath = customBasePath || join(homedir(), 'Library', 'Application Support', 'Logos4', 'Data');

    if (!existsSync(basePath)) return null;

    try {
        const entries = readdirSync(basePath);
        for (const entry of entries) {
            const catalogPath = join(basePath, entry, 'LibraryCatalog', 'catalog.db');
            if (existsSync(catalogPath)) {
                return catalogPath;
            }
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Execute a sqlite3 query and return the JSON result.
 * Uses the macOS-native sqlite3 CLI with JSON output mode.
 */
function querySqlite(dbPath: string, sql: string, params: string[] = []): Record<string, unknown>[] {
    try {
        // Escape single quotes in params for SQL
        let query = sql;
        for (const param of params) {
            query = query.replace('?', `'${param.replace(/'/g, "''")}'`);
        }

        const result = execSync(
            `sqlite3 -json "${dbPath}" "${query.replace(/"/g, '\\"')}"`,
            {
                encoding: 'utf-8',
                timeout: 5000,
                maxBuffer: 10 * 1024 * 1024, // 10MB for large result sets
            }
        );

        if (!result.trim()) return [];
        return JSON.parse(result);
    } catch (e) {
        console.error('SQLite query failed:', e);
        return [];
    }
}

/**
 * Parse the XML-formatted description field into plain text.
 * Logos stores descriptions as XML with <Run Text="..." /> elements.
 */
function parseDescription(xmlDescription: string | null): string {
    if (!xmlDescription) return '';

    // Extract all Text="..." values from Run elements
    const textMatches = xmlDescription.matchAll(/Text="([^"]*?)"/g);
    const parts: string[] = [];
    for (const match of textMatches) {
        let text = match[1];
        // Decode XML entities
        text = text.replace(/&#x9;/g, '\t')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
        parts.push(text);
    }

    return parts.join('').trim();
}

/**
 * Parse URL-encoded CitationFields into a key-value map.
 * Format: "au=Author|bt=Title|pl=Place|pr=Publisher|yr=Year"
 */
function parseCitationFields(citationFields: string | null): Record<string, string> {
    if (!citationFields) return {};

    const result: Record<string, string> = {};
    const pairs = citationFields.split('|');
    for (const pair of pairs) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex > 0) {
            const key = pair.substring(0, eqIndex);
            const value = decodeURIComponent(pair.substring(eqIndex + 1));
            result[key] = value;
        }
    }
    return result;
}

/**
 * Search the Logos catalog for books matching a query string.
 * Searches by title (case-insensitive LIKE match).
 * Only returns non-dataset, available resources.
 */
export function searchCatalog(dbPath: string, query: string, limit: number = 20): LogosCatalogEntry[] {
    if (!query || query.length < 2) return [];

    const escapedQuery = query.replace(/'/g, "''");
    const pattern = `%${escapedQuery}%`;
    const exactPattern = `${escapedQuery}%`;

    const sql = `SELECT RecordId, ResourceId, Title, AbbreviatedTitle, Authors, Description, Series, PublicationDate, Subjects, Publishers, Type, CitationFields FROM Records WHERE Availability > 0 AND IsDataset = 0 AND (Title LIKE '${pattern}' OR AbbreviatedTitle LIKE '${pattern}' OR Authors LIKE '${pattern}') ORDER BY CASE WHEN Title LIKE '${exactPattern}' THEN 0 ELSE 1 END, Title LIMIT ${limit}`;

    const rows = querySqlite(dbPath, sql);

    return rows.map((row: Record<string, unknown>) => {
        const citFields = parseCitationFields(row.CitationFields as string | null);
        return {
            recordId: row.RecordId as number,
            resourceId: (row.ResourceId as string) || '',
            title: (row.Title as string) || '',
            abbreviatedTitle: (row.AbbreviatedTitle as string) || '',
            authors: (row.Authors as string) || '',
            description: parseDescription(row.Description as string | null),
            series: (row.Series as string) || '',
            publicationDate: (row.PublicationDate as string) || '',
            subjects: (row.Subjects as string) || '',
            publisher: citFields['pr'] || (row.Publishers as string) || '',
            type: (row.Type as string) || '',
        };
    });
}

/**
 * Get the cover image for a given record ID.
 * Returns the raw image data as a Buffer, or null if not found.
 * Uses sqlite3 CLI to extract the binary blob as hex, then converts to Buffer.
 */
export function getCoverImage(dbPath: string, recordId: number): Buffer | null {
    try {
        const result = execSync(
            `sqlite3 "${dbPath}" "SELECT hex(Image) FROM Images WHERE RecordId = ${recordId} AND Image IS NOT NULL"`,
            {
                encoding: 'utf-8',
                timeout: 5000,
                maxBuffer: 5 * 1024 * 1024, // 5MB for large images
            }
        );

        const hex = result.trim();
        if (!hex) return null;

        return Buffer.from(hex, 'hex');
    } catch (e) {
        console.error('Failed to get cover image:', e);
        return null;
    }
}
