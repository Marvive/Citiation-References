/**
 * Settings interface for the Citation References Plugin
 */

/** Supported citation formats */
export type CitationFormat = 'auto' | 'bibtex' | 'mla' | 'apa' | 'chicago';

export interface LogosPluginSettings {
    citationFolder: string;
    citationCounters: Record<string, number>;
    customCalloutTitle: string;
    addNewLineBeforeLink: boolean;
    autoDetectBibleVerses: boolean;
    bibleTranslation: string;
    useCustomMetadata: boolean;
    customMetadataFields: string[];
    showRibbonIcon: boolean;
    includeReflyLink: boolean;
    citationFormat: CitationFormat;
}

export const DEFAULT_SETTINGS: LogosPluginSettings = {
    citationFolder: '',
    citationCounters: {},
    customCalloutTitle: '',
    addNewLineBeforeLink: false,
    autoDetectBibleVerses: false,
    bibleTranslation: 'esv',
    useCustomMetadata: false,
    customMetadataFields: [],
    showRibbonIcon: true,
    includeReflyLink: false,
    citationFormat: 'auto',
};

/**
 * Parsed citation data structure - common fields across all formats
 */
export interface ParsedCitation {
    format: CitationFormat;
    citeKey: string;
    author: string | null;
    title: string | null;
    year: string | null;
    pages: string | null;
    publisher: string | null;
    url: string | null;
    rawCitation: string;
}
