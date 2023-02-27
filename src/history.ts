import { type HistoryIssue } from './shared';

export const history: HistoryIssue[] = [];

export const addNewHistoryIssue = ({ action, issue, replacer }: Omit<HistoryIssue, 'id'>) => {
	if (history.length >= 10) {
		history.shift();
	}

	const original: string = issue.text;

	//  If action is Replace or ReplaceAll, the word should be replaced with the replacer
	// on the issue object, because when the user rolls back the action and write a replacement
	// again, the replacer should be the new word to replace the issue to avoid overflowing characters.
	if (replacer) {
		// Don't record the action if the replacer is the same as the issue text.
		if (replacer === issue.text) {
			return;
		}

		issue.line.text = issue.line.text.replace(issue.text, replacer);

		issue.text = replacer;
		issue.length = replacer.length;
	}

	history.push({
		action,
		issue,
		original,
		replacer
	});
};

export const removeIssueFromHistory = (issue: HistoryIssue) => {
	const index = history.indexOf(issue);

	if (index >= 0) {
		history.splice(index, 1);
	}
};
