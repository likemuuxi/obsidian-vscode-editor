import { Plugin, TFolder, FileSystemAdapter, MarkdownView, addIcon, TAbstractFile } from "obsidian";
import { DEFAULT_SETTINGS, EditorSettings } from "./common";
import { CodeEditorView } from "./codeEditorView";
import { CreateCodeFileModal } from "./createCodeFileModal";
import { CodeFilesSettingsTab } from "./codeFilesSettingsTab";
import { viewType } from "./common";
import { t } from 'src/lang/helpers';
import { FenceEditModal } from "./fenceEditModal";
import { FenceEditContext } from "./fenceEditContext";
import { mountCodeEditor } from "./mountCodeEditor";
import { exec } from "child_process";

declare module "obsidian" {
	interface Workspace {
		on(
			name: "hover-link",
			callback: (e: MouseEvent) => any,
			ctx?: any,
		): EventRef;
	}
}


export default class CodeFilesPlugin extends Plugin {
	settings: EditorSettings;
	ribbonIcon?: HTMLElement;

	observer: MutationObserver;

	private assertFolder : TFolder;
	private readonly vscodeIconId = "vscode-logo";
	private readonly vscodeIconSvg = `
<svg role="img" viewBox="0 0 24 24"
	xmlns="http://www.w3.org/2000/svg">
	<title>Visual Studio Code</title>
	<path
		fill="currentColor"
		d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"
	/>
</svg>
`;

	public hover: {
		linkText: string;
		sourcePath: string;
		event: MouseEvent;
	} = {
			linkText: "",
			sourcePath: "",
			event: new MouseEvent(""),
		};

