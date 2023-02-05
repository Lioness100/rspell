// This enum is created in a constants file as opposed to handleIssue.ts to prevent circular dependencies.
export const enum Action {
	Ignore,
	IgnoreAll,
	Replace,
	ReplaceAll,
	SkipFile,
	Quit
}
