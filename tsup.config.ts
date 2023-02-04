import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
	clean: true,
	minify: !options.watch,
	entry: ['src/cli.ts'],
	format: [options.minify ? 'cjs' : 'esm'],
	plugins: [esbuildPluginVersionInjector()],
	target: 'node16',
	sourcemap: !options.minify,
	noExternal: options.minify ? ['chalk'] : undefined
}));
