import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

/**
 * OAuth / SSO return route for `expo-auth-session` + Clerk `useSSO`.
 * Without this screen, the post-login deep link can hit an unmatched route and
 * destabilize Android release builds when returning from the system browser.
 */
export default function SsoCallbackScreen() {
	useEffect(() => {
		WebBrowser.maybeCompleteAuthSession();
	}, []);

	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#0D0D0D',
				paddingHorizontal: 24,
			}}
		>
			<ActivityIndicator size='large' color='#F9C513' />
			<Text style={{ color: '#888', marginTop: 16, textAlign: 'center', fontSize: 13 }}>
				Completing sign-in…
			</Text>
		</View>
	);
}
