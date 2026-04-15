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
import { getPostRegistrationHref } from '@/lib/post-auth-navigation';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { clearAuthFlowIntent } from '@/utils/auth-flow';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import { storage } from '@/utils/storage';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation } from '@apollo/client/react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from 'react-native';

/** Finishes Mongo member row when Clerk is signed in but `me` is null. */
export default function CompleteRegistration() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { user: clerkUser } = useUser();
	const { getToken, signOut } = useAuth();
	const [firstName, setFirstName] = useState('');
	const [middleName, setMiddleName] = useState('');
	const [lastName, setLastName] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const clerkEmail =
		clerkUser?.primaryEmailAddress?.emailAddress ||
		clerkUser?.emailAddresses?.[0]?.emailAddress ||
		'';
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });
	const redirectToLoginAfterAlert = useRef(false);
	const signOutAfterAlert = useRef(false);

	const [createUser, { loading }] = useMutation<
		CreateUserMutation,
		CreateUserMutationVariables
	>(CREATE_USER_MUTATION);

	useEffect(() => {
		if (!clerkUser) return;
		if (clerkUser.firstName) setFirstName(clerkUser.firstName);
		if (clerkUser.lastName) setLastName(clerkUser.lastName);
	}, [clerkUser]);

	const submit = async () => {
		const ne: Record<string, string> = {};
		if (!firstName.trim()) ne.firstName = 'Required';
		if (!lastName.trim()) ne.lastName = 'Required';
		if (!clerkEmail.trim()) ne.email = 'Your sign-in account has no email';
		setErrors(ne);
		if (Object.keys(ne).length > 0) return;

		try {
			const t = await getToken();
			if (t) await storage.setItem('auth_token', t);

			const result = await createUser({
				variables: {
					input: {
						firstName: firstName.trim(),
						middleName: middleName.trim() || undefined,
						lastName: lastName.trim(),
						email: clerkEmail.trim(),
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
				await clearAuthFlowIntent();
				router.replace(getPostRegistrationHref(user));
			}
		} catch (err: unknown) {
			let message = 'Could not create your gym profile.';
			if (err instanceof Error) message = err.message;
			const alreadyExists = /user with this email already exists/i.test(message);
			if (alreadyExists) {
				await storage.removeItem('auth_token');
				await clearAuthFlowIntent();
				redirectToLoginAfterAlert.current = true;
				signOutAfterAlert.current = true;
				setAlertModal({
					visible: true,
					title: 'Account already exists',
					message:
						'This email already has a gym profile. Please log in instead of signing up.',
					variant: 'neutral',
				});
				return;
			}
			setAlertModal({
				visible: true,
				title: 'Error',
				message,
				variant: 'danger',
			});
		}
	};

	if (!clerkUser) {
		return (
			<FixedView className='flex-1 bg-bg-darker justify-center items-center px-6'>
				<Text className='text-text-secondary text-center'>Loading…</Text>
			</FixedView>
		);
	}

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className='flex-1'
			>
				<ScrollView
					contentContainerClassName='flex-grow justify-center px-5 py-8'
					keyboardShouldPersistTaps='handled'
				>
					<View className='items-center mb-6'>
						<Image
							// eslint-disable-next-line @typescript-eslint/no-require-imports
							source={require('@/assets/logos/XTFG_icon_1024.png')}
							style={{ width: 200, height: 100 }}
							contentFit='contain'
						/>
					</View>
					<Text className='text-lg text-text-secondary mb-6 text-center'>
						Complete your gym profile
					</Text>

					<View className='gap-4'>
						<Input
							label='First name'
							value={firstName}
							onChangeText={(t) => {
								setFirstName(t);
								setErrors({ ...errors, firstName: '' });
							}}
							error={errors.firstName}
							editable={!loading}
						/>
						<Input
							label='Middle name (optional)'
							value={middleName}
							onChangeText={setMiddleName}
							editable={!loading}
						/>
						<Input
							label='Last name'
							value={lastName}
							onChangeText={(t) => {
								setLastName(t);
								setErrors({ ...errors, lastName: '' });
							}}
							error={errors.lastName}
							editable={!loading}
						/>
						<Input
							label='Email (from your sign-in)'
							value={clerkEmail}
							keyboardType='email-address'
							autoCapitalize='none'
							error={errors.email}
							editable={false}
						/>
						<GradientButton onPress={() => void submit()} loading={loading} disabled={loading}>
							{loading ? 'Saving…' : 'Create gym profile'}
						</GradientButton>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
				confirmLabel='OK'
				onConfirm={() => {
					setAlertModal((p) => ({ ...p, visible: false }));
					if (redirectToLoginAfterAlert.current) {
						redirectToLoginAfterAlert.current = false;
						const doSignOut = signOutAfterAlert.current;
						signOutAfterAlert.current = false;
						void (async () => {
							if (doSignOut) {
								try {
									await signOut();
								} catch {
									// Continue redirect flow even if Clerk sign-out fails.
								}
							}
							router.replace('/(auth)/login');
						})();
					}
				}}
				onCancel={() => {
					setAlertModal((p) => ({ ...p, visible: false }));
					if (redirectToLoginAfterAlert.current) {
						redirectToLoginAfterAlert.current = false;
						const doSignOut = signOutAfterAlert.current;
						signOutAfterAlert.current = false;
						void (async () => {
							if (doSignOut) {
								try {
									await signOut();
								} catch {
									// Continue redirect flow even if Clerk sign-out fails.
								}
							}
							router.replace('/(auth)/login');
						})();
					}
				}}
				hideCancel
			/>
		</FixedView>
	);
}
