import { randomUUID } from 'node:crypto';
import { type HistoryIssue } from './shared';

export const history = new Array<HistoryIssue>();

export const addNewHistoryIssue = ({ action, issue, replacer }: Omit<HistoryIssue, 'id'>) => {
	if (history.length >= 100) {
		history.shift();
	}

	let original: string;

	//  If action is Replace or ReplaceAll, the word should be replaced with the replacer
	// on the issue object, because when the user rolls back the action and write a replacement
	// again, the replacer should be the new word to replace the issue to avoid overflowing characters.
	if (replacer) {
		// Don't record the action if the replacer is the same as the issue text.
		if (replacer === issue.text) {
			return;
		}

		original = issue.text;

		issue.line.text = issue.line.text.replace(issue.text, replacer);

		issue.text = replacer;
		issue.length = replacer.length;
	}

	history.push({
		action,
		issue,
		original: original!,
		replacer,
		id: randomUUID()
	});
};

export const removeIssueFromHistory = (id: string) => {
	const index = history.findIndex((issue) => issue.id === id);

	if (index !== -1) {
		history.splice(index, 1);
	}
};
