#!/usr/bin/env node
import chalk from 'chalk';
import { program } from 'commander';
import type { Issue } from 'cspell';
import { lint } from 'cspell';
import { resetDisplay, showProgress, showStartupMessage, stopSpinner } from './display';
import { handleIssues } from './handleIssue';

interface CLIOptions {
	config?: string;
	exclude?: string[];
}

program
	.name('rspell')
	.description(
		`📝 Find and fix all your project's typos with a single command!

Examples:
  $ rspell                                            Check all files
  $ rspell "src/**/*.ts"                              Check all TypeScript files in the src directory
  $ rspell --config some-file.json                    Use a custom configuration file
  $ rspell "test" --exclude "**/__snapshots__/**"     Exclude files in the __snapshots__ directory`
	)
	// The below version is injected via esbuild-plugin-version-injector. The program could read from package.json, but
	// that wouldn't work for the generated executable files.
	.version('[VI]{{inject}}[/VI]')
	// eslint-disable-next-line unicorn/string-content
	.argument('[files...]', 'The glob patterns describing the files you want to spell check.', ['**'])
	.option(
		'-c, --config <cspell.json>',
		'Configuration file to use. By default cspell looks for cspell.json in the current directory.'
	)
	.option(
		// eslint-disable-next-line unicorn/string-content
		'-e, --exclude <globs...>',
		'Exclude files matching the glob pattern. This option can be used multiple times to add multiple globs.'
	);

program.parse();

const options = program.opts<CLIOptions>();
const issues: Issue[] = [];

const globs = program.processedArgs[0];
showStartupMessage(globs);

const start = async () => {
	const {
		issues: issueCount,
		files,
		filesWithIssues,
		errors
	} = await lint(
		globs,
		{
			config: options.config,
			exclude: options.exclude,
			showSuggestions: true,
			showContext: false
		},
		{
			progress: showProgress,
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

		stopSpinner();

		console.log(
			`\n${adverb} resolved ${color(issueCount)} issues in ${color(
				`${filesWithIssues.size}/${files}`
			)} matched files!`
		);
	}
};

// Top level await cannot be used because this code must be compiled to a CommonJS module for compatibility with `pkg`,
// which is used to generate the executable files.
// eslint-disable-next-line unicorn/prefer-top-level-await
start().catch(console.error);
