import { defineConfig } from 'tsdown';

const clean = process.argv.includes('--clean');

export default defineConfig({
	entry: 'src/**/*.ts',
	clean,
	treeshake: true,
	unbundle: true,
});
