import { buildLogosSearchUrl } from '../utils/logos-search';

describe('Logos Search', () => {
    describe('buildLogosSearchUrl', () => {
        it('should build a lexical search URL by default', () => {
            const url = buildLogosSearchUrl('grace');
            expect(url).toBe('logos4:Search;t=Lexical;s=grace');
        });

        it('should build a semantic search URL when specified', () => {
            const url = buildLogosSearchUrl('justification by faith', 'semantic');
            expect(url).toBe('logos4:Search;t=Semantic;s=justification%20by%20faith');
        });

        it('should build a lexical search URL when explicitly specified', () => {
            const url = buildLogosSearchUrl('atonement', 'lexical');
            expect(url).toBe('logos4:Search;t=Lexical;s=atonement');
        });

        it('should encode special characters in the query', () => {
            const url = buildLogosSearchUrl('God\'s love & mercy');
            expect(url).toBe('logos4:Search;t=Lexical;s=God\'s%20love%20%26%20mercy');
        });

        it('should handle multi-word queries with spaces', () => {
            const url = buildLogosSearchUrl('sermon on the mount');
            expect(url).toContain('s=sermon%20on%20the%20mount');
        });

        it('should handle queries with quotes', () => {
            const url = buildLogosSearchUrl('"exact phrase"');
            expect(url).toContain('s=%22exact%20phrase%22');
        });

        it('should handle unicode characters', () => {
            const url = buildLogosSearchUrl('חֶסֶד');
            expect(url).toBe('logos4:Search;t=Lexical;s=%D7%97%D6%B6%D7%A1%D6%B6%D7%93');
        });
    });
});
