/**
 * Modal for linking existing notes to Logos library metadata.
 * Searches the local Logos catalog.db to find books and apply missing properties.
 */

import { App, Modal, Notice, Setting, TFile } from 'obsidian';
import { LogosPluginSettings } from '../types';
import { searchCatalog, getCoverImage, findCatalogDbPath, LogosCatalogEntry } from '../utils/catalog-reader';
import { saveCoverFromBlob } from '../utils/cover-fetcher';

export class LibraryLinkModal extends Modal {
    private settings: LogosPluginSettings;
    private file: TFile;
    private searchInput: string = '';
    private selectedEntry: LogosCatalogEntry | null = null;
    private resultsContainer: HTMLElement | null = null;
    private previewContainer: HTMLElement | null = null;
    private dbPath: string | null = null;

    constructor(app: App, settings: LogosPluginSettings, file: TFile) {
        super(app);
        this.settings = settings;
        this.file = file;

        // Resolve the catalog DB path
        this.dbPath = settings.logosDataPath || findCatalogDbPath();

        // Pre-populate search with note title (strip " - References" suffix)
        let title = file.basename;
        title = title.replace(/\s*-\s*References$/i, '');
        this.searchInput = title;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('library-link-modal');

        contentEl.createEl('h2', { text: 'Link note to logos library' });

        if (!this.dbPath) {
            contentEl.createEl('p', {
                text: 'Could not find the logos catalog database. Please set the path in plugin settings under "logos data folder".',
                cls: 'library-link-error'
            });
            return;
        }

        contentEl.createEl('p', {
            text: 'Search your logos library to find a book and populate missing metadata on this note.',
            cls: 'library-link-description'
        });

        // Search input
        new Setting(contentEl)
            .setName('Search your library')
            .addText((text) => {
                text
                    .setPlaceholder('Type a title or author...')
                    .setValue(this.searchInput)
                    .onChange((value) => {
                        this.searchInput = value;
                        this.doSearch();
                    });
                // Auto-focus
                setTimeout(() => text.inputEl.focus(), 50);
            });

        // Results list
        this.resultsContainer = contentEl.createDiv({ cls: 'library-link-results' });

        // Preview area
        this.previewContainer = contentEl.createDiv({ cls: 'library-link-preview' });

        // Action buttons
        const buttonContainer = contentEl.createDiv({ cls: 'library-link-buttons' });

        const linkButton = buttonContainer.createEl('button', {
            text: 'Apply metadata',
            cls: 'mod-cta'
        });
        linkButton.addEventListener('click', async () => {
            await this.handleLink();
        });

        const cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel'
        });
        cancelButton.addEventListener('click', () => {
            this.close();
        });

        // Run initial search with pre-populated title
        if (this.searchInput) {
            this.doSearch();
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    /**
     * Execute search against the catalog DB and render results
     */
    private doSearch(): void {
        if (!this.resultsContainer || !this.dbPath) return;
        this.resultsContainer.empty();
        this.selectedEntry = null;
        if (this.previewContainer) this.previewContainer.empty();

        if (this.searchInput.length < 2) return;

        const results = searchCatalog(this.dbPath, this.searchInput, 15);

        if (results.length === 0) {
            this.resultsContainer.createEl('p', {
                text: 'No matching books found.',
                cls: 'library-link-no-results'
            });
            return;
        }

        for (const entry of results) {
            const item = this.resultsContainer.createDiv({ cls: 'library-link-result-item' });
            item.createEl('span', { text: entry.title, cls: 'library-link-result-title' });
            if (entry.authors) {
                item.createEl('span', { text: entry.authors, cls: 'library-link-result-author' });
            }

            item.addEventListener('click', () => {
                // Deselect previous
                this.resultsContainer?.querySelectorAll('.library-link-result-item').forEach(el => {
                    el.removeClass('is-selected');
                });
                item.addClass('is-selected');
                this.selectedEntry = entry;
                this.showPreview(entry);
            });
        }
    }

    /**
     * Show a preview of the metadata that will be applied
     */
    private showPreview(entry: LogosCatalogEntry): void {
        if (!this.previewContainer) return;
        this.previewContainer.empty();

        this.previewContainer.createEl('h4', { text: 'Metadata to apply' });

        const table = this.previewContainer.createEl('table', { cls: 'library-link-preview-table' });
        const fields: [string, string][] = [
            ['Title', entry.title],
            ['Author', entry.authors],
            ['Publisher', entry.publisher],
            ['Year', entry.publicationDate],
            ['Series', entry.series],
            ['Description', entry.description ? entry.description.substring(0, 200) + (entry.description.length > 200 ? '…' : '') : ''],
        ];

        for (const [label, value] of fields) {
            if (!value) continue;
            const row = table.createEl('tr');
            row.createEl('td', { text: label, cls: 'library-link-preview-label' });
            row.createEl('td', { text: value, cls: 'library-link-preview-value' });
        }
    }

    /**
     * Apply the selected catalog entry's metadata to the note
     */
    private async handleLink(): Promise<void> {
        if (!this.selectedEntry) {
            new Notice('Please select a book from the search results first.');
            return;
        }

        const entry = this.selectedEntry;

        try {
            // Read existing file content
            const content = await this.app.vault.read(this.file);

            // Parse existing frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            let frontmatterLines: string[] = [];
            let bodyContent = content;

            if (frontmatterMatch) {
                frontmatterLines = frontmatterMatch[1].split('\n');
                bodyContent = content.substring(frontmatterMatch[0].length);
            }

            // Build a map of existing keys → {lineIndex, hasValue}
            const existingKeyMap = new Map<string, { lineIndex: number; hasValue: boolean }>();
            frontmatterLines.forEach((line, idx) => {
                // Match top-level keys (not indented list items)
                const match = line.match(/^([^\s:][^:]*):\s*(.*)/);
                if (match) {
                    const rawKey = match[1].trim();
                    const value = match[2].trim();
                    const hasValue = value !== '' && value !== '""' && value !== "''";
                    const normalizedKey = rawKey.replace(/"/g, '');
                    existingKeyMap.set(rawKey, { lineIndex: idx, hasValue });
                    if (rawKey !== normalizedKey) {
                        existingKeyMap.set(normalizedKey, { lineIndex: idx, hasValue });
                    }
                }
            });

            // Prepare the values to set
            const fieldsToApply: { key: string; formattedValue: string }[] = [];

            const prepareField = (key: string, value: string | undefined, quoteValue: boolean = true) => {
                if (!value || value.trim() === '') return;
                const formatted = quoteValue
                    ? `"${value.replace(/"/g, '\\"')}"`
                    : value;
                fieldsToApply.push({ key, formattedValue: formatted });
            };

            prepareField('title', entry.title);
            prepareField('author', entry.authors);
            prepareField('publisher', entry.publisher);
            prepareField('year', entry.publicationDate, false);
            prepareField('publication-date', entry.publicationDate, false);
            prepareField('series', entry.series);
            prepareField('description', entry.description);

            // Cover image from Logos DB
            let coverField: { key: string; formattedValue: string } | null = null;
            if (this.dbPath) {
                const existing = existingKeyMap.get('local*cover') || existingKeyMap.get('"local*cover"');
                if (!existing || !existing.hasValue) {
                    const imageData = getCoverImage(this.dbPath, entry.recordId);
                    if (imageData) {
                        const folder = this.settings.citationFolder.trim() || '';
                        const coverPath = await saveCoverFromBlob(
                            imageData,
                            entry.recordId.toString(),
                            folder,
                            this.settings.coverImageSubfolder,
                            this.app.vault
                        );
                        if (coverPath) {
                            coverField = { key: '"local*cover"', formattedValue: `${coverPath}` };
                        }
                    }
                }
            }

            const updatedFields: string[] = [];
            const appendLines: string[] = [];

            // Process each field: update in-place if key exists & empty, or append if key is missing
            for (const { key, formattedValue } of fieldsToApply) {
                const existing = existingKeyMap.get(key) || existingKeyMap.get(`"${key}"`);
                if (existing) {
                    if (!existing.hasValue) {
                        // Key exists but is empty — fill it in
                        frontmatterLines[existing.lineIndex] = `${key}: ${formattedValue}`;
                        updatedFields.push(key);
                    }
                    // Key exists with value — skip (don't overwrite)
                } else {
                    // Key doesn't exist — append
                    appendLines.push(`${key}: ${formattedValue}`);
                    updatedFields.push(key);
                }
            }

            // Handle cover field
            if (coverField) {
                const existing = existingKeyMap.get('local*cover') || existingKeyMap.get('"local*cover"');
                if (existing && !existing.hasValue) {
                    frontmatterLines[existing.lineIndex] = `${coverField.key}: ${coverField.formattedValue}`;
                    updatedFields.push('local*cover');
                } else if (!existing) {
                    appendLines.push(`${coverField.key}: ${coverField.formattedValue}`);
                    updatedFields.push('local*cover');
                }
            }

            if (updatedFields.length === 0) {
                new Notice('All properties already have values on this note.');
                this.close();
                return;
            }

            // Rebuild frontmatter
            const allLines = [...frontmatterLines, ...appendLines];
            const newFrontmatter = `---\n${allLines.join('\n')}\n---`;
            const newContent = newFrontmatter + bodyContent;

            await this.app.vault.modify(this.file, newContent);

            new Notice(`Updated ${updatedFields.length} properties: ${updatedFields.join(', ')}`);
            this.close();
        } catch (e) {
            console.error('Failed to link note to logos library:', e);
            new Notice('Failed to update note. See console for details.');
        }
    }
}
