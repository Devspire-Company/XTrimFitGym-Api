import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', '..', 'docs', 'X-Trim-Fit-Gym-Member-Manual.docx');

/** Size in half-points (11pt = 22) */
const SZ_BODY = 22;
const SZ_SMALL = 20;
const SZ_TITLE = 56;
const SZ_H1 = 36;
const SZ_H2 = 28;

function run(text, opts = {}) {
	return new TextRun({
		text,
		font: 'Poppins',
		size: opts.size ?? SZ_BODY,
		bold: opts.bold ?? false,
		italics: opts.italics ?? false,
	});
}

function p(children, paraOpts = {}) {
	const kids = Array.isArray(children) ? children : [run(children)];
	return new Paragraph({
		spacing: { after: 120 },
		...paraOpts,
		children: kids,
	});
}

function pageBreak() {
	return new Paragraph({ children: [new PageBreak()] });
}

function section(title, photoBlock, bodyParagraphs) {
	const blocks = [
		p([run(title, { bold: true, size: SZ_H1 })], { heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 180 } }),
		p([run('Photo to insert', { bold: true, size: SZ_H2 })], { spacing: { after: 80 } }),
		p(photoBlock, { spacing: { after: 200 } }),
		p([run('Manual text', { bold: true, size: SZ_H2 })], { spacing: { after: 80 } }),
		...bodyParagraphs,
	];
	return blocks;
}

