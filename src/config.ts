import { extname } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import type { CSpellSettings } from 'cspell';
import { searchForConfig } from 'cspell-lib';
// eslint-disable-next-line import/no-relative-packages
import { previousState } from './shared';

let configPath: string | undefined;

export const writeToSettings = async (settings: CSpellSettings | { cspell: CSpellSettings }) => {
	await writeFile(configPath!, JSON.stringify(settings, null, 4));
};

export const findConfig = async (config?: string) => {
	// Try to locate a config file in the current working directory, or with the `config` option if it was provided.
	const configSource = config ?? (await searchForConfig(process.cwd()))?.__importRef?.filename;

	// LocalConfigPath is a path to a config file in the user's configuration directory (platform dependent).
	const localConfigPath = (await import('application-config-path')).default('cspell.json');

	// If no config file was found, use/create a config file in the user's configuration directory (platform dependent).
	const path = configSource ?? localConfigPath;

	// Only JSON files are supported to prevent more dependencies for yml parsing. If the config file is not a JSON
	// file, it can still be used, but it won't be updated with new ignored words.
	if (extname(path) === '.json') {
		configPath = path;
	}

	// If the path is the local config path and it doesn't exist, create it.
	if (path === localConfigPath && !existsSync(localConfigPath)) {
		await writeToSettings({});
	}

	return path;
};

export const getSettings = async (): Promise<CSpellSettings | { cspell: CSpellSettings } | undefined> => {
	if (!configPath) {
		return;
	}

	// The config file is not cached because it may be changed by the user.
	try {
		return JSON.parse(await readFile(configPath, 'utf8').catch(() => '{}'));
	} catch {
		// If the config file is invalid, it should be ignored.
		configPath = undefined;
	}
};

export const addIgnoreWordToSettings = async (word: string) => {
	const settings = await getSettings();
	if (!settings) {
		return;
	}

	previousState.config = settings;

	// If the config is in a package.json, it will be in the `cspell` key.
	const cspell = 'cspell' in settings ? settings.cspell : settings;
	cspell.ignoreWords = Array.isArray(cspell.ignoreWords) ? [...new Set([...cspell.ignoreWords, word])] : [word];

	await writeToSettings(settings);
};
