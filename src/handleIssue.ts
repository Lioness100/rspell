/* eslint-disable unicorn/no-useless-spread */
/* eslint-disable unicorn/consistent-destructuring */
import { readFile, writeFile } from 'node:fs/promises';
import type { Issue } from 'cspell';
import { determineAction, resetDisplay } from './display';
import { Action } from './constants';

export const writeChangeToFile = async (url: URL, issue: Issue, replacer: string) => {
	const file = await readFile(url, 'utf8');
	const newFile = file.slice(0, issue.offset) + replacer + file.slice(issue.offset + issue.text.length);

	await writeFile(url, newFile);
};

export const updateFutureIssues = (issue: Issue, replacer: string, issues: Issue[]) => {
	const lengthDifference = replacer.length - issue.text.length;
	issue.line.text =
		issue.line.text.slice(0, issue.col - 1) + replacer + issue.line.text.slice(issue.col + issue.text.length - 1);

	for (const futureIssue of issues) {
		if (futureIssue.uri !== issue.uri || futureIssue.offset < issue.offset) {
			continue;
		}

		futureIssue.offset += lengthDifference;

		if (futureIssue.row !== issue.row) {
			continue;
		}

		futureIssue.line.text = issue.line.text;

		if (futureIssue.col < issue.col) {
			continue;
		}

		futureIssue.col += lengthDifference;
	}
};

export const handleIssue = async (issues: Issue[], issue: Issue) => {
	if (!issue.uri) {
		return;
	}

	const url = new URL(issue.uri);
	const [action, replacer] = await determineAction(url, issue, issues);

	if (action === Action.Replace || action === Action.ReplaceAll) {
		updateFutureIssues(issue, replacer, issues);
		await writeChangeToFile(url, issue, replacer);
	}

	if (action === Action.ReplaceAll || action === Action.IgnoreAll || action === Action.SkipFile) {
		for (const futureIssue of [...issues]) {
			if (action === Action.SkipFile && futureIssue.uri !== issue.uri) {
				continue;
			}

			if (futureIssue.text.toLowerCase() !== issue.text.toLowerCase()) {
				continue;
			}

			issues.splice(issues.indexOf(futureIssue), 1);

			if (action !== Action.ReplaceAll) {
				continue;
			}

			updateFutureIssues(futureIssue, replacer, issues);
			await writeChangeToFile(url, futureIssue, replacer);
		}
	}

	resetDisplay();
	return action === Action.Quit;
};

export const handleIssues = async (issues: Issue[]) => {
	for (const issue of [...issues]) {
		if (!issues.includes(issue)) {
			continue;
		}

		issues.splice(issues.indexOf(issue), 1);

		const hasQuit = await handleIssue(issues, issue);
		if (hasQuit) {
			return true;
		}
	}
};
