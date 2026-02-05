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

        // Tests for Logos-style citations with markdown links
        it('should detect Logos Chicago citation with markdown link', () => {
            const chicago = 'Robert D. Harrison, [_ANE400 Ancient Near Eastern Studies_](https://ref.ly/logosres/ane400harrison?art=art1067&off=833&ctx=lly%2c+both+together.%0a~And+now+we%E2%80%99re+lookin), Academic Press (Cambridge, MA: University Press, 2018).';
            expect(detectCitationFormat(chicago)).toBe('chicago');
        });

        it('should detect Logos MLA citation with markdown link', () => {
            const mla = 'Harrison, Robert D. [_ANE400 Ancient Near Eastern Studies_](https://ref.ly/logosres/ane400harrison?art=art1067&off=1316&ctx=vs.+Samson%E2%80%99s+Mother%0a~In+this+first+sectio). University Press, 2018.';
            expect(detectCitationFormat(mla)).toBe('mla');
        });

        it('should detect Logos APA citation with markdown link', () => {
            const apa = 'Harrison, R. D. (2018). [_ANE400 Ancient Near Eastern Studies_](https://ref.ly/logosres/ane400harrison). University Press.';
            expect(detectCitationFormat(apa)).toBe('apa');
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

        it('should parse Logos MLA citation with markdown link', () => {
            const mla = 'Harrison, Robert D. [_ANE400 Ancient Near Eastern Studies_](https://ref.ly/logosres/ane400harrison?art=art1067&off=1316&ctx=vs.+Samson%E2%80%99s+Mother%0a~In+this+first+sectio). University Press, 2018.';
            const result = parseMLA(mla);

            expect(result.format).toBe('mla');
            expect(result.author).toBe('Harrison, Robert D');
            expect(result.title).toBe('ANE400 Ancient Near Eastern Studies');
            expect(result.year).toBe('2018');
            expect(result.publisher).toBe('University Press');
            expect(result.url).toContain('ref.ly');
            expect(result.citeKey).toBe('harrison-2018');
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

        it('should parse Logos APA citation with markdown link', () => {
            const apa = 'Harrison, R. D. (2018). [_ANE400 Ancient Near Eastern Studies_](https://ref.ly/logosres/ane400harrison). University Press.';
            const result = parseAPA(apa);

            expect(result.format).toBe('apa');
            expect(result.author).toBe('Harrison, R. D.');
            expect(result.title).toBe('ANE400 Ancient Near Eastern Studies');
            expect(result.year).toBe('2018');
            expect(result.url).toContain('ref.ly');
        });

        it('should correctly parse author without capturing preceding text', () => {
            const apa = 'Author, A. B. (2020). Title here. Publisher.';
            const result = parseAPA(apa);

            expect(result.author).toBe('Author, A. B.');
            expect(result.title).toBe('Title here');
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

        it('should parse Logos Chicago citation with markdown link', () => {
            const chicago = 'Robert D. Harrison, [_ANE400 Ancient Near Eastern Studies_](https://ref.ly/logosres/ane400harrison?art=art1067&off=833&ctx=lly%2c+both+together.%0a~And+now+we%E2%80%99re+lookin), Academic Press (Cambridge, MA: University Press, 2018).';
            const result = parseChicago(chicago);

            expect(result.format).toBe('chicago');
            expect(result.author).toBe('Robert D. Harrison');
            expect(result.title).toBe('ANE400 Ancient Near Eastern Studies');
            expect(result.year).toBe('2018');
            expect(result.publisher).toBe('University Press');
            expect(result.url).toContain('ref.ly');
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

    describe('User-provided Examples', () => {
        describe('APA Examples', () => {
            it('should parse APA Example 1: Miller', () => {
                const text = 'Miller, A. J. (2018). The silicon horizon: A history of computing. North Press.';
                const result = parseAPA(text);
                expect(result.author).toBe('Miller, A. J.');
                expect(result.year).toBe('2018');
                expect(result.title).toBe('The silicon horizon: A history of computing');
                expect(result.publisher).toBe('North Press');
            });

            it('should parse APA Example 2: Garcia & Chen (edition)', () => {
                const text = 'García, M. L., & Chen, W. (2022). Urban echoes: Sociology of the modern city (2nd ed.). Riverbank Publishing.';
                const result = parseAPA(text);
                expect(result.author).toBe('García, M. L., & Chen, W.');
                expect(result.year).toBe('2022');
                expect(result.title).toContain('Urban echoes');
                expect(result.publisher).toBe('Riverbank Publishing');
            });

            it('should parse APA Example 3: Vance', () => {
                const text = 'Vance, S. R. (2015). Principles of organic chemistry. Academic Media Group.';
                const result = parseAPA(text);
                expect(result.author).toBe('Vance, S. R.');
                expect(result.year).toBe('2015');
                expect(result.title).toBe('Principles of organic chemistry');
                expect(result.publisher).toBe('Academic Media Group');
            });
        });

        describe('MLA Examples', () => {
            it('should parse MLA Example 1: Miller', () => {
                const text = 'Miller, Arthur J. _The Silicon Horizon: A History of Computing_. North Press, 2018.';
                const result = parseMLA(text);
                expect(result.author).toBe('Miller, Arthur J');
                expect(result.title).toContain('The Silicon Horizon');
                expect(result.publisher).toBe('North Press');
                expect(result.year).toBe('2018');
            });

            it('should parse MLA Example 2: Garcia & Chen', () => {
                const text = 'García, Maria L., and Wei Chen. _Urban Echoes: Sociology of the Modern City_. 2nd ed., Riverbank Publishing, 2022.';
                const result = parseMLA(text);
                expect(result.author).toBe('García, Maria L., and Wei Chen');
                expect(result.title).toContain('Urban Echoes');
                expect(result.publisher).toBe('Riverbank Publishing');
                expect(result.year).toBe('2022');
            });

            it('should parse MLA Example 3: Vance', () => {
                const text = 'Vance, Sarah R. _Principles of Organic Chemistry_. Academic Media Group, 2015.';
                const result = parseMLA(text);
                expect(result.author).toBe('Vance, Sarah R');
                expect(result.title).toContain('Principles of Organic Chemistry');
                expect(result.publisher).toBe('Academic Media Group');
                expect(result.year).toBe('2015');
            });
        });

        describe('BibTeX Examples', () => {
            it('should parse BibTeX Example 1: Miller', () => {
                const text = `@book{miller2018silicon,
  author    = {Arthur J. Miller},
  title     = {The Silicon Horizon: A History of Computing},
  publisher = {North Press},
  year      = {2018},
  address   = {Seattle}
}`;
                const result = parseBibtex(text);
                expect(result.citeKey).toBe('miller2018silicon');
                expect(result.author).toBe('Arthur J. Miller');
                expect(result.title).toBe('The Silicon Horizon: A History of Computing');
                expect(result.year).toBe('2018');
                expect(result.publisher).toBe('North Press');
            });

            it('should parse BibTeX Example 2: Garcia & Chen', () => {
                const text = `@book{garcia2022urban,
  author    = {Maria L. García and Wei Chen},
  title     = {Urban Echoes: Sociology of the Modern City},
  publisher = {Riverbank Publishing},
  year      = {2022},
  edition   = {2nd}
}`;
                const result = parseBibtex(text);
                expect(result.citeKey).toBe('garcia2022urban');
                expect(result.author).toBe('Maria L. García and Wei Chen');
                expect(result.title).toBe('Urban Echoes: Sociology of the Modern City');
                expect(result.year).toBe('2022');
                expect(result.publisher).toBe('Riverbank Publishing');
            });

            it('should parse BibTeX Example 3: Vance', () => {
                const text = `@book{vance2015organic,
  author    = {Sarah R. Vance},
  title     = {Principles of Organic Chemistry},
  publisher = {Academic Media Group},
  year      = {2015}
}`;
                const result = parseBibtex(text);
                expect(result.citeKey).toBe('vance2015organic');
                expect(result.author).toBe('Sarah R. Vance');
                expect(result.title).toBe('Principles of Organic Chemistry');
                expect(result.year).toBe('2015');
                expect(result.publisher).toBe('Academic Media Group');
            });
        });

        describe('Chicago Examples', () => {
            it('should parse Chicago Example 1: Miller', () => {
                const text = 'Miller, Arthur J. _The Silicon Horizon: A History of Computing_. Seattle: North Press, 2018.';
                const result = parseChicago(text);
                expect(result.author).toBe('Miller, Arthur J');
                expect(result.title).toContain('The Silicon Horizon');
                expect(result.publisher).toBe('North Press');
                expect(result.year).toBe('2018');
            });

            it('should parse Chicago Example 2: Garcia & Chen', () => {
                const text = 'García, Maria L., and Wei Chen. _Urban Echoes: Sociology of the Modern City_. 2nd ed. Chicago: Riverbank Publishing, 2022.';
                const result = parseChicago(text);
                expect(result.author).toBe('García, Maria L., and Wei Chen');
                expect(result.title).toContain('Urban Echoes');
                expect(result.publisher).toBe('Riverbank Publishing');
                expect(result.year).toBe('2022');
            });

            it('should parse Chicago Example 3: Vance', () => {
                const text = 'Vance, Sarah R. _Principles of Organic Chemistry_. New York: Academic Media Group, 2015.';
                const result = parseChicago(text);
                expect(result.author).toBe('Vance, Sarah R');
                expect(result.title).toContain('Principles of Organic Chemistry');
                expect(result.publisher).toBe('Academic Media Group');
                expect(result.year).toBe('2015');
            });
        });

        describe('Text + Citation Combinations', () => {
            it('should split Text + MLA Citation correctly', () => {
                const clipboard = `And now we’re looking at the book of Kings [and] the book of Samuel, where [there were] these tremendous crosses of fates we talked about—from a tent to a temple, from warlords to eternal kingship, from a loosely confederated league of tribes to an imperial power. And we looked at the outline of the book—the crossing of fates regarding Samuel, the crossing of fates of Saul and David, [and] then the rise of David, the demise of David, and the appendix.

Waltke, Bruce K. OT300 Old Testament Theology. Lexham Press, 2018.`;
                const result = parseLogosClipboard(clipboard);
                expect(result.mainText).toContain('And now we’re looking at the book of Kings');
                expect(result.mainText).toContain('the appendix.');
                expect(result.citation).not.toBeNull();
                expect(result.citation?.author).toBe('Waltke, Bruce K');
                expect(result.citation?.title).toBe('OT300 Old Testament Theology');
            });

            it('should split Text + Complex MLA Citation with page number correctly', () => {
                const clipboard = `The narrator lays the foundation for Judah’s leadership, from whom David will spring, not Benjamin’s, from whom Saul comes, by framing his book with I AM’s divine appointment of Judah to lead the other tribes in battle (Judg. 1:2; 20:18). The narrator has little good to say about Benjamin. In addition, by the framing epilogue—“In those days Israel had no king [they had warlords and Levites]; everyone did as he saw fit” (17:6; 21:25)—he lays the foundation for covenant-keeping David, Israel’s great king. David is a prototype of Jesus Christ, who is the only perfect covenant-keeping king.

Harrison, Robert D., and Elena Martinez. A Comprehensive Study of Ancient Civilizations: An Analytical, Historical, and Cultural Approach. Academic Publishers, 2007, p. 589.`;
                const result = parseLogosClipboard(clipboard);

                expect(result.mainText).toContain('The narrator lays the foundation');
                expect(result.mainText).toContain('covenant-keeping king.');
                expect(result.citation).not.toBeNull();
                expect(result.citation?.author).toBe('Harrison, Robert D., and Elena Martinez. A Comprehensive Study of Ancient Civilizations: An Analytical, Historical, and Cultural Approach');
                expect(result.citation?.year).toBe('2007');
                expect(result.page).toBe('p. 589');
            });

            it('should split Text + APA Citation correctly', () => {
                const clipboard = `God, in His grace, appears to Manoah’s wife—[through] an angel of the Lord [or] revelation—and promises her a child. When you come to Hannah, there’s no revelation at all. Manoah’s wife, however, is resigned to her barrenness. She has no prayer. She has no praise. Hannah is quite different. She wants a child; she wants a son, and she’s provoked

Waltke, B. K. (2018). OT300 Old Testament Theology. Lexham Press.`;
                const result = parseLogosClipboard(clipboard);
                expect(result.mainText).toContain('God, in His grace');
                expect(result.mainText).toContain('she’s provoked');
                expect(result.citation).not.toBeNull();
                expect(result.citation?.author).toBe('Waltke, B. K.');
                expect(result.citation?.year).toBe('2018');
                expect(result.citation?.title).toBe('OT300 Old Testament Theology');
            });
        });
    });
});

