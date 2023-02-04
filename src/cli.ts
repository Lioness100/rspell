#! /usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import type { Issue } from 'cspell';
import { lint } from 'cspell';
import { resetDisplay, showProgress } from './display';
import { handleIssues } from './handleIssue';
import { emptyReporter } from './utils';

interface CLIOptions {
	config?: string;
	exclude?: string[];
}

program
	.name('rspell')
	.description("📝 Find and fix all your project's typos with a single command!")
	.version('[VI]{{inject}}[/VI]')
	.argument('[files...]', 'The glob patterns describing the files you want to spell check.', ['**'])
	.option('-c, --config <cspell.json>', 'Configuration file to use. By default cspell looks for cspell.json in the current directory.')
	.option(
		'-e, --exclude <glob>',
		'Exclude files matching the glob pattern. This option can be used multiple times to add multiple globs.',
		(value, previous?: string[]) => [...(previous ?? []), value]
	);

program.parse();

const options = program.opts<CLIOptions>();
const issues: (Issue & { resolved?: boolean })[] = [];

const start = async () => {
	const {
		issues: issueCount,
		files,
		filesWithIssues,
		errors
	} = await lint(
		program.processedArgs[0],
		{
			config: options.config,
			exclude: options.exclude,
			showSuggestions: true,
			showContext: false
		},
		{
			debug: emptyReporter,
			info: emptyReporter,
			progress: showProgress,
			result: emptyReporter,
			error: (message, error) => console.error(chalk.red(message), error),
			issue: (issue) => issues.push(issue)
		}
	);

	if (errors) {
		console.error(`\nSpell check failed with ${chalk.red(errors)} errors!`);
	} else {
		resetDisplay();
		const hasQuit = await handleIssues(issues);

		const color = hasQuit ? chalk.yellow : chalk.green;
		const adverb = hasQuit ? 'Partially' : 'Successfully';

		console.log(`\n${adverb} resolved ${color(issueCount)} issues in ${color(`${filesWithIssues.size}/${files}`)} matched files!`);
	}
};

// eslint-disable-next-line unicorn/prefer-top-level-await
start().catch(console.error);
