/**
 * Custom auto-completion and suggestion engine for Logos References
 */

import { App, ISuggestOwner, Scope, TAbstractFile, TFolder } from "obsidian";
import { createPopper, Instance as PopperInstance } from "@popperjs/core";

/**
 * Enhanced suggestion engine tailored for folder selection
 */
export class FolderSuggestEngine {
    private app: App;
    private inputEl: HTMLInputElement | HTMLTextAreaElement;
    private scope: Scope;
    private suggestionsEl: HTMLElement;
    private popper: PopperInstance;

    private values: TFolder[] = [];
    private suggestionNodes: HTMLDivElement[] = [];
    private selectedIndex: number = 0;

    constructor(app: App, inputEl: HTMLInputElement | HTMLTextAreaElement) {
        this.app = app;
        this.inputEl = inputEl;
        this.scope = new Scope();

        this.suggestionsEl = createDiv("suggestion-container");
        const suggestionBox = this.suggestionsEl.createDiv("suggestion");

        // Event delegation for clicks
        suggestionBox.on("click", ".suggestion-item", (event: MouseEvent, el: HTMLDivElement) => {
            event.preventDefault();
            this.handleSelection(this.suggestionNodes.indexOf(el));
        });

        // Highlight on hover
        suggestionBox.on("mousemove", ".suggestion-item", (event: MouseEvent, el: HTMLDivElement) => {
            this.setHighlight(this.suggestionNodes.indexOf(el), false);
        });

        // Keyboard navigation
        this.scope.register([], "ArrowUp", (event) => {
            if (!event.isComposing) {
                this.navigate(-1);
                return false;
            }
        });

        this.scope.register([], "ArrowDown", (event) => {
            if (!event.isComposing) {
                this.navigate(1);
                return false;
            }
        });

        this.scope.register([], "Enter", (event) => {
            if (!event.isComposing) {
                this.handleSelection(this.selectedIndex);
                return false;
            }
        });

        this.scope.register([], "Escape", () => this.close());

        // Focus & Input listeners
        this.inputEl.addEventListener("input", () => this.onQueryChange());
        this.inputEl.addEventListener("focus", () => this.onQueryChange());
        this.inputEl.addEventListener("blur", () => this.close());

        this.suggestionsEl.on("mousedown", ".suggestion-container", (event: MouseEvent) => event.preventDefault());
    }

    private onQueryChange(): void {
        const query = this.inputEl.value.toLowerCase();
        const matches = this.app.vault.getAllLoadedFiles()
            .filter((f): f is TFolder => f instanceof TFolder && f.path.toLowerCase().includes(query))
            .slice(0, 100);

        if (matches.length > 0) {
            this.renderMatches(matches);
            this.open();
        } else {
            this.close();
        }
    }

    private renderMatches(matches: TFolder[]): void {
        const container = this.suggestionsEl.querySelector(".suggestion") as HTMLElement;
        container.empty();
        this.suggestionNodes = [];
        this.values = matches;

        matches.forEach((folder) => {
            const node = container.createDiv("suggestion-item");
            node.setText(folder.path);
            this.suggestionNodes.push(node);
        });

        this.setHighlight(0, false);
    }

    private navigate(direction: number): void {
        let newIndex = this.selectedIndex + direction;
        if (newIndex < 0) newIndex = this.suggestionNodes.length - 1;
        if (newIndex >= this.suggestionNodes.length) newIndex = 0;
        this.setHighlight(newIndex, true);
    }

    private setHighlight(index: number, scroll: boolean): void {
        this.suggestionNodes[this.selectedIndex]?.removeClass("is-selected");
        this.selectedIndex = index;
        const activeNode = this.suggestionNodes[index];
        activeNode?.addClass("is-selected");

        if (scroll) activeNode?.scrollIntoView(false);
    }

    private handleSelection(index: number): void {
        const selected = this.values[index];
        if (selected) {
            this.inputEl.value = selected.path;
            this.inputEl.trigger("input");
            this.close();
        }
    }

    private open(): void {
        this.app.keymap.pushScope(this.scope);
        this.app.workspace.containerEl.appendChild(this.suggestionsEl);

        this.popper = createPopper(this.inputEl, this.suggestionsEl, {
            placement: "bottom-start",
            modifiers: [{
                name: "sameWidth",
                enabled: true,
                fn: ({ state, instance }) => {
                    const width = `${state.rects.reference.width}px`;
                    if (state.styles.popper.width === width) return;
                    state.styles.popper.width = width;
                    instance.update();
                },
                phase: "beforeWrite",
                requires: ["computeStyles"],
            }],
        });
    }

    private close(): void {
        this.app.keymap.popScope(this.scope);
        if (this.popper) this.popper.destroy();
        this.suggestionsEl.detach();
    }
}
