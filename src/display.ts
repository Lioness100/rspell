import { stdout } from 'node:process';
import type { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import type { Issue, ProgressItem, TextOffset } from 'cspell';
import inquirer from 'inquirer';
import inquirerSuggestionPlugin from 'inquirer-prompt-suggest';
import ora, { type Ora } from 'ora';
import { Action } from './handleIssue';
import { centerText, clean } from './utils';

inquirer.registerPrompt('suggest', inquirerSuggestionPlugin);

const SLICE_LENGTH = 50;

export const formatContext = (context: TextOffset, text: string, offset: number) => {
	let contextLeft = context.text.slice(0, offset - context.offset);
	let contextRight = context.text.slice(offset + text.length - context.offset);

	if (contextLeft.length > SLICE_LENGTH) {
		contextLeft = `...${clean(contextLeft.slice(-SLICE_LENGTH))}`;
	}

	if (contextRight.length > SLICE_LENGTH) {
		contextRight = `${clean(contextRight.slice(0, SLICE_LENGTH))}...`;
	}

	return `${chalk.gray(clean(contextLeft).trimStart())}${chalk.red.underline(text)}${chalk.gray(clean(contextRight))}`;
};

export const determineAction = async (url: URL, issue: Issue): Promise<[Action, string]> => {
	const text = formatContext(issue.context, issue.text, issue.offset);
	const typoLocation = chalk.bold(`${chalk.whiteBright(fileURLToPath(url))}${chalk.cyan(`:${issue.row}:${issue.col}`)}`);
	const typoLocationHeader = centerText(typoLocation, stdout.columns);
	const line = '─'.repeat(stdout.columns);

	console.log(`${typoLocationHeader}\n${line}\n\n${text}\n`);

	const { action } = await inquirer.prompt<{ action: Action }>({
		type: 'list',
		name: 'action',
		message: 'Choose your action:',
		choices: [
			{ name: 'Ignore', value: Action.Ignore },
			{ name: 'Ignore All', value: Action.IgnoreAll },
			{ name: 'Replace', value: Action.Replace },
			{ name: 'Replace All', value: Action.ReplaceAll },
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
		setSpinnerText(`Checking ${chalk.cyan(item.filename)} (${item.fileNum + 1}/${item.fileCount})`);
	} else {
		spinner.stopAndPersist({
			symbol: item.numErrors ? chalk.red('❌') : chalk.green('✔'),
			text: `Checked ${chalk.cyan(item.filename)} in ${item.elapsedTimeMs ? Math.trunc(item.elapsedTimeMs!) : '[unknown]'}ms${
				item.numErrors ? ` (${chalk.red(item.numErrors)} typos)` : ''
			}`
		});
	}
};
