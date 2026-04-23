const EAS_PROJECT_ID = '58bfbc8c-441f-46be-992a-8b8965a95106';

module.exports = () => {
	const expo = {
		name: 'XTrimFitGym',
		slug: 'xtrimfitgym20',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/logos/XTFG_icon_square_1025.png',
		scheme: 'xtrimfitnessgymapp',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		ios: {
			supportsTablet: true,
			infoPlist: {
				NSAppTransportSecurity: {
					NSAllowsArbitraryLoads: true,
					NSExceptionDomains: {
						localhost: {
							NSExceptionAllowsInsecureHTTPLoads: true,
						},
					},
				},
			},
		},
		android: {
			package: 'com.devspirecompany.XTrimFitGym',
			softwareKeyboardLayoutMode: 'resize',
			adaptiveIcon: {
				backgroundColor: '#13161f',
				foregroundImage: './assets/logos/XTFG_icon_square_1025.png',
			},
			edgeToEdgeEnabled: true,
			predictiveBackGestureEnabled: false,
		},
		web: {
			output: 'static',
			favicon: './assets/logos/XTFG_icon_square_1025.png',
			bundler: 'metro',
		},
		plugins: [
			'expo-router',
			[
				'expo-build-properties',
				{
					android: {
						usesCleartextTraffic: true,
					},
				},
			],
			[
				'expo-splash-screen',
				{
					image: './assets/logos/XTFG_icon_square_1025.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#13161f',
					dark: {
						backgroundColor: '#13161f',
					},
				},
			],
			'expo-secure-store',
		],
		experiments: {
			typedRoutes: true,
			reactCompiler: true,
		},
		updates: {
			enabled: false,
			checkAutomatically: 'NEVER',
			fallbackToCacheTimeout: 0,
		},
		extra: {
			apiUrl: 'https://xtrimfitgym-api.onrender.com/graphql',
			exerciseDbApiKey: 'd078060844mshfa165078724b4bcp1ead29jsn5d8ee6d515b7',
			clerkPublishableKey: 'pk_test_bm9ibGUtY29sbGllLTUxLmNsZXJrLmFjY291bnRzLmRldiQ',
			eas: { projectId: EAS_PROJECT_ID },
		},
	};

	return {
		expo: {
			...expo,
		},
	};
};