	async onload() {
		await this.loadSettings();
		addIcon(this.vscodeIconId, this.vscodeIconSvg);

		this.registerView(viewType, leaf => new CodeEditorView(leaf, this));

		try {
			this.registerExtensions(this.settings.extensions, viewType);
		} catch (e) {
			let exts = this.settings.extensions.join(", ")
			new Notification(t("REGISTE_ERROR"), {
				body: t("REGISTE_ERROR_DESC", e.message)
			});
		}


		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle(t("CREATE_CODE"))
						.setIcon("file-json")
						.onClick(async () => {
							new CreateCodeFileModal(this, this.assertFolder).open();
						});
				});

				if (this.settings.showFileContextMenuItem) {
					menu.addItem((item) => {
						item.setTitle("Open in VS Code")
							.setIcon(this.vscodeIconId)
							.onClick(() => {
								this.openVSCode(file);
							});
					});
				}
			})
		);

		this.addRibbonIcon('file-json', t("CREATE_CODE"), async () => {
			new CreateCodeFileModal(this, this.assertFolder).open();
		});
		this.refreshIconRibbon();

		this.addCommand({
			id: 'create',
			name: 'Create new code file',
			callback: async () => {
				new CreateCodeFileModal(this, this.assertFolder).open();
			}
		});

		this.addCommand({
			id: 'edit-fence',
			name: 'Edit code fence',
			callback: () => {
				FenceEditModal.openOnCurrentCode(this);
			}
		});
		this.addCommand({
			id: 'open-vscode',
			name: 'Open as Visual Studio Code workspace',
			callback: () => this.openVSCode(),
		});
		this.addCommand({
			id: 'open-vscode-url',
			name: 'Open as Visual Studio Code workspace using a vscode:// URL',
			callback: () => this.openVSCodeUrl(),
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', async (leaf) => {
				if (this.settings.defaultLocation == 'current') {
					const activeFile = this.app.workspace.getActiveFile();
					if(activeFile?.parent instanceof TFolder) {
						this.assertFolder = activeFile?.parent;
					}
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu) => {
				if (!FenceEditContext.create(this).isInFence()) {
					return;
				}
				menu.addItem((item) => {
					item.setTitle(t("EDIT_FENCE"))
						.setIcon("code")
						.onClick(() => {
							FenceEditModal.openOnCurrentCode(this);
						});
				});
			})
		);

		//internal links
		this.observer = new MutationObserver(async (mutation) => {
			if (mutation.length !== 1) return;
			if (mutation[0].addedNodes.length !== 1) return;
			if (this.hover.linkText === null) return;
			//@ts-ignore
			if (mutation[0].addedNodes[0].className !== "popover hover-popover") return;
			const file = this.app.metadataCache.getFirstLinkpathDest(this.hover.linkText, this.hover.sourcePath);
			if (!file) return;
			// check file.extension in this.settings.extensions array
			let valid = this.settings.extensions.includes(file.extension);
			if (valid === false) return;
			const fileContent = await this.app.vault.read(file);

			const node: Node = mutation[0].addedNodes[0];
			const contentEl = createDiv();
			new mountCodeEditor(
				contentEl,
				this,
				fileContent,
				file.extension,
				false,
				true
			);

			let w = 700;
			let h = 500;
			let gep = 10;
			if (node instanceof HTMLDivElement) {
				let x = this.hover.event.clientX;
				let y = this.hover.event.clientY;
				let target = this.hover.event.target as HTMLElement;
				let targetRect = target.getBoundingClientRect();
				let targetTop = targetRect.top;
				let targetBottom = targetRect.bottom;
				let targeRight = targetRect.right
				node.style.position = "absolute";
				node.style.left = `${x + gep}px`;

				let spaceBelow = window.innerHeight - y - gep * 3;
				let spaceAbove = y - gep * 3;
				if (spaceBelow > h) {
					node.style.top = `${targetBottom + gep}px`;
				} else if (spaceAbove > h) {
					node.style.top = `${targetTop - h - gep}px`;
				} else {
					node.style.top = `${targetTop - (h / 2) - gep}px`;
					node.style.left = `${targeRight + gep * 2}px`;
				}
			}

			contentEl.setCssProps({
				"width": `${w}px`,
				"height": `${h}px`,
				"padding-top": "10px",
				"padding-bottom": "10px",
			});

			node.empty();
			node.appendChild(contentEl);

		});

		this.registerEvent(this.app.workspace.on("hover-link", async (event: any) => {
			const linkText: string = event.linktext;
			const sourcePath: string = event.sourcePath;
			if (!linkText || !sourcePath) return;
			this.hover.linkText = linkText;
			this.hover.sourcePath = sourcePath;
			this.hover.event = event.event;
		}));

		this.observer.observe(document, { childList: true, subtree: true });

		this.addSettingTab(new CodeFilesSettingsTab(this.app, this));
	}

	onunload() {
		this.observer.disconnect();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		if (this.app.workspace.layoutReady) {
			this.updateAssertFolder();
		} else {
			this.app.workspace.onLayoutReady(() => this.updateAssertFolder());
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateAssertFolder();
	}

	updateAssertFolder() {
		if (!this.app.workspace.layoutReady) {
			return;
		}

		let activeFile: any = null;
		try {
			activeFile = this.app.workspace.getActiveFile();
		} catch (e) {
			// workspace not ready yet; skip until next call
			return;
		}

		let folder: TFolder = this.app.vault.getRoot(); // 默认 fallback 值
	
		switch (this.settings.defaultLocation) {
			case 'root':
				folder = this.app.vault.getRoot();
				break;
	
			case 'default': {
				const folderPath = (this.app.vault as any).getConfig("attachmentFolderPath");
				const defaultFolder = this.app.vault.getAbstractFileByPath(folderPath);
				if (defaultFolder instanceof TFolder) {
					folder = defaultFolder;
				}
				break;
			}
	
			case 'custom': {
				const customPath = this.settings.customPath.replace(/\/$/, '');
				const customFolder = this.app.vault.getAbstractFileByPath(customPath);
				if (customFolder instanceof TFolder) {
					folder = customFolder;
				}
				break;
			}
	
			case 'current':
				if (activeFile?.parent instanceof TFolder) {
					folder = activeFile.parent;
				}
				break;
		}
	
		this.assertFolder = folder;
	}

	refreshIconRibbon(): void {
		this.ribbonIcon?.remove();
		if (this.settings.ribbonIcon) {
			this.ribbonIcon = this.addRibbonIcon(this.vscodeIconId, "VSCode", () => {
				if (this.settings.ribbonCommandUsesCode) this.openVSCode();
				else this.openVSCodeUrl();
			});
		}
	}

	private replaceTokens(template: string, replacements: Record<string, string>): string {
		let result = template;
		for (const token in replacements) {
			if (Object.prototype.hasOwnProperty.call(replacements, token)) {
				result = result.split(token).join(replacements[token]);
			}
		}
		return result;
	}

	openVSCode(file: TAbstractFile | null = this.app.workspace.getActiveFile()): void {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return;
		}
		const { executeTemplate } = this.settings;

		const vaultPath = this.app.vault.adapter.getBasePath();
		const filePath = file?.path ?? "";
		const folderPath = file?.parent?.path ?? "";

		const cursor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor.getCursor();
		// VSCode line and column are 1-based
		const line = (cursor?.line ?? 0) + 1;
		const ch = (cursor?.ch ?? 0) + 1;

		let command = executeTemplate.trim() === "" ? DEFAULT_SETTINGS.executeTemplate : executeTemplate;
		command = this.replaceTokens(command, {
			"{{vaultpath}}": vaultPath,
			"{{filepath}}": filePath,
			"{{folderpath}}": folderPath,
			"{{line}}": line.toString(),
			"{{ch}}": ch.toString(),
		});

		exec(command, error => {
			if (error) {
				console.error(`[${this.manifest.id}] exec error: ${error.message}`);
			}
		});
	}

	openVSCodeUrl(): void {
		if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
			return;
		}

		const path = this.app.vault.adapter.getBasePath();
		const file = this.app.workspace.getActiveFile();
		const filePath = file?.path ?? "";

		let url = `${this.settings.urlProtocol}://file/${path}`;

		if (this.settings.openFile) {
			url += `/${filePath}`;

			// First open the workspace to bring the correct window to the front...
			const workspacePath = this.replaceTokens(this.settings.workspacePath, {
				"{{vaultpath}}": path,
			});
			window.open(`${this.settings.urlProtocol}://file/${workspacePath}`);

			// ...then open the file shortly after.
			setTimeout(() => {
				window.open(url);
			}, 200);
		} else {
			window.open(url);
		}
	}
	
}
