import { ClerkTokenBridge } from '@/components/ClerkTokenBridge';
import { AuthProvider } from '@/contexts/AuthContext';
import client, { API_URL } from '@/lib/apollo-client';
import { logClerkApiPairingHint } from '@/lib/clerk-api-pairing-hint';
import { clerkTokenCache } from '@/lib/clerk-token-cache';
import { persistor, store } from '@/store';
import { ApolloProvider } from '@apollo/client/react';
import { ClerkProvider } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import '../global.css';

WebBrowser.maybeCompleteAuthSession();

const clerkPublishableKey =
	(Constants.expoConfig?.extra?.clerkPublishableKey as string | undefined) ||
	process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
	'';

// Loading component for PersistGate
function LoadingScreen() {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: '#0D0D0D',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<ActivityIndicator size='large' color='#F9C513' />
			<Text style={{ color: '#fff', marginTop: 12 }}>Loading app…</Text>
		</View>
	);
}

LoadingScreen.displayName = 'LoadingScreen';

function ClerkDevPairingLogger({ publishableKey }: { publishableKey: string }) {
	useEffect(() => {
		logClerkApiPairingHint(API_URL, publishableKey);
	}, [publishableKey]);
	return null;
}

export default function RootLayout() {
	if (!clerkPublishableKey?.trim()) {
		return (
			<GestureHandlerRootView style={{ flex: 1 }}>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						padding: 24,
						backgroundColor: '#13161f',
					}}
				>
					<Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
						Set your Clerk publishable key: add{' '}
						<Text style={{ fontWeight: '700' }}>clerkPublishableKey</Text> under{' '}
						<Text style={{ fontWeight: '700' }}>expo.extra</Text> in app.json,
						or set{' '}
						<Text style={{ fontWeight: '700' }}>
							EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
						</Text>
						.
					</Text>
				</View>
			</GestureHandlerRootView>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<Provider store={store}>
					<PersistGate loading={<LoadingScreen />} persistor={persistor}>
						<ClerkProvider
							publishableKey={clerkPublishableKey}
							tokenCache={clerkTokenCache}
						>
							<ClerkDevPairingLogger publishableKey={clerkPublishableKey} />
							<ApolloProvider client={client}>
								<ClerkTokenBridge />
								<AuthProvider>
									<StatusBar style='auto' />
									<Stack screenOptions={{ headerShown: false }}>
										<Stack.Screen
											name='index'
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name='sso-callback'
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name='(auth)'
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name='(coach)'
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name='(member)'
											options={{ headerShown: false }}
										/>
									</Stack>
								</AuthProvider>
							</ApolloProvider>
						</ClerkProvider>
					</PersistGate>
				</Provider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
