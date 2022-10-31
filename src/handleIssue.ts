import { readFile, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import type { Issue } from 'cspell';
import { determineAction, resetDisplay } from './display';

export const writeChangeToFile = async (url: URL, issue: Issue, replacer: string) => {
	const file = await readFile(url, 'utf8');
	const newFile = file.slice(0, issue.offset) + replacer + file.slice(issue.offset + issue.text.length);
	await writeFile(url, newFile);
};

export const enum Action {
	Ignore,
	IgnoreAll,
	Replace,
	ReplaceAll,
	SkipFile,
	Quit
}

const filesToSkip = new Set<string>();
const wordsToIgnore = new Set<string>();
const wordsToReplace = new Map<string, string>();

export const handleIssue = async (issue: Issue, hasQuit: boolean) => {
	if (!issue.uri || filesToSkip.has(issue.uri) || wordsToIgnore.has(issue.text)) {
		return;
	}

	const url = new URL(issue.uri);
	const [action, replacer] = wordsToReplace.has(issue.text)
		? [Action.Replace, wordsToReplace.get(issue.text)!]
		: hasQuit
		? [Action.Ignore, '']
		: await determineAction(url, issue);

	switch (action) {
		case Action.Quit: {
			return true;
		}

		case Action.SkipFile: {
			filesToSkip.add(issue.uri);
			break;
		}

		case Action.Ignore: {
			break;
		}

		case Action.IgnoreAll: {
			wordsToIgnore.add(issue.text);
			break;
		}

		// @ts-expect-error fallthrough case is intentional
		case Action.ReplaceAll: {
			wordsToReplace.set(issue.text, replacer);
			// falls through
		}

		case Action.Replace: {
			await writeChangeToFile(url, issue, replacer);
			break;
		}
	}

	resetDisplay();
};
