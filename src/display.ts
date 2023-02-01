import { stdout } from 'node:process';
import type { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import type { Issue, ProgressItem } from 'cspell';
import inquirer from 'inquirer';
import inquirerSuggestionPlugin from 'inquirer-prompt-suggest';
import ora, { type Ora } from 'ora';
import { Action } from './constants';
import { centerText, clean } from './utils';

inquirer.registerPrompt('suggest', inquirerSuggestionPlugin);

export const highlightText = (left: string, text: string, right: string) => {
	return `${chalk.gray(clean(left).trimStart())}${chalk.red.underline(text)}${chalk.gray(clean(right).trimEnd())}`;
};

export const formatContext = (issue: Issue) => {
	const contextL = Math.max(issue.col - 41, 0);
	const contextR = Math.min(issue.col + issue.text.length + 39, issue.line.text.length);

	const left = clean(issue.line.text.slice(contextL, issue.col - 1));
	const right = clean(issue.line.text.slice(issue.col + issue.text.length - 1, contextR));

	return highlightText(left, issue.text, right);
};

export const determineAction = async (url: URL, issue: Issue, issues: Issue[]): Promise<[Action, string]> => {
	const text = formatContext(issue);
	const path = fileURLToPath(url);
	const trace = `:${issue.row}:${issue.col}`;

	const typoLocation = chalk.bold(`${chalk.whiteBright(fileURLToPath(url))}${chalk.cyan(`:${issue.row}:${issue.col}`)}`);
	const typoLocationHeader = centerText(typoLocation, path.length + trace.length, stdout.columns);
	const line = '─'.repeat(stdout.columns);

	console.log(`${typoLocationHeader}\n${line}\n\n${text}\n`);

	const isReusedWord = issues.some((otherIssue) => otherIssue.text.toLowerCase() === issue.text.toLowerCase());

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
			type: issue.suggestions?.length ? 'suggest' : 'input',
			name: 'replacer',
			message: 'What should the typo be replaced with?',
			suggestions: issue.suggestions
		}
	]);

	return [action, replacer];
};

export const resetDisplay = () => {
	stdout.write('\u001B[2J\u001B[0;0H');
};

let spinner: Ora;
const setSpinnerText = (text: string) => {
	if (spinner) {
		spinner.text = text;
	} else {
		spinner = ora(text).start();
	}
};

export const showProgress = (item: ProgressItem) => {
	if (item.type === 'ProgressFileBegin') {
		setSpinnerText(`Checking ${chalk.cyan(item.filename)} (${item.fileNum}/${item.fileCount})`);
	} else {
		const timeDisplay = `${item.elapsedTimeMs ? Math.trunc(item.elapsedTimeMs!) : '[unknown]'}ms`;
		const errorDisplay = item.numErrors ? ` (${chalk.red(item.numErrors)} typos)` : '';

		spinner.stopAndPersist({
			symbol: item.numErrors ? chalk.red('❌') : chalk.green('✔'),
			text: `Checked ${chalk.cyan(item.filename)} in ${timeDisplay}${errorDisplay}`
		});
	}
};
