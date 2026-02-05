/**
 * Citation References Plugin - Main Entry Point
 * 
 * A refined plugin for managing citations from various sources in Obsidian.
 */

import { Editor, MarkdownView, Notice, Plugin, TAbstractFile, TFile, TFolder, htmlToMarkdown } from 'obsidian';
import { LogosPluginSettings, DEFAULT_SETTINGS, ParsedCitation } from './types';
import { CitationPluginSettingTab } from './settings';
import { parseLogosClipboard, cleanFormattedText } from './utils/clipboard-parser';
import { linkBibleVerses } from './utils/bible-linker';
import { sanitizeNoteName, generateCitationFrontmatter } from './utils/file-utils';

export default class CitationReferencePlugin extends Plugin {
    settings: LogosPluginSettings;
    private ribbonIconEl: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();
        this.refreshRibbonIcon();

        this.addCommand({
            id: 'paste-citation-reference',
            name: 'Paste citation reference',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.handlePasteCitationReference(editor, view);
            }
        });

        this.addCommand({
            id: 'list-all-citations',
            name: 'List all citations',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.handleListCitations(editor, view);
            }
        });

        this.addSettingTab(new CitationPluginSettingTab(this.app, this));
    }

    /**
     * Handles the "Paste citation reference" command
     */
    private async handlePasteCitationReference(editor: Editor, view: MarkdownView): Promise<void> {
        const file = view.file;
        if (!file) {
            new Notice("No active editor");
            return;
        }

        const notePath = file.name;

        // 1. Read plain text version first (most reliable for BibTeX)
        const plainClipboard = await navigator.clipboard.readText();
        let { mainText, citation, page, reflyLink } = parseLogosClipboard(plainClipboard, this.settings.citationFormat);

        // 2. Try to read HTML version to get formatted text (always enabled now)
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                if (item.types.includes('text/html')) {
                    const blob = await item.getType('text/html');
                    const html = await blob.text();
                    const markdown = htmlToMarkdown(html);

                    // Parse the markdown version as well
                    const parsedMarkdown = parseLogosClipboard(markdown, this.settings.citationFormat);

                    // Use formatted main text
                    mainText = parsedMarkdown.mainText;

                    // If citation was missing in plain text but present in HTML, use it
                    if (!citation && parsedMarkdown.citation) {
                        citation = parsedMarkdown.citation;
                    }
                    if (!page && parsedMarkdown.page) {
                        page = parsedMarkdown.page;
                    }
                    if (!reflyLink && parsedMarkdown.reflyLink) {
                        reflyLink = parsedMarkdown.reflyLink;
                    }
                    if (reflyLink) {
                        reflyLink = reflyLink.replace(/[\\.,;]+$/, '');
                    }
                    break;

                }
            }
        } catch (e) {
            console.error("Failed to read HTML from clipboard", e);
        }

        if (!citation) {
            new Notice("Could not find citation in clipboard. Please ensure you copied a valid citation.");
            return;
        }

        // Apply formatting cleanup (always enabled now)
        mainText = cleanFormattedText(mainText);

        const folder = this.settings.citationFolder.trim() || '';

        // Determine the note name - always use book title with "References" suffix
        let noteName = citation.citeKey;
        if (citation.title) {
            noteName = `${citation.title} - References`;
        }
        noteName = sanitizeNoteName(noteName);

        const filePath = folder ? `${folder}/${noteName}.md` : `${noteName}.md`;

        // Auto-detect Bible verses and link them to Logos if enabled
        if (this.settings.autoDetectBibleVerses) {
            mainText = linkBibleVerses(mainText, this.settings.bibleTranslation);
        }

        const pageLabel = page
            ? `, ${page.includes('-') || page.includes('–') ? 'pp.' : 'p.'} ${page}`
            : "";

        // Generate block ID using a persistent counter
        const counters = this.settings.citationCounters;
        if (!counters[notePath]) {
            counters[notePath] = 1;
        } else {
            counters[notePath]++;
        }
        const blockId = `${citation.citeKey.replace(' ', '-')}-${counters[notePath]}`;
        await this.saveSettings();

        // Build the callout block
        const calloutTitle = this.settings.customCalloutTitle || 'Citation Reference';
        const quotedTextParts = [
            `> [!cite] ${calloutTitle}`,
            `> ${mainText.split('\n').join('\n> ')}`
        ];

        // Resource link logic
        let resourceLinkText = "";
        if (this.settings.includeReflyLink && reflyLink) {
            resourceLinkText = `[Resource Link](${reflyLink})`;
        }

        // Full citation logic
        if (this.settings.showFullCitationInCallout) {
            let citationText = citation.rawCitation;
            if (resourceLinkText) {
                // Determine if we should append on the same line or new line
                if (citationText.includes('\n')) {
                    citationText += `\n${resourceLinkText}`;
                } else {
                    citationText += ` ${resourceLinkText}`;
                }
            }
            quotedTextParts.push(`> `);
            quotedTextParts.push(`> ${citationText.split('\n').join('\n> ')}`);
            quotedTextParts.push(`> `);
        } else if (resourceLinkText) {
            // Show link on its own if citation is hidden but link is enabled
            quotedTextParts.push(`> `);
            quotedTextParts.push(`> ${resourceLinkText}`);
            quotedTextParts.push(`> `);
        }

        const linkAlias = `${noteName}${pageLabel}`;
        quotedTextParts.push(`> [[${filePath}|${linkAlias}]] ^${blockId}`);
        const quotedText = quotedTextParts.join('\n');


        // Always add extra newline after callout (was a toggle, now default)
        const newlineAfter = '\n\n';
        editor.replaceSelection(`${quotedText}${newlineAfter}`);

        // Create or update the reference file
        await this.createOrUpdateReferenceFile(filePath, folder, citation, file.basename, blockId, page);
    }

    /**
     * Creates a new reference file or appends a citation to an existing one
     */
    private async createOrUpdateReferenceFile(
        filePath: string,
        folder: string,
        citation: ParsedCitation,
        sourceBasename: string,
        blockId: string,
        page: string | null
    ): Promise<void> {
        const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
        const abstractFileFolder = this.app.vault.getAbstractFileByPath(folder);
        // Link format: [[SourceNote#^id]]![[SourceNote#^id]]
        const linkBack = `[[${sourceBasename}#^${blockId}]]![[${sourceBasename}#^${blockId}]]${page ? ` → p. ${page}` : ''}`;

        if (!abstractFile) {
            // Create folder if needed
            if (folder && (!abstractFileFolder || !(abstractFileFolder instanceof TFolder))) {
                await this.app.vault.createFolder(folder);
            }

            const citationPrefix = '\n';

            // Generate frontmatter from citation data
            const customFields = this.settings.useCustomMetadata ? this.settings.customMetadataFields : [];
            const metadata = generateCitationFrontmatter(citation, customFields);

            const content = metadata + [
                '## Citations',
                `${citationPrefix}- ${linkBack}`
            ].join('\n');

            await this.app.vault.create(filePath, content);
            new Notice(`Created ${filePath}`);
        } else {
            await this.appendCitationToFile(abstractFile, linkBack);
        }
    }

    /**
     * Appends a citation link to an existing reference file
     */
    private async appendCitationToFile(abstractFile: TAbstractFile, linkBack: string): Promise<void> {
        if (!(abstractFile instanceof TFile)) {
            new Notice(`Could not read file: not a valid file`);
            return;
        }

        const refNote = await this.app.vault.read(abstractFile);
        const citationPrefix = '\n';
        const citationLine = `${citationPrefix}- ${linkBack}`;
        let updatedContent: string;

        if (refNote.includes("## Citations")) {
            updatedContent = refNote.replace(
                /## Citations([\s\S]*?)((\n#+\s)|$)/,
                (match: string, citations: string, followingHeading: string) => {
                    if (!match.includes(linkBack)) {
                        return `## Citations\n${citations.trim()}\n${citationLine}\n${followingHeading}`;
                    }
                    return match;
                }
            );
        } else {
            updatedContent = `${refNote.trim()}\n\n## Citations\n${citationLine}`;
        }

        await this.app.vault.modify(abstractFile, updatedContent);
    }

    /**
     * Handles the "List all citations" command
     */
    private async handleListCitations(editor: Editor, view: MarkdownView): Promise<void> {
        const filePath = view.file?.path;
        if (!filePath) {
            new Notice("No active file");
            return;
        }

        const links = await this.getAllLinksInDocument(filePath);
        if (links.length === 0) {
            new Notice("No references found in the document.");
            return;
        }

        const citations = await this.getCitationsFromLinks(links);
        if (citations.length === 0) {
            new Notice("No citations found in linked notes");
            return;
        }

        const citationList = citations.join("\n\n");
        const activeFile = this.app.workspace.getActiveFile();

        if (activeFile instanceof TFile) {
            const content = await this.app.vault.read(activeFile);
            const updatedContent = `${content}\n\n## Bibliography\n${citationList}`;
            await this.app.vault.modify(activeFile, updatedContent);
            new Notice("References added to the document");
        } else {
            new Notice("Could not read active file: not a valid file");
        }
    }

    /**
     * Gets all links in a document
     */
    async getAllLinksInDocument(filePath: string): Promise<string[]> {
        const abstractFile = this.app.vault.getAbstractFileByPath(filePath);
        if (!(abstractFile instanceof TFile)) return await Promise.resolve([]);

        const cache = this.app.metadataCache.getFileCache(abstractFile);
        if (!cache || !cache.links) return [];

        return Array.from(new Set(cache.links.map(link => link.link)));
    }

    /**
     * Extracts citation content from linked notes (looks for frontmatter cite-key)
     */
    async getCitationsFromLinks(links: string[]): Promise<string[]> {
        const citations: string[] = [];
        for (const link of links) {
            const file = this.app.vault.getAbstractFileByPath(link);
            if (file instanceof TFile) {
                const content = await this.app.vault.read(file);

                // Try to extract from YAML frontmatter first
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                if (frontmatterMatch) {
                    const frontmatter = frontmatterMatch[1];
                    const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
                    const authorMatch = frontmatter.match(/author:\s*"([^"]+)"/);
                    const yearMatch = frontmatter.match(/year:\s*(\d+)/);

                    if (titleMatch && authorMatch) {
                        const citation = `${authorMatch[1]}. *${titleMatch[1]}*${yearMatch ? ` (${yearMatch[1]})` : ''}.`;
                        citations.push(citation);
                        continue;
                    }
                }

                // Fallback: try to find BibTeX code block (legacy format)
                const bibtexMatch = content.match(/```bibtex[\s\S]*?```/);
                if (bibtexMatch) {
                    const bibtexContent = bibtexMatch[0].replace(/```bibtex|```/g, '').trim();
                    citations.push(bibtexContent);
                }
            }
        }
        return citations;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData() as LogosPluginSettings));
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Creates or removes the ribbon icon based on settings
     */
    refreshRibbonIcon() {
        if (this.settings.showRibbonIcon && !this.ribbonIconEl) {
            this.ribbonIconEl = this.addRibbonIcon('quote', 'Paste citation reference', async () => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    await this.handlePasteCitationReference(activeView.editor, activeView);
                } else {
                    new Notice("No active editor found");
                }
            });
        } else if (!this.settings.showRibbonIcon && this.ribbonIconEl) {
            this.ribbonIconEl.remove();
            this.ribbonIconEl = null;
        }
    }
}

// Re-export types for settings tab
export type { LogosPluginSettings };
