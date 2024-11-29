import { Plugin, WorkspaceLeaf, ItemView } from "obsidian";

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
        this.render();
    }

    async onClose(): Promise<void> {
        console.log("Compass View closed.");
    }

    async render() {
        const container = this.containerEl.children[1];
        container.empty();

        // Get the current note
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            container.createEl("p", { text: "No active note selected." });
            return;
        }

        const content = await this.app.vault.cachedRead(activeFile);
        const directions = ["north", "south", "east", "west"];
        const results: { direction: string; links: string[] }[] = [];

        directions.forEach((dir) => {
            const regex = new RegExp(
                `\`\`\`ad-${dir}[\\s\\S]*?\\[\\[(.*?)\\]\\][\\s\\S]*?\`\`\``,
                "gm"
            );
            const matches = content.matchAll(regex);
            const links = Array.from(matches, (match) => match[1]);
            results.push({ direction: dir, links });
        });

        // Render the links in the side panel
        results.forEach((result) => {
            const section = container.createEl("div", { cls: "compass-section" });
            section.createEl("h3", { text: result.direction.toUpperCase() });

            if (result.links.length === 0) {
                section.createEl("p", { text: "No links found." });
            } else {
                result.links.forEach((link) => {
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
    }
}

// Plugin Class
export default class CompassPlugin extends Plugin {
    async onload() {
        console.log("Loading CompassPlugin...");

        // Register the compass view
        this.registerView(
            CompassView.VIEW_TYPE,
            (leaf) => new CompassView(leaf, this)
        );

        // Add a command to open the compass view
        this.addCommand({
            id: "open-compass-view",
            name: "Open Compass View",
            callback: () => this.activateCompassView(),
        });

        // Automatically open the compass view when the plugin loads
        this.activateCompassView();
    }

    onunload() {
        console.log("Unloading CompassPlugin...");
        this.app.workspace.detachLeavesOfType(CompassView.VIEW_TYPE);
    }

	async activateCompassView() {
		// Check if the view is already open
		const existingLeaf = this.app.workspace.getLeavesOfType(CompassView.VIEW_TYPE);
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