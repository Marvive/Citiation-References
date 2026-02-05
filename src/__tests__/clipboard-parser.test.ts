import {
    parseLogosClipboard,
    extractCiteKey,
    extractPageNumber,
    extractPagesFromBibtex,
    extractBookTitle,
    cleanFormattedText,
    detectCitationFormat,
    parseBibtex,
    parseMLA,
    parseAPA,
    parseChicago
} from '../utils/clipboard-parser';

describe('Clipboard Parser', () => {
    describe('detectCitationFormat', () => {
        it('should detect BibTeX format', () => {
            const bibtex = '@book{smith2020, title={Test}}';
            expect(detectCitationFormat(bibtex)).toBe('bibtex');
        });

        it('should detect APA format', () => {
            const apa = 'Smith, J. A. (2020). Title of work. Publisher.';
            expect(detectCitationFormat(apa)).toBe('apa');
        });

        it('should detect MLA format', () => {
            const mla = 'Smith, John. Title of Work. Publisher, 2020.';
            expect(detectCitationFormat(mla)).toBe('mla');
        });

        it('should detect Chicago format', () => {
            const chicago = 'Smith, John. Title of Work. New York: Publisher, 2020.';
            expect(detectCitationFormat(chicago)).toBe('chicago');
        });

        it('should default to bibtex for unknown formats', () => {
            const unknown = 'Some random text';
            expect(detectCitationFormat(unknown)).toBe('bibtex');
        });
    });

    describe('parseBibtex', () => {
        it('should parse BibTeX entry fields', () => {
            const bibtex = `@book{smith2020,
                author = {John Smith},
                title = {Systematic Theology},
                year = {2020},
                publisher = {Academic Press},
                pages = {123}
            }`;
            const result = parseBibtex(bibtex);

            expect(result.citeKey).toBe('smith2020');
            expect(result.author).toBe('John Smith');
            expect(result.title).toBe('Systematic Theology');
            expect(result.year).toBe('2020');
            expect(result.publisher).toBe('Academic Press');
            expect(result.pages).toBe('123');
            expect(result.format).toBe('bibtex');
        });

        it('should sanitize cite keys with special characters', () => {
            const bibtex = '@book{author_name__2020, title = {Test}}';
            const result = parseBibtex(bibtex);
            expect(result.citeKey).not.toContain('_');
            expect(result.citeKey).not.toContain('__');
        });

        it('should handle missing fields gracefully', () => {
            const bibtex = '@misc{test}';
            const result = parseBibtex(bibtex);
            expect(result.author).toBeNull();
            expect(result.title).toBeNull();
            expect(result.year).toBeNull();
        });
    });

    describe('parseMLA', () => {
        it('should parse MLA citation', () => {
            const mla = 'Smith, John. "The Great Book." Academic Press, 2020.';
            const result = parseMLA(mla);

            expect(result.format).toBe('mla');
            expect(result.author).toBe('Smith, John');
            expect(result.citeKey).toContain('smith');
            expect(result.citeKey).toContain('2020');
        });
    });

    describe('parseAPA', () => {
        it('should parse APA citation', () => {
            const apa = 'Smith, J. A. (2020). Title of work. Academic Publisher.';
            const result = parseAPA(apa);

            expect(result.format).toBe('apa');
            expect(result.year).toBe('2020');
            expect(result.citeKey).toContain('smith');
        });
    });

    describe('parseChicago', () => {
        it('should parse Chicago citation', () => {
            const chicago = 'Smith, John. Title of Work. New York: Academic Press, 2020.';
            const result = parseChicago(chicago);

            expect(result.format).toBe('chicago');
            expect(result.year).toBe('2020');
            expect(result.author).toBe('Smith, John');
        });
    });

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
            expect(result.citation).not.toBeNull();
            expect(result.citation?.citeKey).toBe('smith2020');
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

        it('should handle clipboard with Markdown formatting (italics and bold)', () => {
            const clipboard = `This is a *quote* with **bold** text.
@book{smith2020,
  author = {John Smith},
  title = {Systematic Theology},
  pages = {123},
}`;
            const result = parseLogosClipboard(clipboard);

            expect(result.mainText).toBe('This is a *quote* with **bold** text.');
            expect(result.citation).not.toBeNull();
        });

        it('should handle clipboard that is only a BibTeX entry', () => {
            const clipboard = `@book{citation2023, title={Only Citation}}`;
            const result = parseLogosClipboard(clipboard);
            expect(result.mainText).toBe("");
            expect(result.citation?.citeKey).toBe('citation2023');
        });

        it('should handle clipboard with space instead of newline before @', () => {
            const clipboard = `Text result @book{citation2023, title={Only Citation}}`;
            const result = parseLogosClipboard(clipboard);
            expect(result.mainText).toBe("Text result");
            expect(result.citation?.citeKey).toBe('citation2023');
        });

        it('should extract ref.ly link and clean mainText', () => {
            const clipboard = `Quote text (Resource Link: https://ref.ly/logosref/phi.1.1;esv)
@book{smith2020,
  title = {Test},
}`;
            const result = parseLogosClipboard(clipboard);

            expect(result.mainText).toBe('Quote text');
            expect(result.reflyLink).toBe('https://ref.ly/logosref/phi.1.1;esv');
        });

        it('should extract ref.ly link without prefix and clean mainText', () => {
            const clipboard = `Quote text https://ref.ly/logosref/phi.1.1;esv
@book{smith2020,
  title = {Test},
}`;
            const result = parseLogosClipboard(clipboard);

            expect(result.mainText).toBe('Quote text');
            expect(result.reflyLink).toBe('https://ref.ly/logosref/phi.1.1;esv');
        });

        it('should respect preferred format when specified', () => {
            const clipboard = `Smith, J. A. (2020). Test title. Publisher.`;
            const result = parseLogosClipboard(clipboard, 'apa');
            expect(result.citation?.format).toBe('apa');
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

    describe('cleanFormattedText', () => {
        it('should convert single underscores to asterisks', () => {
            const input = 'This is _italic_ text.';
            expect(cleanFormattedText(input)).toBe('This is *italic* text.');
        });

        it('should convert double underscores to superscripts', () => {
            const input = 'This is __bold__ text.';
            expect(cleanFormattedText(input)).toBe('This is <sup>bold</sup> text.');
        });

        it('should leave double asterisks as they are', () => {
            const input = 'This is **bold** text.';
            expect(cleanFormattedText(input)).toBe('This is **bold** text.');
        });

        it('should handle multiple formats in one string', () => {
            const input = 'The _quick_ brown fox __jumps__ over the **lazy** dog.';
            expect(cleanFormattedText(input)).toBe('The *quick* brown fox <sup>jumps</sup> over the **lazy** dog.');
        });
    });
});
