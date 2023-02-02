import { allTypoSets } from './fixtures/data';
import { writeFile } from 'node:fs/promises';
import { handleIssues } from '../src/handleIssue';
import type { Issue } from 'cspell';
import { formatContext } from '../src/display';
import { Action } from '../src/constants';
import { sampleReplacer } from './mocks/issue';

let originalDetermineActionIssueArguments: Issue[] = [];
let file = '';

vi.mock('node:fs/promises', () => ({
	readFile: vi.fn(() => file),
	writeFile: vi.fn((_url: URL, data: string) => (file = data))
}));

vi.mock('../src/display', async () => {
	const module_ = await vi.importActual<typeof import('../src/display')>('../src/display');
	return {
		...module_,
		determineAction: vi.fn((_url: URL, issue: Issue) => {
			originalDetermineActionIssueArguments.push(JSON.parse(JSON.stringify(issue)));
			return [Action.Replace, sampleReplacer] as const;
		}),
		resetDisplay: vi.fn()
	};
});

afterEach(() => {
	vi.clearAllMocks();
	originalDetermineActionIssueArguments = [];
});

describe.each(allTypoSets)('%s', (name, data) => {
	test('Fixing & Displaying Typos', async () => {
		file = data.text;

		const originalIssueLength = data.issues.length;
		const lastIssueUri = data.issues.at(-1)!.uri!;

		await handleIssues(data.issues);

		expect(writeFile, name).toBeCalledTimes(originalIssueLength);
		expect(writeFile, name).lastCalledWith(new URL(lastIssueUri), data.fixed);

		const receivedDisplays = originalDetermineActionIssueArguments.map((issue) => formatContext(issue));
		expect(receivedDisplays).toMatchObject(data.displays);
	});
});
