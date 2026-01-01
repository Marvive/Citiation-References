import { linkBibleVerses, getLogosVersionCode } from '../utils/bible-linker';

describe('Bible Linker', () => {
    describe('linkBibleVerses', () => {
        it('should link a simple verse reference', () => {
            const text = 'As it says in John 3:16, God loved the world.';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toContain('[John 3:16]');
            expect(result).toContain('https://ref.ly/Jn3.16;esv');
        });

        it('should link verse ranges', () => {
            const text = 'Read Genesis 1:1-5 for the creation story.';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toContain('[Genesis 1:1-5]');
            expect(result).toContain('https://ref.ly/Ge1.1-5;esv');
        });

        it('should handle abbreviated book names', () => {
            const text = 'See Gen 1:1 and Ex 20:1';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toContain('https://ref.ly/Ge1.1;esv');
            expect(result).toContain('https://ref.ly/Ex20.1;esv');
        });

        it('should handle numbered books (1 John, 2 Kings)', () => {
            const text = '1 John 1:9 and 2 Kings 5:14';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toContain('https://ref.ly/1Jn1.9;esv');
            expect(result).toContain('https://ref.ly/2Ki5.14;esv');
        });

        it('should use correct version codes for NASB', () => {
            const text = 'Romans 8:28';
            const result = linkBibleVerses(text, 'nasb');

            expect(result).toContain(';nasb95');
        });

        it('should use correct version codes for NIV', () => {
            const text = 'Romans 8:28';
            const result = linkBibleVerses(text, 'niv');

            expect(result).toContain(';niv2011');
        });

        it('should use correct version codes for LSB', () => {
            const text = 'Romans 8:28';
            const result = linkBibleVerses(text, 'lsb');

            expect(result).toContain(';lgcystndrdbblsb');
        });

        it('should not modify non-Bible references', () => {
            const text = 'The meeting is at 10:30 in room 5.';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toBe(text);
        });

        it('should handle multiple verses in one text', () => {
            const text = 'Compare Matt 5:1 with Luke 6:20 and John 1:1.';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toContain('[Matt 5:1]');
            expect(result).toContain('[Luke 6:20]');
            expect(result).toContain('[John 1:1]');
        });

        it('should handle abbreviated book with period', () => {
            const text = 'See Gen. 1:1 for the beginning.';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toContain('[Gen. 1:1]');
            expect(result).toContain('https://ref.ly/Ge1.1;esv');
        });

        it('should handle Psalms correctly', () => {
            const text = 'Psalm 23:1 and Ps 119:105';
            const result = linkBibleVerses(text, 'esv');

            expect(result).toContain('https://ref.ly/Ps23.1;esv');
            expect(result).toContain('https://ref.ly/Ps119.105;esv');
        });
    });

    describe('getLogosVersionCode', () => {
        it('should return correct code for esv', () => {
            expect(getLogosVersionCode('esv')).toBe('esv');
        });

        it('should return correct code for nasb', () => {
            expect(getLogosVersionCode('nasb')).toBe('nasb95');
        });

        it('should return correct code for niv', () => {
            expect(getLogosVersionCode('niv')).toBe('niv2011');
        });

        it('should return correct code for lsb', () => {
            expect(getLogosVersionCode('lsb')).toBe('lgcystndrdbblsb');
        });

        it('should return input for unknown versions', () => {
            expect(getLogosVersionCode('kjv')).toBe('kjv');
        });
    });
});
