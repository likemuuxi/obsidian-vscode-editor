import { App, PluginSettingTab, Setting } from "obsidian";
import CodeFilesPlugin from "./main";
import { DEFAULT_SETTINGS } from "./common";
import { t } from 'src/lang/helpers';


import {
	THEME_COLOR
} from "./constants";

export class CodeFilesSettingsTab extends PluginSettingTab {
	plugin: CodeFilesPlugin;

	constructor(app: App, plugin: CodeFilesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: t('CODE_SETTING') });

		let textComponent: any;
		new Setting(containerEl)
			.setName(t('DEFAULT_LOCATION'))
			.addDropdown(async (dropdown) => {
				dropdown.addOption('root', t('ROOT_FOLDER'));
				dropdown.addOption('current', t('CURRENT_FOLDER'));
				dropdown.addOption('default', t('DEFAULT_PATH'));
				dropdown.addOption('custom', t('CUSTOM_PATH'));
				dropdown.setValue(this.plugin.settings.defaultLocation || 'current');
				dropdown.onChange(async (value) => {
					this.plugin.settings.defaultLocation = value;
					textComponent.inputEl.style.display = value === 'custom' ? 'block' : 'none';
					await this.plugin.saveSettings();
				});
			})
			.addText(text => {
				textComponent = text
					.setPlaceholder('folder/subfolder')
					.setValue(this.plugin.settings.customPath || '')
					.onChange(async (value) => {
						this.plugin.settings.customPath = value;
						await this.plugin.saveSettings();
					});
				textComponent.inputEl.style.display = 
					this.plugin.settings.defaultLocation === 'custom' ? 'block' : 'none';
				return textComponent;
			});

		new Setting(containerEl)
			.setName(t("BASE_COLOR"))
			.setDesc(t('BASE_COLOR_DESC'))
			.addDropdown(async (dropdown) => {
				for (const key in THEME_COLOR) {
					// @ts-ignore
					dropdown.addOption(key, t(key));
				}
				dropdown.setValue(this.plugin.settings.themeColor);
				dropdown.onChange(async (option) => {
					this.plugin.settings.themeColor = option;
					await this.plugin.saveSettings();
				});
			});

		let fontSizeText: HTMLDivElement;
		new Setting(containerEl)
			.setName(t('FONT_SIZE'))
			.setDesc(t('FONT_SIZE_DESC'))
			.addSlider(slider => slider
				.setLimits(5, 30, 1)
				.setValue(this.plugin.settings.fontSize)
				.onChange(async (value) => {
					fontSizeText.innerText = " " + value.toString();
					this.plugin.settings.fontSize = value;
					this.plugin.saveSettings();
				}))
			.settingEl.createDiv('', (el) => {
				fontSizeText = el;
				el.style.minWidth = "2.3em";
				el.style.textAlign = "right";
				el.innerText = " " + this.plugin.settings.fontSize.toString();
			});

		new Setting(containerEl)
			.setName(t('FILE_EXTENSIONS'))
			.setDesc(t('FILE_EXTENSIONS_DESC'))
			.addTextArea(text => text
				.setValue(this.plugin.settings.extensions.join(","))
				.onChange(async (value) => {
					this.plugin.settings.extensions = value.split(",");
					await this.plugin.saveSettings();
				})).setClass("setting_ext");


		new Setting(containerEl)
			.setName(t('WORDWRAP'))
			.setDesc(t('WORDWRAP_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.wordWrap)
				.onChange(async (value) => {
					this.plugin.settings.wordWrap = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t('MINIMAP'))
			.setDesc(t('MINIMAP_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.minimap)
				.onChange(async (value) => {
					this.plugin.settings.minimap = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t('LINE_NUMBERS'))
			.setDesc(t('LINE_NUMBERS_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.lineNumbers)
				.onChange(async (value) => {
					this.plugin.settings.lineNumbers = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName(t('FOLDING'))
			.setDesc(t('FOLDING_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.folding)
				.onChange(async (value) => {
					this.plugin.settings.folding = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', { text: 'Open in VS Code' });

		new Setting(containerEl)
			.setName("Display Ribbon Icon")
			.setDesc("Toggle this OFF if you want to hide the VS Code ribbon icon.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.ribbonIcon)
				.onChange(async (value) => {
					this.plugin.settings.ribbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshIconRibbon();
				}));

		new Setting(containerEl)
			.setName("Ribbon uses 'code' command")
			.setDesc("If OFF, the ribbon icon will use vscode:// URL instead.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.ribbonCommandUsesCode)
				.onChange(async (value) => {
					this.plugin.settings.ribbonCommandUsesCode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show "Open in VS Code" in file menu')
			.setDesc("Show context menu option for files/folders.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showFileContextMenuItem)
				.onChange(async (value) => {
					this.plugin.settings.showFileContextMenuItem = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: "Open via 'code' CLI" });

		new Setting(containerEl)
			.setName("Template for 'code' command")
			.setDesc("Use variables: {{vaultpath}} {{filepath}} {{folderpath}} {{line}} {{ch}}")
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.executeTemplate)
				.setValue(this.plugin.settings.executeTemplate || DEFAULT_SETTINGS.executeTemplate)
				.onChange(async (value) => {
					this.plugin.settings.executeTemplate = value.trim() || DEFAULT_SETTINGS.executeTemplate;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: "Open via vscode:// URL" });

		new Setting(containerEl)
			.setName("Open current file")
			.setDesc("If OFF, only open the vault/workspace.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openFile)
				.onChange(async (value) => {
					this.plugin.settings.openFile = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Workspace path")
			.setDesc("Template for workspace; defaults to {{vaultpath}} or a .code-workspace path.")
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.workspacePath)
				.setValue(this.plugin.settings.workspacePath || DEFAULT_SETTINGS.workspacePath)
				.onChange(async (value) => {
					this.plugin.settings.workspacePath = value.trim() || DEFAULT_SETTINGS.workspacePath;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("URL protocol")
			.setDesc("Override vscode:// (e.g. vscode-insiders, vscodium).")
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.urlProtocol)
				.setValue(this.plugin.settings.urlProtocol || DEFAULT_SETTINGS.urlProtocol)
				.onChange(async (value) => {
					this.plugin.settings.urlProtocol = value.trim() || DEFAULT_SETTINGS.urlProtocol;
					await this.plugin.saveSettings();
				}));
	}
}
