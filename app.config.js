/**
 * Local `expo start` should NOT set `extra.eas.projectId`, or Expo tries to fetch
 * development signing certs and shows the "Log in / Proceed anonymously" prompt
 * (broken in many IDE terminals). EAS Build workers set `EAS_BUILD=true`, where we
 * inject the project id so cloud builds stay linked.
 */
const base = require('./app.json');

const EAS_PROJECT_ID = '8cee07cd-6b07-4839-84d0-ae905b4b87fd';

module.exports = () => {
	const expo = base.expo;
	const extra = { ...(expo.extra || {}) };

	if (process.env.EAS_BUILD === 'true') {
		extra.eas = { projectId: EAS_PROJECT_ID };
	}

	return {
		...base,
		expo: {
			...expo,
			extra,
		},
	};
};
