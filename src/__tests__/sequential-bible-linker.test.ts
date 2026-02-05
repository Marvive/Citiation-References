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
});
