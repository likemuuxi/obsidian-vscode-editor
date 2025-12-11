
export interface EditorSettings {
	defaultLocation: string,
	customPath: string,
	extensions: string[];
	folding: boolean;
	lineNumbers: boolean;
	wordWrap: boolean;
	minimap: boolean;
	semanticValidation: boolean;
	syntaxValidation: boolean;
	themeColor: string;
	fontSize: number;
	// VS Code integration
	ribbonIcon: boolean;
	ribbonCommandUsesCode: boolean;
	showFileContextMenuItem: boolean;
	executeTemplate: string;
	openFile: boolean;
	urlProtocol: string;
	workspacePath: string;
}

export const DEFAULT_SETTINGS: EditorSettings = {
	defaultLocation: 'current',
	customPath: '',
	extensions: ["ts", "js", "py", "css", "c", "cpp", "go", "rs", "java", "lua", "php"],
	folding: true,
	lineNumbers: true,
	wordWrap: true,
	minimap: true,
	semanticValidation: true,
	syntaxValidation: true,
	themeColor: "AUTO",
	fontSize: 16,
	ribbonIcon: true,
	ribbonCommandUsesCode: true,
	showFileContextMenuItem: true,
	executeTemplate: 'code "{{vaultpath}}" "{{vaultpath}}/{{filepath}}"',
	openFile: true,
	urlProtocol: "vscode",
	workspacePath: "{{vaultpath}}",
}


export const viewType = "vscode-editor";
