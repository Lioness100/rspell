import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const getPackageData = async (): Promise<{
	description: string;
	name: string;
	version: string;
}> => {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	const packageJsonPath = path.resolve(__dirname, '../', 'package.json');
	return JSON.parse(await readFile(packageJsonPath, 'utf8'));
};

export const emptyReporter = () => {
	// Do nothing.
};

export const clean = (text: string) => text.replace(/\s+/g, ' ');

export const centerText = (text: string, length: number, width: number) => {
	const left = Math.floor((width - length) / 2);
	const right = width - length - left;
	return ' '.repeat(left) + text + ' '.repeat(right);
};
