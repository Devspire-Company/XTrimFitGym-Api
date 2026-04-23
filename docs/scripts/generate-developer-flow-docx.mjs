/**
 * Generates docs/MOBILE_APP_DEVELOPER_FLOW.docx from docs/MOBILE_APP_DEVELOPER_FLOW.md
 * Run: node docs/scripts/generate-developer-flow-docx.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	Document,
	HeadingLevel,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	WidthType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MD_PATH = path.join(__dirname, '..', 'MOBILE_APP_DEVELOPER_FLOW.md');
const OUT_ARG = process.argv[2];
const DEFAULT_OUT = path.join(__dirname, '..', 'MOBILE_APP_DEVELOPER_FLOW_FULL.docx');
const LEGACY_OUT = path.join(__dirname, '..', 'MOBILE_APP_DEVELOPER_FLOW.docx');
const OUT_PATH = OUT_ARG ? path.resolve(OUT_ARG) : DEFAULT_OUT;

function textToRuns(str) {
	const runs = [];
	const re = /\*\*([^*]+)\*\*/g;
	let last = 0;
	let m;
	while ((m = re.exec(str)) !== null) {
		if (m.index > last) runs.push(new TextRun(str.slice(last, m.index)));
		runs.push(new TextRun({ text: m[1], bold: true }));
		last = m.index + m[0].length;
	}
	if (last < str.length) runs.push(new TextRun(str.slice(last)));
	if (runs.length === 0) runs.push(new TextRun(str));
	return runs;
}

function isTableSeparator(line) {
	return /^\|[\s\-:|]+\|\s*$/.test(line);
}

function parseTableRow(line) {
	return line
		.split('|')
		.map((c) => c.trim())
		.filter((c, i, arr) => !(c === '' && (i === 0 || i === arr.length - 1)));
}

function mdTableToDocxTable(lines) {
	const rows = [];
	for (const line of lines) {
		if (isTableSeparator(line)) continue;
		const cells = parseTableRow(line);
		if (cells.length === 0) continue;
		rows.push(
			new TableRow({
				children: cells.map(
					(c) =>
						new TableCell({
							children: [new Paragraph({ children: textToRuns(c) })],
						})
				),
			})
		);
	}
	if (rows.length === 0) return null;
	return new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows,
	});
}

function parseMarkdown(md) {
	const lines = md.split(/\r?\n/);
	/** @type {import('docx').Paragraph | import('docx').Table}[] */
	const children = [];
	let docTitleSet = false;
	let i = 0;

	while (i < lines.length) {
		const raw = lines[i];
		const line = raw.trimEnd();

		if (line === '' || line === '---') {
			i++;
			continue;
		}

		if (line.startsWith('|')) {
			const tbl = [];
			while (i < lines.length && lines[i].trim().startsWith('|')) {
				tbl.push(lines[i].trim());
				i++;
			}
			const t = mdTableToDocxTable(tbl);
			if (t) children.push(t);
			children.push(new Paragraph({ text: '' }));
			continue;
		}

		if (line.startsWith('# ')) {
			const t = line.slice(2).trim();
			if (!docTitleSet) {
				children.push(
					new Paragraph({
						text: t,
						heading: HeadingLevel.TITLE,
					})
				);
				children.push(
					new Paragraph({
						children: [
							new TextRun({
								text: 'Generated from MOBILE_APP_DEVELOPER_FLOW.md — keep the Markdown file as the editable source.',
								italics: true,
							}),
						],
					})
				);
				docTitleSet = true;
			} else {
				children.push(new Paragraph({ children: textToRuns(t), heading: HeadingLevel.HEADING_1 }));
			}
			i++;
			continue;
		}

		if (line.startsWith('## ')) {
			children.push(
				new Paragraph({
					children: textToRuns(line.slice(3).trim()),
					heading: HeadingLevel.HEADING_1,
				})
			);
			i++;
			continue;
		}

		if (line.startsWith('### ')) {
			children.push(
				new Paragraph({
					children: textToRuns(line.slice(4).trim()),
					heading: HeadingLevel.HEADING_2,
				})
			);
			i++;
			continue;
		}

		if (line.startsWith('#### ')) {
			children.push(
				new Paragraph({
					children: textToRuns(line.slice(5).trim()),
					heading: HeadingLevel.HEADING_3,
				})
			);
			i++;
			continue;
		}

		if (/^\d+\.\s/.test(line)) {
			children.push(new Paragraph({ children: textToRuns(line) }));
			i++;
			continue;
		}

		if (line.startsWith('- ')) {
			children.push(
				new Paragraph({
					children: textToRuns(line.slice(2)),
					bullet: { level: 0 },
				})
			);
			i++;
			continue;
		}

		children.push(new Paragraph({ children: textToRuns(line) }));
		i++;
	}

	return new Document({
		sections: [
			{
				properties: {},
				children,
			},
		],
	});
}

const md = fs.readFileSync(MD_PATH, 'utf8');
const doc = parseMarkdown(md);
const buf = await Packer.toBuffer(doc);
fs.writeFileSync(OUT_PATH, buf);
console.log('Wrote', OUT_PATH);
if (!OUT_ARG && OUT_PATH === DEFAULT_OUT) {
	try {
		fs.writeFileSync(LEGACY_OUT, buf);
		console.log('Also wrote', LEGACY_OUT);
	} catch (e) {
		if (e && (e.code === 'EBUSY' || e.code === 'EPERM')) {
			console.warn('Skipped', LEGACY_OUT, '(file open or locked). Use FULL doc or close Word and run again.');
		} else throw e;
	}
}
