import { Modal, Notice } from "obsidian";
import { mountCodeEditor } from "./mountCodeEditor";
import CodeFilesPlugin from "./main";
import { FenceEditContext } from "./fenceEditContext";

export class FenceEditModal extends Modal {
	private codeEditor: mountCodeEditor;
	private keyHandle = (event: KeyboardEvent) => {
		const ctrlMap = new Map<string, string>([
			['f', 'actions.find'],
			['h', 'editor.action.startFindReplaceAction'],
			['/', 'editor.action.commentLine'],
			['Enter', 'editor.action.insertLineAfter'],
			['[', 'editor.action.outdentLines'],
			[']', 'editor.action.indentLines'],
			['d', 'editor.action.copyLinesDownAction'],
			['c', 'editor.action.clipboardCopyAction'],
			['v', 'editor.action.clipboardPasteAction'],
			['x', 'editor.action.clipboardCutAction'],
		]);
		if (!this.codeEditor) {
			return;
		}
		if (!this.contentEl.contains(event.target as Node)) {
			return;
		}
		if (event.ctrlKey) {
			const key = event.key.toLowerCase();
			if (key === 'v') {
				event.preventDefault();
				event.stopPropagation();
				void this.handlePaste();
				return;
			}
			const triggerName = ctrlMap.get(key);
			if (triggerName) {
				this.codeEditor.monacoEditor.trigger('', triggerName, null);
			}
		}
	};

	private constructor(
		private plugin: CodeFilesPlugin,
		private code: string,
		private language: string,
		private onSave: (changedCode: string) => void
	) {
		super(plugin.app);
	}

	onOpen() {
		super.onOpen();

		this.codeEditor = new mountCodeEditor(
			this.contentEl,
			this.plugin,
			this.code,
			this.language,
		);

		window.addEventListener('keydown', this.keyHandle, true);

		this.modalEl.setCssProps({
			"--dialog-width": "90vw",
			"--dialog-height": "90vh",
		});
		this.modalEl.style.height = "var(--dialog-height)";

		let closeButton = this.modalEl.querySelector<HTMLDivElement>(
			".modal-close-button"
		)
		closeButton!.style.background = "var(--modal-background)";
		closeButton!.style.zIndex = "9999";
	}

	onClose() {
		super.onClose();
		window.removeEventListener('keydown', this.keyHandle, true);
		this.onSave(this.codeEditor.getValue());
	}

	private handlePaste = async () => {
		if (!this.codeEditor) return;
		try {
			const text = await navigator.clipboard.readText();
			if (!text) {
				this.codeEditor.monacoEditor.trigger('', 'editor.action.clipboardPasteAction', null);
				return;
			}
			const selections = this.codeEditor.monacoEditor.getSelections();
			if (selections) {
				const edits = selections.map((selection) => ({
					range: selection,
					text,
					forceMoveMarkers: true,
				}));
				this.codeEditor.monacoEditor.executeEdits('obsidian-vscode-editor', edits);
			}
		} catch (e) {
			this.codeEditor.monacoEditor.trigger('', 'editor.action.clipboardPasteAction', null);
		}
	}

	static openOnCurrentCode(plugin: CodeFilesPlugin) {
		const context = FenceEditContext.create(plugin);

		if (!context.isInFence()) {
			new Notice("Your cursor is currently not in a valid code block.");
			return;
		}

		const fenceData = context.getFenceData();

		if (!fenceData) {
			return;
		}

		new FenceEditModal(
			plugin,
			fenceData.content,
			fenceData.language,
			(value) => context.replaceFenceContent(value)
		).open();
	}
}