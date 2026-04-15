const path = require('path');

module.exports = function (api) {
	api.cache(true);
	return {
		presets: [
			['babel-preset-expo', { jsxImportSource: 'nativewind' }],
			'nativewind/babel',
		],
		plugins: [
			[
				'module-resolver',
				{
					root: [path.resolve(__dirname)],
					alias: {
						'@': path.resolve(__dirname),
					},
					extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
				},
			],
		],
	};
};
