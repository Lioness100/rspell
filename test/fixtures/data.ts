import { createIssueMock, IssueMockData, sampleFixed, sampleText, createSampleDisplay } from '../mocks/issue';

interface TypoSetData {
	text: string;
	fixed: string;
	displays: string[];
	issues: IssueMockData[];
}

const oneTypoOnOneLine: TypoSetData = {
	text: sampleText,
	fixed: sampleFixed,
	displays: [createSampleDisplay()],
	issues: [
		{
			offset: 5,
			lineOffset: 0,
			line: sampleText,
			row: 1
		}
	]
};

const twoTyposOnOneLine: TypoSetData = {
	text: `${sampleText} ${sampleText}`,
	fixed: `${sampleFixed} ${sampleFixed}`,
	displays: [createSampleDisplay({ after: 1 }), createSampleDisplay({ before: 1 })],
	issues: [
		{
			offset: 5,
			lineOffset: 0,
			line: `${sampleText} ${sampleText}`,
			row: 1
		},
		{
			offset: 18,
			lineOffset: 0,
			line: `${sampleText} ${sampleText}`,
			row: 1
		}
	]
};

const twoTyposOnTwoLines: TypoSetData = {
	text: `${sampleText}\n${sampleText}`,
	fixed: `${sampleFixed}\n${sampleFixed}`,
	displays: [createSampleDisplay(), createSampleDisplay()],
	issues: [
		{
			offset: 5,
			lineOffset: 0,
			line: sampleText,
			row: 1
		},
		{
			offset: 18,
			lineOffset: 13,
			line: sampleText,
			row: 2
		}
	]
};

const threeTyposOnTwoLines1: TypoSetData = {
	text: `${sampleText}\n${sampleText} ${sampleText}`,
	fixed: `${sampleFixed}\n${sampleFixed} ${sampleFixed}`,
	displays: [createSampleDisplay(), createSampleDisplay({ after: 1 }), createSampleDisplay({ before: 1 })],
	issues: [
		{
			offset: 5,
			lineOffset: 0,
			line: sampleText,
			row: 1
		},
		{
			offset: 18,
			lineOffset: 13,
			line: `${sampleText} ${sampleText}`,
			row: 2
		},
		{
			offset: 31,
			lineOffset: 13,
			line: `${sampleText} ${sampleText}`,
			row: 2
		}
	]
};

const threeTyposOnTwoLines2: TypoSetData = {
	text: `${sampleText} ${sampleText}\n${sampleText}`,
	fixed: `${sampleFixed} ${sampleFixed}\n${sampleFixed}`,
	displays: [createSampleDisplay({ after: 1 }), createSampleDisplay({ before: 1 }), createSampleDisplay()],
	issues: [
		{
			offset: 5,
			lineOffset: 0,
			line: `${sampleText} ${sampleText}`,
			row: 1
		},
		{
			offset: 18,
			lineOffset: 0,
			line: `${sampleText} ${sampleText}`,
			row: 1
		},
		{
			offset: 31,
			lineOffset: 26,
			line: sampleText,
			row: 2
		}
	]
};

const fourTyposOnTwoLines: TypoSetData = {
	text: `${sampleText} ${sampleText}\n${sampleText} ${sampleText}`,
	fixed: `${sampleFixed} ${sampleFixed}\n${sampleFixed} ${sampleFixed}`,
	displays: [
		createSampleDisplay({ after: 1 }),
		createSampleDisplay({ before: 1 }),
		createSampleDisplay({ after: 1 }),
		createSampleDisplay({ before: 1 })
	],
	issues: [
		{
			offset: 5,
			lineOffset: 0,
			line: `${sampleText} ${sampleText}`,
			row: 1
		},
		{
			offset: 18,
			lineOffset: 0,
			line: `${sampleText} ${sampleText}`,
			row: 1
		},
		{
			offset: 31,
			lineOffset: 26,
			line: `${sampleText} ${sampleText}`,
			row: 2
		},
		{
			offset: 44,
			lineOffset: 26,
			line: `${sampleText} ${sampleText}`,
			row: 2
		}
	]
};

export const allTypoSets = (
	[
		['oneTypoOnOneLine', oneTypoOnOneLine],
		['twoTyposOnOneLine', twoTyposOnOneLine],
		['twoTyposOnTwoLines', twoTyposOnTwoLines],
		['threeTyposOnTwoLines1', threeTyposOnTwoLines1],
		['threeTyposOnTwoLines2', threeTyposOnTwoLines2],
		['fourTyposOnTwoLines', fourTyposOnTwoLines]
	] as [string, TypoSetData][]
).map(([name, data]) => [name, { ...data, issues: data.issues.map((issue) => createIssueMock(issue)) }] as const);
