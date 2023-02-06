import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import type { Issue, ProgressItem } from 'cspell';
import inquirer from 'inquirer';
import inquirerSuggestionPlugin from 'inquirer-prompt-suggest';
import ora, { type Ora } from 'ora';
import { Action } from './constants';

inquirer.registerPrompt('suggest', inquirerSuggestionPlugin);

export const highlightText = (left: string, text: string, right: string) => {
	return `${chalk.gray(left.trimStart())}${chalk.red.underline(text)}${chalk.gray(right.trimEnd())}`;
};

// Given an issue, this function will use issue.line.text to determine the 40 characters on either side of the issue
// text. It will then return a string with the issue text highlighted in red and the surrounding text in gray.
// This is used to display the "context" of the typo.
export const formatContext = (issue: Issue) => {
	const contextL = Math.max(issue.col - 41, 0);
	const contextR = Math.min(issue.col + issue.text.length + 39, issue.line.text.length);

	const left = issue.line.text.slice(contextL, issue.col - 1);
	const right = issue.line.text.slice(issue.col + issue.text.length - 1, contextR);

	return highlightText(left, issue.text, right);
};

export const centerText = (text: string, length: number, width: number) => {
	const left = Math.floor((width - length) / 2);
	const right = width - length - left;
	return ' '.repeat(left) + text + ' '.repeat(right);
};

export const determineAction = async (url: URL, issue: Issue, issues: Issue[]): Promise<[Action, string]> => {
	const text = formatContext(issue);
	const path = fileURLToPath(url);
	const trace = `:${issue.row}:${issue.col}`;

	// Create a header that displays the absolute path to the file and the line and column of the typo. This header
	// is centered in the terminal (the width of the terminal is stored in process.stdout.columns)

	const typoLocation = chalk.bold(
		`${chalk.whiteBright(fileURLToPath(url))}${chalk.cyan(`:${issue.row}:${issue.col}`)}`
	);

	const width = process.stdout.columns;
	const typoLocationHeader = centerText(typoLocation, path.length + trace.length, width);
	const line = '─'.repeat(width);

	console.log(`${typoLocationHeader}\n${line}\n\n${text}\n`);

	// IgnoreAll and ReplaceAll are only available if the typo is reused.
	const isReusedWord = issues.some((otherIssue) => otherIssue.text === issue.text);

	const { action } = await inquirer.prompt<{ action: Action }>({
		type: 'list',
		name: 'action',
		message: 'Choose your action:',
		choices: [
			{ name: 'Ignore', value: Action.Ignore },
			{ name: 'Replace', value: Action.Replace },
			...(isReusedWord
				? [
						{ name: 'Ignore (Current and Future)', value: Action.IgnoreAll },
						{ name: 'Replace (Current and Future)', value: Action.ReplaceAll }
				  ]
				: []),
			{ name: 'Skip File', value: Action.SkipFile },
			{ name: chalk.red('Quit'), value: Action.Quit }
		]
	});

	if (action !== Action.Replace && action !== Action.ReplaceAll) {
		return [action, ''];
	}

	const { replacer } = await inquirer.prompt<{ replacer: string }>([
		{
			// `cspell` might provide suggestions for the typo. If it does, we can use the `suggest` prompt type to
			// allow the user to select one of the suggestions by pressing tab.
			type: issue.suggestions?.length ? 'suggest' : 'input',
			name: 'replacer',
			message: 'What should the typo be replaced with?',
			// Inquirer-prompt-suggest seems to display the first suggestion last
			suggestions: issue.suggestions?.length ? [issue.suggestions.pop(), ...issue.suggestions] : []
		}
	]);

	return [action, replacer];
};

// This function is used to clear the current terminal screen. This is used before displaying a new typo for more
// seemless navigation.
export const resetDisplay = () => {
	process.stdout.write('\u001B[2J\u001B[0;0H');
};

let spinner: Ora;
const setSpinnerText = (text: string) => {
	if (spinner) {
		spinner.text = text;
	} else {
		spinner = ora(text).start();
	}
};

export const showStartupMessage = (globs: string[]) => {
	setSpinnerText(`Finding files matching ${chalk.cyan(globs.join(', '))}`);
};

export const stopSpinner = () => {
	spinner.stop();
};

export const showProgress = (item: ProgressItem) => {
	if (item.type === 'ProgressFileBegin') {
		setSpinnerText(`Checking ${chalk.cyan(item.filename)} (${item.fileNum}/${item.fileCount})`);
	} else {
		const timeDisplay = `${item.elapsedTimeMs ? Math.trunc(item.elapsedTimeMs) : '[unknown]'}ms`;
		const errorDisplay = item.numErrors ? ` (${chalk.red(item.numErrors)} typos)` : '';

		spinner.stopAndPersist({
			symbol: item.numErrors ? chalk.red('❌') : chalk.green('✔'),
			text: `Checked ${chalk.cyan(item.filename)} in ${timeDisplay}${errorDisplay}`
		});
	}
};
