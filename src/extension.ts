// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "node-modules-cleaner" is now active!');

	let cleanNodeModulesDisposable = vscode.commands.registerCommand('node-modules-cleaner.clean_node_modules', async () => {
		//TODO:
		const workSpaceFolders = vscode.workspace.workspaceFolders;
		if (!workSpaceFolders) {
			return;
		}
		// key: full path of files
		const filesMap: Map<string,fs.Stats> = new Map();

		function addFileToMap(fsPath:string) {
			try {
				const files = fs.readdirSync(fsPath);
				for (let index = 0; index < files.length; index++) {
					const filePath = files[index];
					const fullPath = path.join(fsPath, filePath);
					const stat = fs.statSync(fullPath);
					if (stat.isFile()) {
						filesMap.set(fullPath, stat);
					} else if(stat.isDirectory()) {
						addFileToMap(fullPath);
					}
				}
			} catch (error) {
				console.error(error);
			}
		}
		let fileCount = 0;
		let cleanedSize = 0;
		const uselessFileEndList = ['.md', 'license', '.nycrc', '.eslintrc', '.eslintignore', '.editorconfig', '.npmignore'];

		{for (let index = 0; index < workSpaceFolders.length; index++) {
			const folder = workSpaceFolders[index];
			const nodeModulesFolder = path.join(folder.uri.fsPath, 'node_modules');
			console.log(nodeModulesFolder, 'nodeModulesFolder', fs.existsSync(nodeModulesFolder));
			if (!fs.existsSync(nodeModulesFolder)) {
				console.warn('node_modueles is not exist in workspace!');
				continue;
			}
			addFileToMap(nodeModulesFolder);
		}}

		function isUseless (fileName: string) {
			return uselessFileEndList.findIndex(item => fileName.endsWith(item)) !== -1;
		}

		for (const [fullPath,stats] of filesMap) {
			const lowercaseFullPath = fullPath.toLowerCase();
			if (isUseless(lowercaseFullPath)) {
				try {
					fs.unlinkSync(fullPath);
					fileCount++;
					cleanedSize += stats.size;
					console.log(`${fullPath} has been deleted, saved size ${stats.size}`);
				} catch (error) {
					console.error(error);
				}
			}
		}

		const cleanedSizeM = (cleanedSize / 1024 / 1024).toFixed(2);
		const msg = `cleand ${fileCount} files, saved ${cleanedSizeM}mb`;
		console.log(msg);
		vscode.window.showInformationMessage(msg);
	});



	context.subscriptions.push(cleanNodeModulesDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
