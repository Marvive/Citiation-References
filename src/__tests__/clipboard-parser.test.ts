import {
    parseLogosClipboard,
    extractCiteKey,
    extractPageNumber,
    extractPagesFromBibtex,
    extractBookTitle
} from '../utils/clipboard-parser';

describe('Clipboard Parser', () => {
    describe('parseLogosClipboard', () => {
        it('should parse clipboard content with BibTeX', () => {
            const clipboard = `This is a quote from the book.
@book{smith2020,
  author = {John Smith},
  title = {Systematic Theology},
  pages = {123},
}`;
            const result = parseLogosClipboard(clipboard);

            expect(result.mainText).toBe('This is a quote from the book.');
            expect(result.bibtex).toContain('@book{smith2020');
            expect(result.page).toBe('123');
        });

        it('should handle clipboard without pages field', () => {
            const clipboard = `Quote text
@book{doe2021,
  author = {Jane Doe},
  title = {Biblical Studies},
}`;
            const result = parseLogosClipboard(clipboard);

            expect(result.mainText).toBe('Quote text');
            expect(result.page).toBeNull();
        });

        it('should handle multi-line quotes', () => {
            const clipboard = `First line of quote.
Second line of quote.
Third line.
@article{author2022,
  title = {Article Title},
}`;
            const result = parseLogosClipboard(clipboard);

            expect(result.mainText).toContain('First line');
            expect(result.mainText).toContain('Third line');
        });
    });

    describe('extractCiteKey', () => {
        it('should extract cite key from book entry', () => {
            const bibtex = '@book{smith2020, title = {Test}}';
            expect(extractCiteKey(bibtex)).toBe('smith2020');
        });

        it('should extract cite key from article entry', () => {
            const bibtex = '@article{jones-theology-2019, author = {Jones}}';
            expect(extractCiteKey(bibtex)).toBe('jones-theology-2019');
        });

        it('should sanitize cite keys with special characters', () => {
            const bibtex = '@book{author_name__2020, title = {Test}}';
            const result = extractCiteKey(bibtex);
            expect(result).not.toContain('_');
            expect(result).not.toContain('__');
        });

        it('should throw error for invalid BibTeX', () => {
            expect(() => extractCiteKey('invalid content')).toThrow('Could not extract cite key');
        });
    });

    describe('extractPageNumber', () => {
        it('should extract single page number', () => {
            const result = extractPageNumber('Some text (p. 42)');
            expect(result.page).toBe('p. 42');
            expect(result.cleanedText).toBe('Some text');
        });

        it('should extract page range', () => {
            const result = extractPageNumber('Quote text (pp. 10-15)');
            expect(result.page).toBe('pp. 10-15');
        });

        it('should handle text without page number', () => {
            const result = extractPageNumber('Just some regular text');
            expect(result.page).toBeNull();
            expect(result.cleanedText).toBe('Just some regular text');
        });

        it('should handle en-dash in page ranges', () => {
            const result = extractPageNumber('Text p. 100–105');
            expect(result.page).toBe('p. 100–105');
        });
    });

    describe('extractPagesFromBibtex', () => {
        it('should extract pages from BibTeX', () => {
            const bibtex = '@book{test, pages = {123-456}, title = {Book}}';
            expect(extractPagesFromBibtex(bibtex)).toBe('123-456');
        });

        it('should return null when no pages field', () => {
            const bibtex = '@book{test, title = {Book}}';
            expect(extractPagesFromBibtex(bibtex)).toBeNull();
        });
    });

    describe('extractBookTitle', () => {
        it('should extract title from BibTeX', () => {
            const bibtex = '@book{test, title = {Systematic Theology: An Introduction}}';
            expect(extractBookTitle(bibtex)).toBe('Systematic Theology: An Introduction');
        });

        it('should return null when no title field', () => {
            const bibtex = '@misc{test, author = {Someone}}';
            expect(extractBookTitle(bibtex)).toBeNull();
        });
    });
});
