import { esbuildPluginVersionInjector } from 'esbuild-plugin-version-injector';
import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
	clean: true,
	minify: !options.watch,
	entry: ['src/cli.ts'],
	format: ['cjs'],
	esbuildPlugins: [esbuildPluginVersionInjector()],
	target: 'node16',
	sourcemap: true,
	// Cspell/util/fileHelper has to be imported relatively because it is not exported in the package.json. However,
	// it's a very big file with many dependencies, so it's better to exclude it from the bundle.
	external: [/cspell/]
}));
