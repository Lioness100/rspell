/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable unicorn/no-useless-spread */
import { readFile, writeFile } from 'node:fs/promises';
import type { Issue } from 'cspell';
import { determineAction, determineHistoryIssue, resetDisplay } from './display';
import { Action, previousState } from './shared';
import { addIgnoreWordToSettings, writeToSettings } from './config';
import { addNewHistoryIssue, removeIssueFromHistory } from './history';

let totalIssueCount = 0;

export const updateFileText = (issue: Issue, replacer: string, file: string) => {
	// `issue.offset` is the index of the first character of the issue. With this, we slice everything in the file
	// before the text, then add the replacer, then add everything after the text.
	return file.slice(0, issue.offset) + replacer + file.slice(issue.offset + issue.text.length);
};

export const replaceSingleChange = async (issue: Issue, issues: Issue[], replacer: string) => {
	previousState.resolvedIssues.push(issue);
	updateFutureIssues(issue, replacer, issues);

	const url = new URL(issue.uri!);
	const file = await readFile(url, 'utf8');
	await writeFile(url, updateFileText(issue, replacer, file));
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

export const performSideEffects = async (issues: Issue[], issue: Issue, action: Action, replacer: string) => {
	const filesToWrite = new Map<string, { file: string; url: URL }>();
	const updatedIssues = [];

	for (const [idx, futureIssue] of issues.entries()) {
		if (
			!futureIssue.uri ||
			// If we're skipping the file, we only want to remove issues that share the same URI. Otherwise (action
			// is ReplaceAll or IgnoreAll), we want to remove issues that share the same text.
			action === Action.SkipFile
				? futureIssue.uri !== issue.uri
				: futureIssue.text !== issue.text
		) {
			updatedIssues.push(futureIssue);
			continue;
		}

		if (action === Action.ReplaceAll) {
			const url = new URL(futureIssue.uri!);
			const file = filesToWrite.get(futureIssue.uri!)?.file ?? (await readFile(url, 'utf8'));
			filesToWrite.set(futureIssue.uri!, { file: updateFileText(futureIssue, replacer, file), url });

			previousState.resolvedIssues.push(futureIssue);
			updateFutureIssues(futureIssue, replacer, issues.slice(idx + 1));
		}
	}

	// `issues.splice(0, issues.length, ...)` is used to replace the entire array in place. This is faster than calling
	// issues.splice individually, especially when there are many issues.
	issues.splice(0, issues.length, ...updatedIssues);

	// Only write to a file once, instead of once per issue.
	await Promise.allSettled([...filesToWrite.values()].map(({ url, file }) => writeFile(url, file)));
};

export const restoreState = async (issues: Issue[]) => {
	const { config, resolvedIssues, issue: previousIssue, issues: previousIssues, replacer } = previousState;

	if (config) {
		await writeToSettings(config).catch(() => null);
	}

	if (replacer) {
		// Abridged version of performSideEffects, but without updating future issues, because we're restoring the state
		// right after this.
		const filesToWrite = new Map<string, { file: string; url: URL }>();
		for (const resolvedIssue of resolvedIssues.reverse()) {
			const url = new URL(resolvedIssue.uri!);
			const file = filesToWrite.get(resolvedIssue.uri!)?.file ?? (await readFile(url, 'utf8'));

			// The issue text is now the replacer and it should be replaced with the original text to effectively revert
			// the change.
			const newFile = updateFileText({ ...resolvedIssue, text: replacer }, resolvedIssue.text, file);

			filesToWrite.set(resolvedIssue.uri!, { file: newFile, url });
		}

		await Promise.allSettled([...filesToWrite.values()].map(({ url, file }) => writeFile(url, file)));
	}

	// Edit the entire issues array in place, so that the reference is the same.
	issues.splice(0, issues.length, ...previousIssues);
	return previousIssue;
};

export const handleIssue = async (issues: Issue[], issue: Issue) => {
	if (!issue.uri) {
		return;
	}

	const [action, replacer] = await determineAction(issue, issues, totalIssueCount);

	previousState.action = action;

	if (action === Action.UndoLastAction) {
		const lastIssue = await restoreState(issues);

		// Handle the last issue again, and then come back to the current one.
		resetDisplay();

		const hasQuit = await handleIssue(issues, lastIssue);
		if (hasQuit) {
			return true;
		}

		return handleIssues(issues);
	}

	if (action === Action.OpenHistory) {
		resetDisplay();

		// DeterminedAction can be either an issue or an Action.Quit.
		const determinedAction = await determineHistoryIssue();

		if (determinedAction === Action.Quit) {
			return true;
		}

		const { issue } = determinedAction;

		const hasQuit = await handleIssue(issues, issue);

		if (hasQuit) {
			return true;
		}

		removeIssueFromHistory(determinedAction);

		return handleIssues(issues);
	}

	// Set the initial state
	Object.assign(previousState, {
		replacer,
		issue: { ...issue, line: { ...issue.line } },
		issues: issues.map((issue) => ({ ...issue, line: { ...issue.line } })),
		resolvedIssues: [],
		config: undefined
	} as Omit<typeof previousState, 'action'>);

	if (action === Action.Replace) {
		await replaceSingleChange(issue, issues, replacer).catch(() => null);
	} else if (action === Action.ReplaceAll || action === Action.IgnoreAll || action === Action.SkipFile) {
		// The above actions all have side effects (as in, they require modification of future issues).

		// Add the current issue back to the list of issues so it can be used in the performSideEffects loop to prevent
		// duplicated code. It will be removed from the list in the loop.
		if (action === Action.ReplaceAll) {
			issues.unshift(issue);
		}

		await performSideEffects(issues, issue, action, replacer);

		if (action === Action.IgnoreAll) {
			await addIgnoreWordToSettings(issue.text).catch(() => null);
		}
	}

	addNewHistoryIssue({ action, issue, replacer });

	resetDisplay();

	return action === Action.Quit;
};

export const handleIssues = async (issues: Issue[]) => {
	totalIssueCount ||= issues.length;

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
