import { extname } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import type { CSpellSettings } from 'cspell';
// eslint-disable-next-line import/no-relative-packages
import { readConfig } from '../node_modules/cspell/dist/util/fileHelper';
import { previousState } from './shared';

let configPath: string | undefined;

export const findConfig = async (config?: string) => {
	// Try to locate a config file in the current working directory, or with the `config` option if it was provided.
	const configInfo = await readConfig(config, process.cwd());

	// If no config file was found, use/create a config file in the user's configuration directory (platform dependent).
	const path =
		configInfo.source === 'None found'
			? (await import('application-config-path')).default('cspell.json')
			: configInfo.source;

	// Only JSON files are supported to prevent more dependencies for yml parsing. If the config file is not a JSON
	// file, it can still be used, but it won't be updated with new ignored words.
	if (extname(path) === '.json') {
		configPath = path;
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

export const writeToSettings = async (settings: CSpellSettings | { cspell: CSpellSettings }) => {
	await writeFile(configPath!, JSON.stringify(settings, null, 4));
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
