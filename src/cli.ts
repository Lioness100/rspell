#! /usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import type { ErrorLike, Issue } from 'cspell';
import { lint } from 'cspell';
import { resetDisplay, showProgress } from './display';
import { handleIssue } from './handleIssue';
import { emptyReporter, getPackageData } from './utils';

interface CLIOptions {
	config?: string;
	exclude?: string[];
}

const packageData = await getPackageData();

program
	.name(packageData.name)
	.description(packageData.description)
	.version(packageData.version)
	.argument('[files...]', 'The glob patterns describing the files you want to spell check.', ['**'])
	.option('-c, --config <cpell.json>', 'Configuration file to use. By default cspell looks for cspell.json in the current directory.')
	.option(
		'-e, --exclude <glob>',
		'Exclude files matching the glob pattern. This option can be used multiple times to add multiple globs.',
		(value, previous?: string[]) => [...(previous ?? []), value]
	);

program.parse();

const options = program.opts<CLIOptions>();

const issues: Issue[] = [];
const errors: [string, ErrorLike][] = [];

const {
	issues: issueCount,
	files,
	filesWithIssues
} = await lint(
	program.processedArgs[0],
	{
		config: options.config,
		exclude: options.exclude,
		showSuggestions: true,
		verbose: true
	},
	{
		debug: emptyReporter,
		info: emptyReporter,
		progress: showProgress,
		result: emptyReporter,
		error: (message, error) => errors.push([message, error]),
		issue: (issue) => issues.push(issue)
	}
);

if (errors.length) {
	for (const [message, error] of errors) {
		console.error(chalk.red(message), error);
	}

	console.error(`\nSpell check failed with ${chalk.red(errors)} errors!`);
} else {
	resetDisplay();
	let hasQuit = false;

	for (const issue of issues.reverse()) {
		hasQuit = (await handleIssue(issue, hasQuit)) ?? false;
	}

	console.log(
		`\n${hasQuit ? 'Partially' : 'Successfully'} resolved ${chalk.green(issueCount)} issues in ${chalk.green(
			`${filesWithIssues.size}/${files}`
		)} matched files!`
	);
}
