import { extname } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import type { CSpellUserSettings } from 'cspell';
// eslint-disable-next-line import/no-relative-packages
import { readConfig } from '../node_modules/cspell/dist/util/fileHelper';

let cachedConfig: { path: string; settings: CSpellUserSettings | { cspell: CSpellUserSettings } } | undefined;

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
	if (extname(path) !== '.json') {
		return path;
	}

	// Don't use the object provided by `readConfig`, because it normalizes the config file, which we don't want.
	const settings = await readFile(path, 'utf8').catch(async () => {
		await writeFile(path, '{}');
		return '{}';
	});

	cachedConfig = { path, settings: JSON.parse(settings) };
	return cachedConfig.path;
};

export const addIgnoreWordToSettings = async (text: string) => {
	if (cachedConfig) {
		// Reload the config file, in case it was changed.
		// eslint-disable-next-line require-atomic-updates
		cachedConfig.settings = JSON.parse(await readFile(cachedConfig.path, 'utf8'));

		// If the config is in a package.json:
		if ('cspell' in cachedConfig.settings) {
			(cachedConfig.settings.cspell.ignoreWords ??= []).push(text);
		} else {
			(cachedConfig.settings.ignoreWords ??= []).push(text);
		}

		await writeFile(cachedConfig.path, JSON.stringify(cachedConfig.settings, null, 4));
	}
};
