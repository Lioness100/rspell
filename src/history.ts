import { type ActionHistoryEntry } from './shared';

export const history: ActionHistoryEntry[] = [];

export const appendIssueToHistory = ({ action, issue, replacer }: Omit<ActionHistoryEntry, 'id'>) => {
	if (history.length >= 10) {
		history.shift();
	}

	const original = issue.text;

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

	history.push({ action, issue, original, replacer });
};

export const removeIssueFromHistory = (issue: ActionHistoryEntry) => {
	const index = history.indexOf(issue);

	if (index !== -1) {
		history.splice(index, 1);
	}
};
