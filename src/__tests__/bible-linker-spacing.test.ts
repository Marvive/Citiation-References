import { linkBibleVerses } from '../utils/bible-linker';

describe('Bible Linker Spacing', () => {
    it('should not add an extra space after an opening parenthesis', () => {
        const text = 'help her (2 Kings 4:1); Elisha removes death in the pot for prophets (4:38–41); and he makes a prophet’s borrowed axe head float (6:1–7).';
        const result = linkBibleVerses(text, 'esv');

        // We check that there is no space after the parenthesis "(" that precedes the link
        expect(result).toContain('prophets ([4:38–41]');
        expect(result).not.toContain('prophets ( [4:38–41]');

        expect(result).toContain('float ([6:1–7]');
        expect(result).not.toContain('float ( [6:1–7]');
    });

    it('should maintain space after comma and semicolon', () => {
        const text = 'Gen 1:1, 2:2; 3:3';
        const result = linkBibleVerses(text, 'esv');

        expect(result).toContain('), [2:2]'); // Linked Gen 1:1 (ending in URL) followed by linked 2:2
        expect(result).toContain('; [3:3]');
    });
});
