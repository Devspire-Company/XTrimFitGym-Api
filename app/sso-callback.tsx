import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

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
