
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
}


export const viewType = "vscode-editor";
