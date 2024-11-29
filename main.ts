import { Plugin, ItemView, WorkspaceLeaf } from "obsidian";

// Compass View Class
class CompassView extends ItemView {
    static VIEW_TYPE = "compass-view";

    private plugin: CompassPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: CompassPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return CompassView.VIEW_TYPE;
    }

    getDisplayText(): string {
        return "Compass";
    }

    async onOpen(): Promise<void> {
        // Render the view initially
        this.render();

        // Re-render whenever the active file changes
        this.registerEvent(
            this.app.workspace.on("file-open", () => this.render())
        );
    }

    async onClose(): Promise<void> {
        console.log("Compass View closed.");
    }

    async render() {
		const container = this.containerEl.children[1];
		container.empty();
	
		console.log("Rendering Compass View...");
	
		// Get the active file
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			console.warn("No active file found!");
			container.createEl("p", { text: "No active note selected." });
			return;
		}
	
		const content = await this.app.vault.cachedRead(activeFile);
	
		if (!content || content.trim().length === 0) {
			container.createEl("p", { text: "The selected note has no content." });
			return;
		}
	
		console.log("Raw Content of Note:", content);
	
		// Define directions and store unique links
		const directions = ["north", "south", "east", "west"];
		const results: Record<string, Set<string>> = {
			north: new Set(),
			south: new Set(),
			east: new Set(),
			west: new Set(),
		};
	
		// Extract links for each direction
		directions.forEach((dir) => {
			const regex = new RegExp(
				`\`\`\`ad-${dir}\\n([\\s\\S]*?)\`\`\``, // Updated regex
				"gm"
			);
	
			const matches = content.matchAll(regex);
			const links = Array.from(matches, (match) => {
				// Extract [[...]] links only
				const linkRegex = /\[\[(.*?)\]\]/g;
				const sectionLinks = Array.from(match[1].matchAll(linkRegex), (m) => m[1]);
				return sectionLinks;
			}).flat();
	
			console.log(`Direction: ${dir}`, { links, rawMatches: Array.from(matches) });
	
			results[dir] = new Set(links); // Store unique links
		});
	
		// Render the extracted links
		directions.forEach((dir) => {
			const section = container.createEl("div", { cls: "compass-section" });
			section.createEl("h3", { text: dir.toUpperCase() });
	
			const links = Array.from(results[dir]);
			if (links.length === 0) {
				section.createEl("p", { text: "No links found." });
			} else {
				links.forEach((link) => {
					const linkEl = section.createEl("p");
					linkEl.createEl("a", {
						text: link,
						href: `obsidian://open?vault=${this.app.vault.getName()}&file=${encodeURIComponent(
							link
						)}`,
					});
				});
			}
		});
	
		console.log("Compass View rendered successfully.");
	}
}

// Compass Plugin Class
export default class CompassPlugin extends Plugin {
    async onload() {
        console.log("Loading CompassPlugin...");

        // Wait for the workspace to be ready
        this.app.workspace.onLayoutReady(() => {
            // Register the Compass View
            this.registerView(
                CompassView.VIEW_TYPE,
                (leaf) => new CompassView(leaf, this)
            );

            // Add a command to open the Compass View
            this.addCommand({
                id: "open-compass-view",
                name: "Open Compass View",
                callback: () => this.activateCompassView(),
            });

            // Automatically open the Compass View on plugin load
            this.activateCompassView();
        });
    }

    onunload() {
        console.log("Unloading CompassPlugin...");
        this.app.workspace.detachLeavesOfType(CompassView.VIEW_TYPE);
    }

    async activateCompassView() {
        // Check if the view is already open
        const existingLeaf = this.app.workspace.getLeavesOfType(
            CompassView.VIEW_TYPE
        );
        if (existingLeaf.length > 0) {
            this.app.workspace.revealLeaf(existingLeaf[0]);
            return;
        }

        // Get a right sidebar leaf or create a new one if it doesn't exist
        const leaf = this.app.workspace.getRightLeaf(false);
        if (!leaf) {
            console.error("No right leaf available to attach the Compass View.");
            return;
        }

        // Attach the Compass View to the right leaf
        await leaf.setViewState({
            type: CompassView.VIEW_TYPE,
        });
        console.log("Compass View activated.");
    }
}