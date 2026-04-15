#!/usr/bin/env node
/**
 * Invoked when you run `npx start` from the app root (local devDependency named "start").
 * Delegates to `npm run start` so flags and scripts stay in sync with package.json.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findAppRoot(fromDir) {
	let dir = path.resolve(fromDir);
	for (let i = 0; i < 10; i++) {
		const expoPkg = path.join(dir, 'node_modules', 'expo', 'package.json');
		if (fs.existsSync(expoPkg)) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return path.resolve(fromDir, '..', '..');
}

const repoRoot = findAppRoot(__dirname);
const extra = process.argv.slice(2);
const npmArgs = ['run', 'start'];
if (extra.length) npmArgs.push('--', ...extra);

const r = spawnSync('npm', npmArgs, {
	cwd: repoRoot,
	stdio: 'inherit',
	shell: process.platform === 'win32',
	env: process.env,
});

process.exit(r.status === null ? 1 : r.status);
