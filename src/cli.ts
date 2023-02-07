#!/usr/bin/env node
import { red } from 'colorette';
import { program } from 'commander';
import type { Issue } from 'cspell';
import { lint } from 'cspell';
import { reportErrors, reportSuccess, resetDisplay, showProgress, showStartupMessage } from './display';
import { handleIssues } from './handleIssue';

interface CLIOptions {
	cache?: boolean;
	config?: string;
	dot?: boolean;
	exclude?: string[];
	locale?: string;
	useGitignore?: boolean;
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
	// eslint-disable-next-line unicorn/string-content
	.option('-e, --exclude <globs...>', 'Exclude files matching the glob pattern.')
	.option('-g, --use-gitignore', 'Use the .gitignore file to exclude files.')
	.option('-C, --cache', 'Store the info about processed files in order to only operate on the changed ones.')
	.option('-d, --dot', 'Determine if files/directories starting with "." should be part of the glob search.')
	.option('-l, --locale <locale>', 'Explicitly set the locale to use for spell checking.');

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
			gitignore: options.useGitignore,
			cache: options.cache,
			dot: options.dot,
			locale: options.locale,
			showSuggestions: true,
			showContext: false
		},
		{
			progress: showProgress,
			error: (message, error) => console.error(red(message), error),
			issue: (issue) => issues.push(issue)
		}
	);

	if (errors) {
		reportErrors(errors);
	} else {
		resetDisplay();
		const hasQuit = await handleIssues(issues);

		reportSuccess(hasQuit, issueCount, files, filesWithIssues.size);
	}
};

// eslint-disable-next-line unicorn/prefer-top-level-await
start().catch(console.error);
