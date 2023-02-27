import type { CSpellSettings, Issue } from 'cspell';

// This file is created to prevent circular dependencies
export const enum Action {
	Ignore,
	IgnoreAll,
	OpenHistory,
	Quit,
	Replace,
	ReplaceAll,
	SkipFile,
	UndoLastAction
}

export interface HistoryIssue {
	action: Action;
	issue: Issue;
	original?: string;
	replacer?: string;
}

// Store everything's state so it can be restored if the user presses Action.UndoLastAction.
export const previousState = {
	action: undefined as Action | undefined,
	issues: [] as Issue[],
	issue: {} as Issue,
	replacer: undefined as string | undefined,
	config: undefined as CSpellSettings | { cspell: CSpellSettings } | undefined,
	resolvedIssues: [] as Issue[]
};