const children = [
	p([run('X-Trim Fit Gym', { bold: true, size: SZ_TITLE }), run(' — Member Application', { size: SZ_TITLE })], {
		alignment: AlignmentType.CENTER,
		spacing: { after: 200 },
	}),
	p([run('User guide', { size: SZ_H2 })], { alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
	p(
		[
			run(
				'This document describes the Member experience of the X-Trim Fit Gym mobile app. Members use the app to browse workouts, manage gym membership, view and complete scheduled sessions, track progress, browse coaches and equipment, and view attendance and session history.',
			),
		],
		{ spacing: { after: 160 } },
	),
	p([run('Audience: ', { bold: true }), run('Gym clients using the Member role.')], { spacing: { after: 80 } }),
	p([run('Requirements: ', { bold: true }), run('Compatible smartphone, internet access, and a registered account.')], {
		spacing: { after: 80 },
	}),
	p(
		[
			run(
				'Font: This file is formatted for Poppins. Install Poppins on your computer for Word to display it; otherwise Word may substitute a similar font.',
				{ italics: true, size: SZ_SMALL },
			),
		],
		{ spacing: { after: 240 } },
	),

	p([run('Page 1 — Photo for printed cover (optional)', { bold: true, size: SZ_H2 })], { spacing: { before: 120, after: 80 } }),
	p(
		'Insert a full-bleed or centered image: app logo (same as in-app header), optional gym or app splash; footer text “Member Guide”, document version, and date.',
		{ spacing: { after: 200 } },
	),

	pageBreak(),
	...section(
		'Page 2 — Signing in',
		'Full-screen Login: logo, Email and Password fields, primary sign-in control, and Continue with Google (if enabled on your build).',
		[
			p([run('2. Signing in', { bold: true })]),
			p('1. Open the app. If you are not signed in, you are taken to Login.'),
			p('2. Email and password: Enter a valid email and your password, then confirm sign-in. The app validates the email format and requires both fields.'),
			p('3. Google: Use Continue with Google to sign in with your Google account (OAuth). If sign-in fails, an on-screen message explains the error.'),
			p('4. After a successful sign-in, the app loads your profile. If your account is new and not yet registered in the system, you may be directed to complete registration before using member features.'),
			p([run('Note: ', { bold: true }), run('Sign-in uses Clerk authentication. Use the method your gym configured (email/password and/or Google).')]),
		],
	),

	pageBreak(),
	...section(
		'Page 3 — First-time setup: registration & onboarding',
		'Sign up screen and/or Complete registration, plus one Onboarding step from the first-time flow.',
		[
			p([run('3. Account creation and onboarding', { bold: true })]),
			p('1. Sign up: New users follow the in-app sign-up flow (including verification if your gym enables it).'),
			p('2. Complete registration: If the backend has no profile for your signed-in user, the app sends you to Complete registration to finish creating your member record.'),
			p('3. Onboarding: Members with incomplete onboarding are redirected to the onboarding sequence until status is completed.'),
			p('4. When onboarding is complete, the app opens the Member area. Where you land depends on membership (see Page 4).'),
		],
	),

	pageBreak(),
	...section(
		'Page 4 — Membership: what is unlocked',
		'(A) Membership required dialog with title “Membership required”. (B) Subscription screen showing available plans.',
		[
			p([run('4. Gym membership and access', { bold: true })]),
			p('Active gym membership in this app means your profile has an assigned membership (membership id on your account). Without it, you are a member without an active gym membership.'),
			p([run('Always available (no gym membership required)', { bold: true })]),
			p('• Workouts tab — exercise library and rest timer.'),
			p([run('Requires active gym membership', { bold: true })]),
			p('• Dashboard tab'),
			p('• Schedule tab'),
			p('• Progress tab'),
			p('• From the profile menu: Coaches, Attendance, Session Logs (hidden until you have membership; restricted tabs show Membership required and offer View membership).'),
			p('Subscription is available from the profile menu so you can view plans, submit requests, and manage subscription as implemented by your gym.'),
			p([run('First screen after login: ', { bold: true }), run('With membership, the app opens Dashboard; without it, Workouts.')]),
		],
	),

	pageBreak(),
	...section(
		'Page 5 — Main navigation (tabs & header)',
		'Member screen with bottom tab bar: Dashboard, Workouts, Schedule, Progress. Top header: logo, notifications bell, profile avatar.',
		[
			p([run('5. Main navigation', { bold: true })]),
			p([run('Bottom tabs (left to right)', { bold: true })]),
			p('1. Dashboard — Summary, upcoming sessions, goals preview, membership status.'),
			p('2. Workouts — Exercise catalog and rest timer.'),
			p('3. Schedule — Calendar, sessions, session completion, group-class actions.'),
			p('4. Progress — Goals, weight/progress charts, and related tools.'),
			p([run('Top header', { bold: true })]),
			p('• Center: App logo.'),
			p('• Right: Notifications — opens the notifications drawer; a badge can show pending items (e.g. coach request status updates).'),
			p('• Profile avatar — opens the profile menu (see Page 6).'),
			p([run('Note: ', { bold: true }), run('Use Profile → Coaches to open the Coaches screen.')]),
		],
	),

	pageBreak(),
	...section(
		'Page 6 — Profile menu',
		'Profile dropdown open: user block, then Profile, Coaches (when eligible), Attendance, Session Logs, Equipment, Help Center, Subscription, Settings, Log out.',
		[
			p([run('6. Profile menu', { bold: true })]),
			p('Tap your avatar (top right) to open the menu.'),
			p([run('Typical options for members', { bold: true })]),
			p('• Profile / Settings — Opens Profile to view or edit your details.'),
			p('• Coaches — Shown when you have active gym membership; browse coaches and manage coach requests.'),
			p('• Attendance — Shown with membership; gym check-in history tied to your attendance ID.'),
			p('• Session Logs — Shown with membership; history of completed sessions and details.'),
			p('• Equipment — Equipment catalog.'),
			p('• Help Center — In-app FAQ (member-filtered content where applicable).'),
			p('• Subscription — Plans, requests, and membership management.'),
			p('• Log out — Ends your session; confirm if prompted.'),
		],
	),

	pageBreak(),
	...section(
		'Page 7 — Dashboard',
		'Dashboard scrolled: welcome line, optional membership expiry banner (within 7 days), Membership card, Quick stats, Upcoming sessions with View All.',
		[
			p([run('7. Dashboard', { bold: true })]),
			p('The Dashboard welcomes you by name and summarizes your gym activity.'),
			p([run('Sections you may see', { bold: true })]),
			p('• Membership expiry reminder — If your membership ends within seven days, a warning appears; you can go to Subscription or dismiss the card.'),
			p('• No membership call-to-action — If you have no current membership record, a card may prompt you to View plans.'),
			p('• Membership — Plan name, status (e.g. ACTIVE), expiry date.'),
			p('• Quick stats — Count of upcoming sessions and completed sessions this month.'),
			p('• Upcoming sessions — Short list with View All linking to Schedule.'),
			p('• Active goals — Preview with View All linking to Progress.'),
			p('Pull down on the screen to refresh data.'),
		],
	),

	pageBreak(),
	...section(
		'Page 8 — Workouts',
		'Workouts tab: category chips, search field, exercise list; optional exercise detail with rest timer presets (e.g. 20–60 seconds).',
		[
			p([run('8. Workouts', { bold: true })]),
			p('Workouts is available to all signed-in members, including those without a gym membership.'),
			p([run('Features', { bold: true })]),
			p('• Browse exercises from the ExerciseDB API (categories / body parts and an “all” view).'),
			p('• Search to filter exercises.'),
			p('• Open an exercise to view details and illustration when the API key is configured.'),
			p('• Rest timer — Choose a duration preset, start/pause/reset to time rest between sets.'),
			p([run('Note: ', { bold: true }), run('Exercise images depend on app configuration. If the key is missing, listing may be limited or images unavailable.')]),
		],
	),

	pageBreak(),
	...section(
		'Page 9 — Schedule (sessions & calendar)',
		'Schedule tab: “Your workouts and group classes”, calendar, sessions for a selected day; optional joinable group classes.',
		[
			p([run('9. Schedule', { bold: true })]),
			p('Schedule requires active gym membership.'),
			p([run('Calendar', { bold: true })]),
			p('Select a date to see sessions and related items for that day.'),
			p([run('Sessions', { bold: true })]),
			p('View session name, time, location (gym area), and assigned coach. Expand or open items as the UI allows to see workout details.'),
			p([run('Group classes', { bold: true })]),
			p('Joinable group classes may appear when the gym offers them. If you are invited to a class, you can accept or decline from the session UI.'),
			p('Pull to refresh to update the calendar and lists.'),
		],
	),

	pageBreak(),
	...section(
		'Page 10 — Completing a session & coach rating',
		'Session completion: progress photos (Front, Right Side, Left Side, Back), weight field, confirm; then rate coach (stars + comment) if shown.',
		[
			p([run('10. Completing a session', { bold: true })]),
			p('From Schedule, when you complete a session according to your gym’s process, the app may guide you through:'),
			p('1. Progress photos — Capture or attach images for the required angles.'),
			p('2. Weight — Enter current weight if requested; invalid input may show a validation message.'),
			p('3. Upload — Wait until upload finishes before closing.'),
			p('4. Coach rating — After completion, you may rate the coach (score and optional comment).'),
			p('Exact steps depend on session type and gym configuration.'),
		],
	),

	pageBreak(),
	...section(
		'Page 11 — Progress',
		'Progress tab: goals, weight chart, and related summaries.',
		[
			p([run('11. Progress', { bold: true })]),
			p('Progress requires active gym membership.'),
			p([run('Goals', { bold: true })]),
			p('Create fitness goals from available types (e.g. Weight Loss, Muscle Building, General Fitness, Strength, Endurance, Flexibility, Athletic Performance, Rehabilitation). View active goals and delete goals when supported.'),
			p([run('Weight and charts', { bold: true })]),
			p('The app can display weight progress over time using data from the backend.'),
			p([run('Session-linked content', { bold: true })]),
			p('Progress views may tie into sessions and logs where the API provides data. Use pull to refresh where available.'),
		],
	),

	pageBreak(),
	...section(
		'Page 12 — Coaches',
		'Coaches screen: search, coach list, request coach, My coaches or profile modal.',
		[
			p([run('12. Coaches', { bold: true })]),
			p('Coaches requires active gym membership (access via Profile → Coaches).'),
			p([run('Features', { bold: true })]),
			p('• Search coaches.'),
			p('• Open a coach to view profile details (e.g. schedule preferences as time range when available).'),
			p('• Send a coach request; pending requests are tracked.'),
			p('• Cancel a pending request when the app offers that action.'),
			p('• My coaches — View coaches linked after approval.'),
			p('Notifications can reflect request status updates. Open the notifications drawer to review them.'),
		],
	),

	pageBreak(),
	...section(
		'Page 13 — Subscription',
		'Subscription: current membership, available plans, request/purchase modal, my subscription requests, cancel confirmation.',
		[
			p([run('13. Subscription', { bold: true })]),
			p('Open Subscription from the profile menu.'),
			p([run('Available plans', { bold: true })]),
			p('Browse active membership plans. Select a plan to start a subscription request. After submitting, the app may show reminders depending on plan type.'),
			p([run('Current membership', { bold: true })]),
			p('See your active plan, status, and expiry when applicable.'),
			p([run('Requests', { bold: true })]),
			p('The app may poll for updates on subscription requests.'),
			p([run('Cancellation', { bold: true })]),
			p('If supported, cancel membership from this screen and confirm in the dialog.'),
		],
	),

	pageBreak(),
	...section(
		'Page 14 — Attendance',
		'Attendance: grouped list by date (expandable), check-in times for your attendance ID.',
		[
			p([run('14. Attendance', { bold: true })]),
			p('Attendance requires active gym membership and a valid attendance ID on your profile.'),
			p('The screen loads attendance records from the gym’s access system (filtered by your card number / attendance ID).'),
			p([run('Using the screen', { bold: true })]),
			p('• Records are grouped by date (e.g. Today, Yesterday, or formatted dates).'),
			p('• Expand a date to see individual check-in times.'),
			p('• Pull to refresh to reload the latest records.'),
			p('If no attendance ID is assigned, the list may be empty until the gym updates your profile.'),
		],
	),

	pageBreak(),
	...section(
		'Page 15 — Session logs',
		'Session Logs list grouped by date; detail or images modal for one log.',
		[
			p([run('15. Session logs', { bold: true })]),
			p('Session Logs requires active gym membership.'),
			p('Completed sessions appear in chronological groups (e.g. Today, Yesterday, full dates).'),
			p([run('For each log you can typically review:', { bold: true })]),
			p('• Session date/time and completion time'),
			p('• Coach and session details'),
			p('• Workout exercises (sets/reps) when stored'),
			p('• Progress photos from completion when available'),
			p('Pull to refresh to update the list.'),
		],
	),

	pageBreak(),
	...section(
		'Page 16 — Equipment & Help',
		'Equipment grid “What we have for you” with status pills and Equipment details modal; Help Center with FAQ sections and Contact support.',
		[
			p([run('16. Equipment and Help Center', { bold: true })]),
			p([run('Equipment (Profile → Equipment)', { bold: true })]),
			p('Browse gym equipment in a two-column grid. Each card shows name, photo, and status (Available, Damaged, Under maintenance). Tap an item for details. Pull to refresh.'),
			p([run('Help Center (Profile → Help Center)', { bold: true })]),
			p('Expandable FAQ sections. Contact support uses the text configured in the app; replace with your gym’s real contact details in printed collateral if needed.'),
		],
	),

	pageBreak(),
	...section(
		'Page 17 — Profile & sign-out',
		'Profile screen: personal fields, Edit mode, workout time, body type / fitness goals, optional credentials section.',
		[
			p([run('17. Profile and sign-out', { bold: true })]),
			p('Profile lets you view and update information such as name, phone, date of birth, preferred workout time range, physique/body type, fitness goals, and credentials when editing is enabled.'),
			p('Save changes with the in-app primary action. Messages confirm success or show errors.'),
			p([run('Signing out', { bold: true })]),
			p('Use Log out in the profile menu and confirm. You return to Login.'),
		],
	),

	pageBreak(),
	p([run('Accuracy notes (for staff)', { bold: true, size: SZ_H2 })], { spacing: { before: 200, after: 120 } }),
	p('• Membership required message in the app: “Avail a gym membership to unlock the dashboard, schedule, progress, coaches, attendance, and session logs. You can keep using Workouts anytime.”'),
	p('• If the in-app Help Center mentions “Continue as walk-in” on login but that control is not on your Login screen, align printed FAQ with your actual build.'),
];

const doc = new Document({
	creator: 'X-Trim Fit Gym',
	title: 'Member User Manual',
	description: 'Member application user guide',
	styles: {
		default: {
			document: {
				run: {
					font: 'Poppins',
					size: SZ_BODY,
				},
				paragraph: {
					spacing: { line: 276 },
				},
			},
		},
	},
	sections: [
		{
			properties: {},
			children,
		},
	],
});

const buf = await Packer.toBuffer(doc);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buf);
console.log('Wrote', OUT);
