export const emptyReporter = () => {
	// Do nothing.
};

export const clean = (text: string) => text.replace(/\s+/g, ' ');

export const centerText = (text: string, length: number, width: number) => {
	const left = Math.floor((width - length) / 2);
	const right = width - length - left;
	return ' '.repeat(left) + text + ' '.repeat(right);
};
