import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import Input from '@/components/Input';
import {
	CreateUserMutation,
	CreateUserMutationVariables,
	RoleType,
} from '@/graphql/generated/types';
import { CREATE_USER_MUTATION } from '@/graphql/mutations';
import { getClerkOAuthRedirectUrl } from '@/lib/clerk-oauth-redirect';
import { randomClerkPassword } from '@/lib/clerk-random-password';
import { getPostRegistrationHref, replaceToAppRoot } from '@/lib/post-auth-navigation';
import { isSessionAlreadyActiveError, setActiveIgnoringSessionConflict } from '@/lib/clerk-session-errors';
import { storeTokenAfterClerkSession } from '@/lib/clerk-sso';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import { setAuthFlowIntent } from '@/utils/auth-flow';
import { storage } from '@/utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client/react';
import {
	isClerkAPIResponseError,
	useAuth,
	useSignUp,
	useSSO,
} from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'form' | 'verify';

const SignUp = () => {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const dispatch = useAppDispatch();
	const { isLoaded, signUp, setActive } = useSignUp();
	const { getToken } = useAuth();
	const { startSSOFlow } = useSSO();
	const [showEmailSignUp, setShowEmailSignUp] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [step, setStep] = useState<Step>('form');
	const [code, setCode] = useState('');
	const [firstName, setFirstName] = useState('');
	const [middleName, setMiddleName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });
	const emailFormExpanded = showEmailSignUp;
	const scrollContentBottomPad = Math.max(insets.bottom + 12, 24);

	const [createUser, { loading: creatingUser }] = useMutation<
		CreateUserMutation,
		CreateUserMutationVariables
	>(CREATE_USER_MUTATION);

	useEffect(() => {
		void setAuthFlowIntent('signup');
	}, []);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!firstName.trim()) {
			newErrors.firstName = 'First name is required';
		}
		if (!lastName.trim()) {
			newErrors.lastName = 'Last name is required';
		}
		if (!email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = 'Please enter a valid email';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const finishAndCreateMongoUser = async () => {
		const t = await getToken();
		if (t) await storage.setItem('auth_token', t);

		const result = await createUser({
			variables: {
				input: {
					firstName: firstName.trim(),
					middleName: middleName.trim() || undefined,
					lastName: lastName.trim(),
					email: email.trim(),
					role: 'member' as RoleType,
				},
			},
		});

		if (result.data?.createUser) {
			const user = convertGraphQLUser(result.data.createUser.user);
			dispatch(setUser(user));
			if (result.data.createUser.token) {
				await storage.setItem('auth_token', result.data.createUser.token);
			}
			router.replace(getPostRegistrationHref(user));
		}
	};

	const tryActivateSignUp = async (
		status: string | null | undefined,
		createdSessionId: string | null | undefined,
	): Promise<boolean> => {
		if (status !== 'complete' || !createdSessionId) return false;
		await setActiveIgnoringSessionConflict(setActive, createdSessionId);
		await finishAndCreateMongoUser();
		return true;
	};

	const handleStartSignUp = async () => {
		if (!isLoaded || !signUp) return;
		if (!validateForm()) return;

		try {
			let res = await signUp.create({
				emailAddress: email.trim(),
				firstName: firstName.trim(),
				lastName: lastName.trim(),
			});

			if (await tryActivateSignUp(res.status, res.createdSessionId)) return;

			try {
				if (res.missingFields?.includes('password')) {
					res = await signUp.update({ password: await randomClerkPassword() });
				}
			} catch {
				// Password may only be accepted after email verification on some instances.
			}

			if (await tryActivateSignUp(res.status, res.createdSessionId)) return;

			await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
			setStep('verify');
		} catch (err: unknown) {
			let message = 'Something went wrong. Please try again.';
			if (isClerkAPIResponseError(err)) {
				const first = err.errors?.[0];
				if (first?.message) message = first.message;
			} else if (err instanceof Error) {
				message = err.message;
			}
			setAlertModal({
				visible: true,
				title: 'Sign Up Failed',
				message,
				variant: 'danger',
			});
		}
	};

	const clerkErrText = (err: unknown) => {
		if (isClerkAPIResponseError(err)) {
			return (
				err.errors?.map((e) => `${e.message ?? ''} ${(e as { longMessage?: string }).longMessage ?? ''}`).join(' ') ?? ''
			);
		}
		if (err instanceof Error) return err.message;
		return String(err);
	};

	const handleVerifyCode = async () => {
		if (!isLoaded || !signUp) return;
		const trimmed = code.trim();
		const normalizedCode = trimmed.replace(/\D/g, '');
		if (!trimmed) {
			setAlertModal({
				visible: true,
				title: 'Code required',
				message: 'Enter the verification code from your email.',
				variant: 'danger',
			});
			return;
		}
		if (normalizedCode.length !== 6) {
			setAlertModal({
				visible: true,
				title: 'Invalid code',
				message: 'Enter all 6 digits from the email.',
				variant: 'danger',
			});
			return;
		}

		const recoverAfterVerifiedError = async (): Promise<boolean> => {
			try {
				if (signUp.missingFields?.includes('password')) {
					await signUp.update({ password: await randomClerkPassword() });
				}
				if (await tryActivateSignUp(signUp.status, signUp.createdSessionId)) return true;
			} catch {
				/* noop */
			}
			return false;
		};

		setVerifying(true);
		try {
			let res: Awaited<ReturnType<typeof signUp.attemptEmailAddressVerification>>;
			try {
				res = await signUp.attemptEmailAddressVerification({ code: trimmed });
			} catch (attemptErr: unknown) {
				if (isSessionAlreadyActiveError(attemptErr)) {
					if (await recoverAfterVerifiedError()) return;
					try {
						await finishAndCreateMongoUser();
					} catch {
						/* e.g. user already created */
					}
					return;
				}
				throw attemptErr;
			}

			if (await tryActivateSignUp(res.status, res.createdSessionId)) return;

			if (res.missingFields?.includes('password')) {
				res = await signUp.update({ password: await randomClerkPassword() });
			}
			if (await tryActivateSignUp(res.status, res.createdSessionId)) return;

			await new Promise((r) => setTimeout(r, 100));
			if (await tryActivateSignUp(signUp.status, signUp.createdSessionId)) return;

			setAlertModal({
				visible: true,
				title: 'Verification',
				message: 'Could not start your session. Try again, or go back and request a new code.',
				variant: 'danger',
			});
		} catch (err: unknown) {
			if (isSessionAlreadyActiveError(err)) {
				try {
					if (await recoverAfterVerifiedError()) return;
					try {
						await finishAndCreateMongoUser();
					} catch {
						/* noop */
					}
				} catch {
					/* noop */
				}
				return;
			}

			const blob = clerkErrText(err).toLowerCase();
			const looksAlreadyVerified =
				(blob.includes('already') && blob.includes('verif')) || blob.includes('already verified');

			if (looksAlreadyVerified && (await recoverAfterVerifiedError())) return;

			let message = clerkErrText(err) || 'Invalid or expired code.';
			if (!looksAlreadyVerified && isClerkAPIResponseError(err)) {
				const first = err.errors?.[0];
				if (first?.message) message = first.message;
			}
			setAlertModal({
				visible: true,
				title: 'Verification Failed',
				message,
				variant: 'danger',
			});
		} finally {
			setVerifying(false);
		}
	};

	const handleGoogleSignUp = async () => {
		if (!isLoaded || googleLoading) return;
		setGoogleLoading(true);
		try {
			const { createdSessionId, setActive: sa } = await startSSOFlow({
				strategy: 'oauth_google',
				redirectUrl: getClerkOAuthRedirectUrl(),
			});
			const ok = await storeTokenAfterClerkSession(createdSessionId ?? undefined, sa, getToken);
			if (ok) {
				await setAuthFlowIntent('signup');
				replaceToAppRoot();
				return;
			}
		} catch (err: unknown) {
			let message = 'Google sign-up failed. Try again.';
			if (isClerkAPIResponseError(err)) {
				const first = err.errors?.[0];
				if (first?.message) message = first.message;
			} else if (err instanceof Error) {
				message = err.message;
			}
			setAlertModal({
				visible: true,
				title: 'Sign-up failed',
				message,
				variant: 'danger',
			});
		} finally {
			setGoogleLoading(false);
		}
	};

	const loading = !isLoaded || creatingUser;
	const blockInputs = loading || googleLoading || verifying;

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<ScrollView
				automaticallyAdjustKeyboardInsets
				contentContainerClassName={
					emailFormExpanded
						? 'flex-grow px-5 pt-4 pb-2'
						: 'flex-grow justify-center px-5 py-8'
				}
				contentContainerStyle={{ paddingBottom: scrollContentBottomPad }}
				contentInsetAdjustmentBehavior='automatic'
				keyboardShouldPersistTaps='handled'
				keyboardDismissMode={
					Platform.OS === 'ios' ? 'interactive' : 'on-drag'
				}
				showsVerticalScrollIndicator={false}
				scrollEnabled={!blockInputs}
			>
					<View className='items-center mb-6'>
						<Image
							source={require('@/assets/logos/XTFG_icon_1024.png')}
							style={{ width: 200, height: 100 }}
							contentFit='contain'
						/>
					</View>

					{step === 'form' ? (
						<>
							<Text className='text-lg text-text-secondary mb-6 text-center'>
								Create your account
							</Text>
							{!showEmailSignUp ? (
								<View className='gap-4'>
									<GradientButton
										variant='secondary'
										onPress={() => void handleGoogleSignUp()}
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
									<GradientButton
										variant='secondary'
										onPress={() => setShowEmailSignUp(true)}
										disabled={blockInputs}
									>
										Continue with email
									</GradientButton>
								</View>
							) : (
								<View className='gap-4' pointerEvents={blockInputs ? 'none' : 'auto'}>
									<TouchableOpacity
										onPress={() => setShowEmailSignUp(false)}
										disabled={blockInputs}
										className='self-start mb-2'
									>
										<Text className='text-[#F9C513] font-semibold text-base'>
											← Back
										</Text>
									</TouchableOpacity>
									<Text className='text-sm text-text-secondary mb-2 text-center'>
										We&apos;ll email you a code to verify this address (no password).
									</Text>
									<Input
										label='First Name'
										placeholder='Enter your first name'
										value={firstName}
										onChangeText={(text) => {
											setFirstName(text);
											setErrors({ ...errors, firstName: '' });
										}}
										autoCapitalize='words'
										error={errors.firstName}
										editable={!blockInputs}
									/>
									<Input
										label='Middle Name'
										placeholder='Enter your middle name (optional)'
										value={middleName}
										onChangeText={setMiddleName}
										autoCapitalize='words'
										editable={!blockInputs}
									/>
									<Input
										label='Last Name'
										placeholder='Enter your last name'
										value={lastName}
										onChangeText={(text) => {
											setLastName(text);
											setErrors({ ...errors, lastName: '' });
										}}
										autoCapitalize='words'
										error={errors.lastName}
										editable={!blockInputs}
									/>
									<Input
										label='Email'
										placeholder='Enter your email'
										value={email}
										onChangeText={(text) => {
											setEmail(text);
											setErrors({ ...errors, email: '' });
										}}
										keyboardType='email-address'
										autoCapitalize='none'
										autoComplete='email'
										error={errors.email}
										editable={!blockInputs}
									/>
									<GradientButton
										onPress={() => void handleStartSignUp()}
										loading={loading}
										className='mt-2.5'
										disabled={blockInputs}
									>
										{loading ? 'Loading...' : 'Send verification code'}
									</GradientButton>
								</View>
							)}
						</>
					) : (
						<>
							<Text className='text-lg text-text-secondary mb-3 text-center'>
								Check your email
							</Text>
							<Text className='text-sm text-text-secondary mb-8 text-center px-1'>
								Enter the code from your email to verify and continue.
							</Text>
							<View className='gap-4'>
								<Input
									label='Verification code'
									placeholder='6-digit code'
									value={code}
									onChangeText={(text) =>
										setCode(text.replace(/\D/g, '').slice(0, 6))
									}
									keyboardType='number-pad'
									editable={!creatingUser && !verifying}
								/>
								<GradientButton
									onPress={() => void handleVerifyCode()}
									loading={creatingUser || verifying}
									disabled={creatingUser || verifying}
								>
									{creatingUser || verifying
										? 'Please wait…'
										: 'Verify & create gym profile'}
								</GradientButton>
							</View>
						</>
					)}

					<View className='mt-6 flex-row flex-wrap justify-center items-center px-2'>
						<Text className='text-text-secondary mr-2 text-center shrink'>
							Already have an account?
						</Text>
						<TouchableOpacity onPress={() => router.push('/(auth)/login')}>
							<Text className='text-[#F9C513] font-semibold'>Log in</Text>
						</TouchableOpacity>
					</View>
			</ScrollView>
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

export default SignUp;
