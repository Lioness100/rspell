import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
	clean: true,
	minify: !options.watch,
	entry: ['src/cli.ts'],
	format: ['esm'],
	tsconfig: 'tsconfig.json',
	sourcemap: true,
	target: 'node16'
}));
