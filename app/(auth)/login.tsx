import AuthProcessingScreen from '@/components/AuthProcessingScreen';
import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import Input from '@/components/Input';
import {
	isSessionAlreadyActiveError,
	setActiveIgnoringSessionConflict,
} from '@/lib/clerk-session-errors';
import { getClerkOAuthRedirectUrl } from '@/lib/clerk-oauth-redirect';
import { storeTokenAfterClerkSession } from '@/lib/clerk-sso';
import { replaceToAppRoot } from '@/lib/post-auth-navigation';
import { setAuthFlowIntent } from '@/utils/auth-flow';
import { storage } from '@/utils/storage';
import {
	isClerkAPIResponseError,
	useAuth,
	useSignIn,
	useSSO,
} from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

type LoginStep = 'email' | 'code';

type EmailCodeFactor = { strategy: string; emailAddressId?: string };

const Login = () => {
	const router = useRouter();
	const { isLoaded, signIn, setActive } = useSignIn();
	const { getToken } = useAuth();
	const { startSSOFlow } = useSSO();
	const [step, setStep] = useState<LoginStep>('email');
	const [email, setEmail] = useState('');
	const [loginCode, setLoginCode] = useState('');
	const [emailError, setEmailError] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });

	useEffect(() => {
		void setAuthFlowIntent('login');
	}, []);

	const validateEmail = () => {
		setEmailError('');
		if (!email.trim()) {
			setEmailError('Email is required');
			return false;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setEmailError('Please enter a valid email');
			return false;
		}
		return true;
	};

	const finishSignInSession = async (sessionId: string | null | undefined) => {
		await setAuthFlowIntent('login');
		await setActiveIgnoringSessionConflict(setActive, sessionId);
		const t = await getToken();
		if (t) await storage.setItem('auth_token', t);
		replaceToAppRoot();
	};

	const handleGoogle = async () => {
		if (!isLoaded || googleLoading) return;
		setGoogleLoading(true);
		try {
			const { createdSessionId, setActive: sa } = await startSSOFlow({
				strategy: 'oauth_google',
				redirectUrl: getClerkOAuthRedirectUrl(),
			});
			const ok = await storeTokenAfterClerkSession(
				createdSessionId ?? undefined,
				sa,
				getToken,
			);
			if (ok) {
				await setAuthFlowIntent('login');
				replaceToAppRoot();
				return;
			}
		} catch (err: unknown) {
			let message = 'Google sign-in failed. Try again.';
			if (isClerkAPIResponseError(err)) {
				const first = err.errors?.[0];
				if (first?.message) message = first.message;
			} else if (err instanceof Error) {
				message = err.message;
			}
			setAlertModal({
				visible: true,
				title: 'Sign-in failed',
				message,
				variant: 'danger',
			});
		} finally {
			setGoogleLoading(false);
		}
	};

	const handleSendSignInCode = async () => {
		if (!isLoaded || !signIn) return;
		if (!validateEmail()) return;
		setSubmitting(true);
		try {
			await signIn.create({ identifier: email.trim() });
			const factors = (signIn.supportedFirstFactors ?? []) as EmailCodeFactor[];
			const emailFactor = factors.find((f) => f.strategy === 'email_code');
			if (!emailFactor?.emailAddressId) {
				setAlertModal({
					visible: true,
					title: 'Sign-in unavailable',
					message:
						'Email code sign-in is not available. In Clerk Dashboard, enable email sign-in with a verification code (or use Continue with Google).',
					variant: 'danger',
				});
				return;
			}
			await signIn.prepareFirstFactor({
				strategy: 'email_code',
				emailAddressId: emailFactor.emailAddressId,
			});
			setLoginCode('');
			setStep('code');
		} catch (err: unknown) {
			let message = 'Could not send sign-in code.';
			if (isClerkAPIResponseError(err)) {
				const first = err.errors?.[0];
				if (first?.message) message = first.message;
			} else if (err instanceof Error) {
				message = err.message;
			}
			setAlertModal({
				visible: true,
				title: 'Sign-in failed',
				message,
				variant: 'danger',
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleVerifySignInCode = async () => {
		if (!isLoaded || !signIn) return;
		const trimmed = loginCode.trim();
		if (!trimmed) {
			setAlertModal({
				visible: true,
				title: 'Code required',
				message: 'Enter the code from your email.',
				variant: 'danger',
			});
			return;
		}
		setSubmitting(true);
		try {
			const result = await signIn.attemptFirstFactor({
				strategy: 'email_code',
				code: trimmed,
			});
			if (result.status === 'complete' && result.createdSessionId) {
				await finishSignInSession(result.createdSessionId);
				return;
			}
			setAlertModal({
				visible: true,
				title: 'Sign-in',
				message: 'Could not complete sign-in. Try again or request a new code.',
				variant: 'danger',
			});
		} catch (err: unknown) {
			if (isSessionAlreadyActiveError(err) && signIn.createdSessionId) {
				try {
					await finishSignInSession(signIn.createdSessionId);
				} catch {
					/* ignore */
				}
				return;
			}
			let message = 'Invalid or expired code.';
			if (isClerkAPIResponseError(err)) {
				const first = err.errors?.[0];
				if (first?.message) message = first.message;
			} else if (err instanceof Error) {
				message = err.message;
			}
			setAlertModal({
				visible: true,
				title: 'Verification failed',
				message,
				variant: 'danger',
			});
		} finally {
			setSubmitting(false);
		}
	};

	const loading = submitting || !isLoaded;
	const blockInputs = loading || googleLoading;

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className='flex-1'
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
			>
				<ScrollView
					contentContainerClassName='flex-grow justify-center px-5 py-8'
					keyboardShouldPersistTaps='handled'
				>
					<View className='items-center mb-8'>
						<Image
							source={require('@/assets/logos/XTFG_icon_1024.png')}
							style={{ width: 200, height: 100 }}
							contentFit='contain'
						/>
					</View>
					<Text className='text-lg text-text-secondary mb-6 text-center'>
						Sign in
					</Text>

					<View className='gap-4' pointerEvents={blockInputs ? 'none' : 'auto'}>
						<GradientButton
							variant='secondary'
							onPress={() => void handleGoogle()}
							loading={googleLoading}
							disabled={blockInputs}
						>
							<View className='flex-row items-center justify-center gap-2 py-0.5'>
								<MaterialCommunityIcons name='google' size={22} color='#fff' />
								<Text className='text-white text-base font-semibold'>
									Continue with Google
								</Text>
							</View>
						</GradientButton>

						<View className='flex-row items-center my-2'>
							<View className='flex-1 h-px bg-[#3A3A3C]' />
							<Text className='mx-3 text-text-secondary text-sm'>or</Text>
							<View className='flex-1 h-px bg-[#3A3A3C]' />
						</View>

						{step === 'email' ? (
							<>
								<Text className='text-sm text-text-secondary text-center mb-1'>
									Continue with email (we&apos;ll send you a code)
								</Text>
								<Input
									label='Email'
									placeholder='Enter your email'
									value={email}
									onChangeText={(text) => {
										setEmail(text);
										setEmailError('');
									}}
									keyboardType='email-address'
									autoCapitalize='none'
									autoComplete='email'
									error={emailError}
									editable={!blockInputs}
								/>
								<GradientButton
									onPress={() => void handleSendSignInCode()}
									loading={loading}
									className='mt-2.5'
									disabled={blockInputs}
								>
									{loading ? 'Please wait…' : 'Send sign-in code'}
								</GradientButton>
							</>
						) : (
							<>
								<TouchableOpacity
									onPress={() => {
										setStep('email');
										setLoginCode('');
									}}
									disabled={blockInputs}
									className='self-start mb-2'
								>
									<Text className='text-[#F9C513] font-semibold text-base'>
										← Change email
									</Text>
								</TouchableOpacity>
								<Text className='text-sm text-text-secondary text-center mb-2'>
									Enter the code we sent to {email.trim()}
								</Text>
								<Input
									label='Verification code'
									placeholder='6-digit code'
									value={loginCode}
									onChangeText={(text) =>
										setLoginCode(text.replace(/\D/g, '').slice(0, 6))
									}
									keyboardType='number-pad'
									editable={!blockInputs}
								/>
								<GradientButton
									onPress={() => void handleVerifySignInCode()}
									loading={loading}
									className='mt-2.5'
									disabled={blockInputs}
								>
									{loading ? 'Please wait…' : 'Verify and continue'}
								</GradientButton>
							</>
						)}

						<View className='mt-6 flex-row justify-center items-center'>
							<Text className='text-text-secondary mr-2'>
								Don&apos;t have an account yet?
							</Text>
							<TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
								<Text className='text-[#F9C513] font-semibold'>Sign up</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{googleLoading && (
				<View className='absolute inset-0 z-50' pointerEvents='auto'>
					<AuthProcessingScreen />
				</View>
			)}

			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
				confirmLabel='OK'
				onConfirm={() => setAlertModal((p) => ({ ...p, visible: false }))}
				onCancel={() => setAlertModal((p) => ({ ...p, visible: false }))}
				hideCancel
			/>
		</FixedView>
	);
};

export default Login;
