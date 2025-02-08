import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import sourceMaps from 'rollup-plugin-sourcemaps';

export default {
    input: 'src/index.ts',
    output: [
		{
			file: './dist/html2canvas.js',
			name: 'html2canvas',
			format: 'umd',
			sourcemap: true,
		},
	],
	external: [],
	plugins: [
		resolve(),
		json(),
		// https://github.com/rollup/plugins/tree/master/packages/typescript
		typescript({ sourceMap: true, inlineSources: true}),
		sourceMaps(),
	],
}