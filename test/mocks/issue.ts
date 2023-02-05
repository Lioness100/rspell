import type { Issue } from 'cspell';
import { highlightText } from '../../src/display';

export const sampleText = 'I am happpy.' as const;
export const sampleFixed = 'I am happy.' as const;
export const sampleReplacer = 'happy' as const;

export interface IssueMockData {
	line: string;
	// Offset of the text in the line
	lineOffset: number;
	// Offset of the text in the file
	offset: number;
	row: number;
}

export const createIssueMock = (data: IssueMockData): Issue => ({
	text: 'happpy',
	offset: data.offset,
	line: { text: `${data.line}\n`, offset: data.lineOffset },
	col: data.offset - data.lineOffset + 1,
	context: { text: data.line, offset: data.lineOffset },
	uri: 'file://uri/path/name',
	row: data.row
});

export const createSampleDisplay = ({ before, after }: { after?: number; before?: number } = {}) => {
	return highlightText(
		`${before ? `${sampleFixed.repeat(before ?? 0)} ` : ''}I am `,
		'happpy',
		`.${after ? ` ${sampleText.repeat(after ?? 0)}` : ''}`
	);
};
