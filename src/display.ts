import { fileURLToPath } from 'node:url';
import type { Issue, ProgressItem } from 'cspell';
import { prompt, registerPrompt } from 'inquirer';
import { default as inquirerSuggestionPlugin } from 'inquirer-prompt-suggest';
import {
	bold,
	cyan,
	dim,
	gray,
	green,
	greenBright,
	red,
	underline,
	whiteBright,
	yellow,
	yellowBright,
	magentaBright
} from 'colorette';
import { type Spinner, createSpinner } from 'nanospinner';
import { Action, previousState, type ActionHistoryEntry } from './shared';
import { history } from './history';

registerPrompt('suggest', inquirerSuggestionPlugin);

export const highlightText = (left: string, text: string, right: string) => {
	const blueText = dim(red(text));
	return gray(left.replaceAll(text, blueText)) + red(underline(text)) + gray(right.replaceAll(text, blueText));
};

// Given an issue, this function will use issue.line.text to determine the 40 characters on either side of the issue
// text. It will then return a string with the issue text highlighted in red and the surrounding text in gray.
// This is used to display the "context" of the typo.
export const formatContext = (issue: Issue) => {
	const contextL = Math.max(issue.col - 41, 0);
	const contextR = Math.min(issue.col + issue.text.length + 39, issue.line.text.length);

	const left = issue.line.text.slice(contextL, issue.col - 1);
	const right = issue.line.text.slice(issue.col + issue.text.length - 1, contextR);

	return highlightText(left.trimStart(), issue.text, right.trimEnd());
};

export const centerText = (text: string, length: number, width: number) => {
	if (length < width) {
		const left = Math.floor((width - length) / 2);
		const right = width - length - left;
		return ' '.repeat(left) + text + ' '.repeat(right);
	}

	return text;
};

export const determineAction = async (
	issue: Issue,
	issues: Issue[],
	totalIssueCount: number
): Promise<[Action, string]> => {
	const index = totalIssueCount - issues.length;
	const progressIndicator = `${index}/${totalIssueCount} ── `;
	const text = formatContext(issue);
	const path = fileURLToPath(new URL(issue.uri!));
	const trace = `:${issue.row}:${issue.col}`;

	// Create a header that displays the absolute path to the file and the line and column of the typo. This header
	// is centered in the terminal (the width of the terminal is stored in process.stdout.columns)

	const typoLocation = bold(greenBright(progressIndicator) + whiteBright(path) + cyan(`:${issue.row}:${issue.col}`));

	const width = process.stdout.columns;
	const typoLocationHeader = centerText(typoLocation, path.length + trace.length + progressIndicator.length, width);

	const progress = Math.floor((index / totalIssueCount) * width);

	const line = bold(greenBright('─'.repeat(progress)) + '─'.repeat(width - progress));

	console.log(`${typoLocationHeader}\n${line}\n\n${text}\n`);

	// IgnoreAll and ReplaceAll are only available if the typo is reused.
	const otherTypoInstancesCount = issues.filter((otherIssue) => otherIssue.text === issue.text).length;
	const otherTyposInFileCount = issues.filter((otherIssue) => otherIssue.uri === issue.uri).length;

	// The explicit undefined check is needed because Action.Ignore is 0, which is falsy.
	const shouldDisplayUndoLastAction =
		previousState.action !== undefined && previousState.action !== Action.UndoLastAction;
	const shouldDisplayOpenHistory = previousState.action !== undefined && history.length > 0;

	const { action } = await prompt<{ action: Action }>({
		type: 'list',
		name: 'action',
		message: 'Choose your action:',
		choices: [
			{ name: 'Ignore', value: Action.Ignore },
			{ name: 'Replace', value: Action.Replace },
			{ name: `Ignore All Occurrences (${cyan(otherTypoInstancesCount + 1)})`, value: Action.IgnoreAll },
			{ name: `Replace All Occurrences (${cyan(otherTypoInstancesCount + 1)})`, value: Action.ReplaceAll },
			{ name: `Skip File (${cyan(otherTyposInFileCount + 1)})`, value: Action.SkipFile },
			...(shouldDisplayUndoLastAction
				? [{ name: yellowBright('Undo Last Action'), value: Action.UndoLastAction }]
				: []),
			...(shouldDisplayOpenHistory
				? [{ name: magentaBright('Open Action History'), value: Action.OpenHistory }]
				: []),
			{ name: red('Quit'), value: Action.Quit }
		]
	});

	if (action !== Action.Replace && action !== Action.ReplaceAll) {
		return [action, ''];
	}

	const suggestions = issue.suggestionsEx?.map((suggestion) => suggestion.wordAdjustedToMatchCase ?? suggestion.word);
	const { replacer } = await prompt<{ replacer: string }>([
		{
			// `cspell` might provide suggestions for the typo. If it does, we can use the `suggest` prompt type to
			// allow the user to select one of the suggestions by pressing tab.
			type: suggestions?.length ? 'suggest' : 'input',
			name: 'replacer',
			message: 'What should the typo be replaced with?',
			// Inquirer-prompt-suggest seems to display the first suggestion last
			suggestions: suggestions?.length ? [suggestions.pop(), ...suggestions] : []
		}
	]);

	if (!replacer || replacer === issue.text) {
		return [Action.Ignore, ''];
	}

	return [action, replacer];
};

