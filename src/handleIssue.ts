/* eslint-disable unicorn/no-useless-spread */
import { readFile, writeFile } from 'node:fs/promises';
import type { Issue } from 'cspell';
import { determineAction, resetDisplay } from './display';
import { Action } from './constants';

export const writeChangeToFile = async (url: URL, issue: Issue, replacer: string) => {
	const file = await readFile(url, 'utf8');

	// `issue.offset` is the index of the first character of the issue. With this, we slice everything in the file
	// before the text, then add the replacer, then add everything after the text.
	const newFile = file.slice(0, issue.offset) + replacer + file.slice(issue.offset + issue.text.length);

	await writeFile(url, newFile);
};

// When we replace a word, we need to update the offset of all future typos in that file, because they would be
// using outdated information.
export const updateFutureIssues = (issue: Issue, replacer: string, issues: Issue[]) => {
	const lengthDifference = replacer.length - issue.text.length;
	let cachedLineText: string | undefined;

	for (const futureIssue of issues) {
		// Only update issues that are in the same file, and are after the issue we just fixed.
		if (futureIssue.uri !== issue.uri) {
			continue;
		}

		// A row comparison is made before checking that the offset is greater than the issue's offset. This is because,
		// if an typo is fixed via ReplaceAll, then the context of any issues on the same row should be updated,
		// regardless of if the issue is before or after the fixed typo.
		if (futureIssue.row === issue.row) {
			// Only calculate the new line text once, then cache it. This is a negligible performance improvement, but it's
			// honest work.
			cachedLineText ??=
				issue.line.text.slice(0, issue.col - 1) +
				replacer +
				issue.line.text.slice(issue.col + issue.text.length - 1);

			// This is used to display the context of the issue, so it needs to be updated.
			futureIssue.line.text = cachedLineText;
		}

		if (futureIssue.offset < issue.offset) {
			continue;
		}

		// Update the offset of the issue, because we just replaced some text. For example, if we replaced "helllo" with
		// "hello", then the offset of all future issues in the file would be off by 1.
		futureIssue.offset += lengthDifference;

		// Next, there are row specific issues.
		if (futureIssue.row !== issue.row) {
			continue;
		}

		// If the issue is before the column we just replaced, then we don't need to update the column.
		if (futureIssue.col < issue.col) {
			continue;
		}

		futureIssue.col += lengthDifference;
	}
};

export const fixIssue = async (issues: Issue[], issue: Issue, replacer: string, url: URL) => {
	updateFutureIssues(issue, replacer, issues);
	await writeChangeToFile(url, issue, replacer);
};

export const performSideEffects = async (issues: Issue[], issue: Issue, action: Action, replacer: string, url: URL) => {
	// The issues array is modified in place, so we need to make a copy of it.
	for (const futureIssue of [...issues]) {
		if (
			!futureIssue.uri ||
			// If we're skipping the file, we only want to remove issues that share the same URI. Otherwise (action
			// is ReplaceAll or IgnoreAll), we want to remove issues that share the same text.
			action === Action.SkipFile
				? futureIssue.uri !== issue.uri
				: futureIssue.text !== issue.text
		) {
			continue;
		}

		issues.splice(issues.indexOf(futureIssue), 1);

		// If we're ignoring the issue, we don't need to do any more work.
		if (action !== Action.ReplaceAll) {
			continue;
		}

		// Otherwise, we update the offsets of future issues and write the change to file, just as we would if it
		// was a normal Replace action.
		// TODO: If multiple of these issues are in the same file, we should store the file contents in memory and
		// only write it once at the end.
		await fixIssue(issues, futureIssue, replacer, futureIssue.uri === issue.uri ? url : new URL(futureIssue.uri!));
	}
};

export const handleIssue = async (issues: Issue[], issue: Issue) => {
	if (!issue.uri) {
		return;
	}

	const url = new URL(issue.uri);
	const [action, replacer] = await determineAction(url, issue, issues);

	if (action === Action.Replace || action === Action.ReplaceAll) {
		await fixIssue(issues, issue, replacer, url);
	}

	// The following actions all have side effects (as in, they require modification of future issues).
	if (action === Action.ReplaceAll || action === Action.IgnoreAll || action === Action.SkipFile) {
		await performSideEffects(issues, issue, action, replacer, url);
	}

	resetDisplay();
	return action === Action.Quit;
};

export const handleIssues = async (issues: Issue[]) => {
	// The issues array is modified in place, so we need to make a copy of it.
	for (const issue of [...issues]) {
		if (!issues.includes(issue)) {
			continue;
		}

		issues.splice(issues.indexOf(issue), 1);

		const hasQuit = await handleIssue(issues, issue);

		// If the user has quit, exit early.
		if (hasQuit) {
			return true;
		}
	}

	return false;
};
