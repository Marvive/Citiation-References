import {
    sanitizeNoteName,
    generateNotePath,
    generateMetadataFrontmatter
} from '../utils/file-utils';

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
});