export const pickIssueFromHistory = async () => {
	const { issue } = await prompt<{ issue?: ActionHistoryEntry }>({
		type: 'list',
		name: 'issue',
		message: 'Choose an action to go back to',
		choices: [
			{ name: red('Quit'), value: undefined },
			...history.map((entry) => {
				const { original, replacer, issue } = entry;
				const { text, row, col, uri: issueUri } = issue;

				const uri = fileURLToPath(new URL(issueUri!));

				const path = `${cyan(uri)}:${cyan(row)}:${cyan(col)}`;

				const actionDisplays: Partial<Record<Action, string>> = {
					[Action.Ignore]: `❕ Ignored ${cyan(text)}`,
					[Action.Replace]: `✏ Replaced ${cyan(original!)} with ${cyan(replacer!)}`,
					[Action.IgnoreAll]: `❕ Ignored all occurrences of ${cyan(text)}`,
					[Action.ReplaceAll]: `✏ Replaced all occurrences of ${cyan(original!)} with ${cyan(replacer!)}`
				};

				const action = actionDisplays[entry.action] ?? 'Unknown action';

				return {
					name: `${action} in ${path}`,
					value: entry
				};
			})
		]
	});

	return issue;
};

// This function is used to clear the current terminal screen. This is used before displaying a new typo for more
// seamless navigation.
export const resetDisplay = () => {
	process.stdout.write('\u001B[2J\u001B[0;0H');
};

export const showStartupMessage = (globs: string[]) => {
	console.log(`\nFinding files matching ${cyan(globs.join(', '))}`);
};

export const showConfigurationFilePath = (path: string) => {
	console.log(`Using configuration from ${cyan(path)}\n`);
};

let spinner: Spinner | undefined;
export const stopSpinner = () => {
	spinner?.stop();
};

export const showProgress = (item: ProgressItem) => {
	if (item.type !== 'ProgressFileBegin') {
		return;
	}

	const text = `Checking ${cyan(item.filename)} (${item.fileNum}/${item.fileCount})`;
	if (spinner) {
		spinner.update({ text });
	} else {
		spinner = createSpinner(text, { color: 'cyan' }).start();
	}
};

export const reportErrors = (errors: number) => {
	console.error(`\nSpell check failed with ${red(errors)} errors!`);
};

export const reportSuccess = (hasQuit: boolean, issues: number, files: number, filesWithIssues: number) => {
	const color = hasQuit ? yellow : green;
	const adverb = hasQuit ? 'Partially' : 'Successfully';

	console.log(
		`\n${adverb} resolved ${color(issues)} issues in ${color(`${filesWithIssues}/${files}`)} matched files!`
	);
};
