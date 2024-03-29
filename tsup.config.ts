import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
	clean: true,
	minify: !options.watch,
	entry: ['src/cli.ts'],
	format: ['cjs'],
	esbuildPlugins: [esbuildPluginVersionInjector()],
	target: 'node16',
	sourcemap: true
}));
