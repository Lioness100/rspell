import fs from 'node:fs';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { vi, afterEach, describe, test, expect } from 'vitest';
import { handleIssues } from '../src/handleIssue';
import { determineAction, formatContext } from '../src/display';
import { findConfig } from '../src/config';
import { Action } from '../src/shared';
import { allTypoSets } from './fixtures/data';
import { sampleReplacer } from './mocks/issue';

let file = '';

// To prevent reading and writing to the actual file system, we mock the `fs/promises` module.
// The "file" is just a string stored in a variable.
vi.mock('node:fs/promises', () => ({
	readFile: vi.fn(() => file),
	writeFile: vi.fn((_, data: string) => (file = data))
}));

vi.mock('../src/display', async () => {
	const actualModule = await vi.importActual<typeof import('../src/display')>('../src/display');
	return {
		...actualModule,
		// We don't want to actually display anything to gather user input.
		determineAction: vi.fn(() => [Action.Replace, sampleReplacer]),
		// We also don't want to clear the console.
		resetDisplay: vi.fn()
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

describe.each(allTypoSets)('%s', (name, data) => {
	test('Fixing & Displaying Typos', async () => {
		file = data.text;

		const originalIssueLength = data.issues.length;
		const lastIssueUri = data.issues.at(-1)!.uri!;

		await handleIssues(data.issues);

		// `name` is passed in every `expect` function call because otherwise some errors don't show up if multiple
		// tests fail.
		expect(writeFile, name).toBeCalledTimes(originalIssueLength);

		// We're only looking at the last call to `writeFile` because that would theoretically hold the correction of
		// every typo.
		expect(writeFile, name).lastCalledWith(new URL(lastIssueUri), data.fixed);

		// We can't use the original data.issues, because the `offset` and `line.text` properties are updated. So, we
		// have to use the mocked `determineAction` function to get the issues that were displayed.
		const displayedIssues = vi.mocked(determineAction).mock.calls.map(([, issue]) => issue);
		const contextDisplays = displayedIssues.map((issue) => formatContext(issue));

		expect(contextDisplays, name).toMatchObject(data.displays);
	});
});

describe('findConfig', () => {
	test('should find a mock config file in working directory', async () => {
		const readFileSpy = vi.spyOn<typeof fs, 'readFile'>(fs, 'readFile');

		readFileSpy.mockImplementation(((
			path: string,
			_encoding: any,
			callback: (err: NodeJS.ErrnoException | null, data: string) => void
		) => {
			if (path === join(process.cwd(), 'cspell.json')) {
				callback(null, '{}');
			} else {
				callback(null, '');
			}
		}) as typeof fs.readFile);

		const config = await findConfig();

		expect(config).toBe(join(process.cwd(), 'cspell.json'));
	});
});
