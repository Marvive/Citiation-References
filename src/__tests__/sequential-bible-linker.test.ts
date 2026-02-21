import { linkBibleVerses } from '../utils/bible-linker';

describe('Sequential Bible Linking', () => {
    it('should assume same book for sequential references with semicolon', () => {
        const text = 'Deut. 19:12; 21:1-9';
        const result = linkBibleVerses(text, 'esv');

        expect(result).toContain('[Deut. 19:12](https://ref.ly/Dt19.12;esv)');
        expect(result).toContain('[21:1-9](https://ref.ly/Dt21.1-9;esv)');
    });

    it('should assume same book for multiple sequential references', () => {
        const text = 'Deut. 19:12; 21:1–9; 22:13–21; 25:1–10';
        const result = linkBibleVerses(text, 'esv');

        expect(result).toContain('[Deut. 19:12](https://ref.ly/Dt19.12;esv)');
        expect(result).toContain('[21:1–9](https://ref.ly/Dt21.1-9;esv)');
        expect(result).toContain('[22:13–21](https://ref.ly/Dt22.13-21;esv)');
        expect(result).toContain('[25:1–10](https://ref.ly/Dt25.1-10;esv)');
    });

    it('should handle comma separators for chapters if applicable', () => {
        // Technically "Deut. 19:12, 21:1" usually means Deut. 19:12 and Deut. 21:1
        const text = 'Deut. 19:12, 21:1';
        const result = linkBibleVerses(text, 'esv');

        expect(result).toContain('[Deut. 19:12](https://ref.ly/Dt19.12;esv)');
        expect(result).toContain('[21:1](https://ref.ly/Dt21.1;esv)');
    });

    it('should not link random times if no book was previously mentioned', () => {
        const text = 'The time is 10:30.';
        const result = linkBibleVerses(text, 'esv');
        expect(result).toBe(text);
    });

    it('should reset book state if a new book is mentioned', () => {
        const text = 'Gen 1:1; Ex 2:1; 3:1';
        const result = linkBibleVerses(text, 'esv');

        expect(result).toContain('[Gen 1:1](https://ref.ly/Ge1.1;esv)');
        expect(result).toContain('[Ex 2:1](https://ref.ly/Ex2.1;esv)');
        expect(result).toContain('[3:1](https://ref.ly/Ex3.1;esv)');
    });

    it('should maintain book context across sentence boundaries and plain text like "Apart from"', () => {
        const text = 'Most often, however, unqualified ḥayyîm refers to “life” that is added to clinical life, apparently an abundant life of health, prosperity, and social esteem (Prov. 3:21–22; 4:13; 8:35; 16:15; 21:21; 22:4). Apart from 16:15, these passages and others hold out life as wisdom’s reward, a reward never said to be tarnished by death (4:22; 6:23; 10:17; 11:19; 12:28; 13:14; 15:31; 19:23; 22:4).';
        const result = linkBibleVerses(text, 'esv');

        // Initial sequence
        expect(result).toContain('[Prov. 3:21–22](https://ref.ly/Pr3.21-22;esv)');
        expect(result).toContain('[4:13](https://ref.ly/Pr4.13;esv)');
        expect(result).toContain('[16:15](https://ref.ly/Pr16.15;esv)');

        // After "Apart from"
        expect(result).toContain('[16:15](https://ref.ly/Pr16.15;esv)');
        expect(result).toContain('[4:22](https://ref.ly/Pr4.22;esv)');
        expect(result).toContain('[22:4](https://ref.ly/Pr22.4;esv)');
    });
});
