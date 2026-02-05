import {
    sanitizeNoteName,
    generateNotePath,
    generateMetadataFrontmatter,
    generateCitationFrontmatter
} from '../utils/file-utils';
import { ParsedCitation } from '../types';

describe('File Utils', () => {
    describe('sanitizeNoteName', () => {
        it('should remove forward slashes', () => {
            expect(sanitizeNoteName('Book Title / Subtitle')).toBe('Book Title  Subtitle');
        });

        it('should remove backslashes', () => {
            expect(sanitizeNoteName('Title\\Name')).toBe('TitleName');
        });

        it('should remove colons', () => {
            expect(sanitizeNoteName('Theology: An Introduction')).toBe('Theology An Introduction');
        });

        it('should handle multiple special characters', () => {
            expect(sanitizeNoteName('Book: Title/Subtitle\\Name')).toBe('Book TitleSubtitleName');
        });

        it('should preserve other characters', () => {
            expect(sanitizeNoteName("Book's Title - 2nd Edition")).toBe("Book's Title - 2nd Edition");
        });
    });

    describe('generateNotePath', () => {
        it('should generate path with folder', () => {
            expect(generateNotePath('My Note', 'refs')).toBe('refs/My Note.md');
        });

        it('should generate path without folder', () => {
            expect(generateNotePath('My Note', '')).toBe('My Note.md');
        });

        it('should sanitize the note name', () => {
            expect(generateNotePath('Book: Title', 'refs')).toBe('refs/Book Title.md');
        });
    });

    describe('generateMetadataFrontmatter', () => {
        it('should generate YAML frontmatter with fields', () => {
            const fields = ['tags', 'related notes', 'status'];
            const result = generateMetadataFrontmatter(fields);

            expect(result).toContain('---');
            expect(result).toContain('tags: ');
            expect(result).toContain('related notes: ');
            expect(result).toContain('status: ');
        });

        it('should return empty string for empty fields array', () => {
            expect(generateMetadataFrontmatter([])).toBe('');
        });

        it('should end with proper formatting', () => {
            const result = generateMetadataFrontmatter(['field']);
            expect(result).toMatch(/---\n\n$/);
        });
    });

    describe('generateCitationFrontmatter', () => {
        it('should generate frontmatter from citation data', () => {
            const citation: ParsedCitation = {
                format: 'bibtex',
                citeKey: 'smith2020',
                author: 'John Smith',
                title: 'Systematic Theology',
                cleanedTitle: 'Systematic Theology',
                year: '2020',
                pages: '123',
                publisher: 'Academic Press',
                url: null,
                rawCitation: '@book{smith2020}'
            };
            const result = generateCitationFrontmatter(citation);

            expect(result).toContain('---');
            expect(result).toContain('title: "Systematic Theology"');
            expect(result).toContain('author: "John Smith"');
            expect(result).toContain('year: 2020');
            expect(result).toContain('publisher: "Academic Press"');
            expect(result).toContain('cite-key: "smith2020"');
        });


        it('should handle missing optional fields', () => {
            const citation: ParsedCitation = {
                format: 'apa',
                citeKey: 'doe2021',
                author: null,
                title: 'Some Title',
                cleanedTitle: 'Some Title',
                year: null,
                pages: null,
                publisher: null,
                url: null,
                rawCitation: ''
            };
            const result = generateCitationFrontmatter(citation);

            expect(result).toContain('title: "Some Title"');
            expect(result).not.toContain('author:');
            expect(result).not.toContain('year:');
            expect(result).not.toContain('publisher:');
        });

        it('should include custom fields', () => {
            const citation: ParsedCitation = {
                format: 'mla',
                citeKey: 'test',
                author: 'Test Author',
                title: 'Test Title',
                cleanedTitle: 'Test Title',
                year: '2023',
                pages: null,
                publisher: null,
                url: null,
                rawCitation: ''
            };
            const customFields = ['tags', 'related notes'];
            const result = generateCitationFrontmatter(citation, customFields);

            expect(result).toContain('tags: ');
            expect(result).toContain('related notes: ');
        });

        it('should escape quotes in field values', () => {
            const citation: ParsedCitation = {
                format: 'bibtex',
                citeKey: 'test',
                author: null,
                title: 'Book with "Quoted" Title',
                cleanedTitle: 'Book with "Quoted" Title',
                year: null,
                pages: null,
                publisher: null,
                url: null,
                rawCitation: ''
            };
            const result = generateCitationFrontmatter(citation);

            expect(result).toContain('title: "Book with \\"Quoted\\" Title"');
        });
    });
});
