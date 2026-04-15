import CameraCapture from '@/components/CameraCapture';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import GradientButton from '@/components/GradientButton';
import {
	GuardianLiabilitySection,
	LEGAL_GUARDIAN_VALUE,
	type GuardianFormErrors,
	validateGuardianFields,
} from '@/components/GuardianLiabilitySection';
import {
	isDrawnSignature,
	WaiverSignaturePad,
} from '@/components/WaiverSignaturePad';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { normalizePhysiqueGoalTypeForApi } from '@/constants/onboarding-options';
import { SYNC_MY_WALK_IN_PROFILE_MUTATION, UPDATE_USER_MUTATION } from '@/graphql/mutations';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { convertGraphQLUser } from '@/utils/graphql-utils';
import { isMinorAt } from '@/utils/age-waiver';
import { memberHasActiveGymMembership } from '@/utils/memberMembership';
import { uploadImageToCloudinary } from '@/utils/cloudinary-upload';
import { uploadSignatureDataUriToCloudinary } from '@/utils/signatures-cloudinary';
import { storage } from '@/utils/storage';
import { verifyGuardianIdImage } from '@/utils/verify-guardian-id-image';
import {
	validateMinorDrawnSignature,
	validateMinorPrintedNameMatchesAccount,
} from '@/utils/waiver-minor-identity';
import { useApolloClient, useMutation } from '@apollo/client/react';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
	Keyboard,
	Modal,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

// Note: UpdateUserMutation types may need to be regenerated
// Using any for now until GraphQL codegen is run
type UpdateUserMutation = any;
type UpdateUserMutationVariables = any;

const Fourth = () => {
	const router = useRouter();
	const apolloClient = useApolloClient();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.user);
	const { data, updateData, clearData } = useOnboarding();

	const isMinor = useMemo(
		() => !!(data.dateOfBirth && isMinorAt(data.dateOfBirth)),
		[data.dateOfBirth]
	);
	const isPreMembershipFlow = !data.membershipIntent;

	const [agreedToTermsAndConditions, setAgreedToTermsAndConditions] = useState(
		data.agreedToTermsAndConditions || false
	);
	const [waiverAccepted, setWaiverAccepted] = useState(false);
	const [memberWaiverSigUri, setMemberWaiverSigUri] = useState('');
	const [guardianFullName, setGuardianFullName] = useState('');
	const [guardianRelationship, setGuardianRelationship] = useState('');
	const [legalGuardianKind, setLegalGuardianKind] = useState('');
	/** Drawn guardian signature (data URL) when member is a minor */
	const [guardianSignature, setGuardianSignature] = useState('');
	const [guardianAcknowledged, setGuardianAcknowledged] = useState(false);
	const [guardianIdVerificationPhotoUrl, setGuardianIdVerificationPhotoUrl] = useState('');
	const [showGuardianIdCamera, setShowGuardianIdCamera] = useState(false);
	const [idPhotoUploading, setIdPhotoUploading] = useState(false);
	const [minorWaiverPrintedName, setMinorWaiverPrintedName] = useState('');
	const [guardianErrors, setGuardianErrors] = useState<GuardianFormErrors>({});
	const [showTermsModal, setShowTermsModal] = useState(false);
	const [showWaiverModal, setShowWaiverModal] = useState(false);
	/** Prevents parent scroll from eating WebView touches while signing */
	const [waiverScrollLocked, setWaiverScrollLocked] = useState(false);
	const minorWaiverNameRef = useRef<TextInput>(null);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success' | 'warning';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });
	const [updateUser, { loading }] = useMutation<
		UpdateUserMutation,
		UpdateUserMutationVariables
	>(UPDATE_USER_MUTATION, {
		onCompleted: (mutationData) => {
			const updatedUser = convertGraphQLUser(mutationData.updateUser);
			dispatch(setUser(updatedUser));
			if (isPreMembershipFlow) {
				updateData({
					agreedToTermsAndConditions,
					termsWaiverCompletedPreMembership: true,
				});
				router.replace('/(auth)/(onboarding)/third');
				return;
			}
			const intent = data.membershipIntent;
			clearData();
			const welcome =
				intent === 'skip'
					? 'limited'
					: intent === 'avail_counter'
						? 'counter'
						: 'active';
			// sana naman wag kana magloko
			// sana naman wag kana magloko
			void storage.setItem('onboarding_welcome', welcome);
			// sana naman wag kana magloko
			if (
				updatedUser.role === 'member' &&
				!memberHasActiveGymMembership(updatedUser)
			) {
				void apolloClient
					.mutate({ mutation: SYNC_MY_WALK_IN_PROFILE_MUTATION })
					.catch(() => {
						/* non-fatal; MemberWalkInBanner will retry */
					});
			}
		},
		onError: (error) => {
			setAlertModal({
				visible: true,
				title: 'Error',
				message: error.message || 'Failed to complete onboarding. Please try again.',
				variant: 'danger',
			});
		},
	});

	const handleGuardianIdPhotoCapture = async (uri: string) => {
		setShowGuardianIdCamera(false);
		setIdPhotoUploading(true);
		try {
			const manipulated = await ImageManipulator.manipulateAsync(
				uri,
				[{ resize: { width: 1200 } }],
				{ compress: 0.55, format: ImageManipulator.SaveFormat.JPEG }
			);
			const url = await uploadImageToCloudinary(manipulated.uri, {
				folder: 'XTrimFitGym/guardian-id-verification',
				fileName: 'guardian-id.jpg',
			});
			const verification = await verifyGuardianIdImage(url);
			if (!verification.verified) {
				setAlertModal({
					visible: true,
					title: 'ID photo check',
					message:
						verification.message ||
						verification.error ||
						'Could not verify the photo. Align the ID in the on-screen frame and try again.',
					variant: 'warning',
				});
				return;
			}
			setGuardianIdVerificationPhotoUrl(url);
			setGuardianErrors((e) => ({ ...e, guardianIdPhoto: undefined }));
		} catch (e: unknown) {
			setAlertModal({
				visible: true,
				title: 'Upload failed',
				message: (e as Error)?.message || 'Could not upload ID photo. Try again.',
				variant: 'danger',
			});
		} finally {
			setIdPhotoUploading(false);
		}
	};

	const openWaiverModal = () => {
		setWaiverAccepted(false);
		setShowWaiverModal(true);
	};

	const confirmWaiverInModal = () => {
		setGuardianErrors({});
		if (!isMinor) {
			if (!isDrawnSignature(memberWaiverSigUri)) {
				setAlertModal({
					visible: true,
					title: 'Signature required',
					message: 'Sign at the bottom of the waiver before accepting.',
					variant: 'warning',
				});
				return;
			}
		} else {
			const nameErr = validateMinorPrintedNameMatchesAccount(minorWaiverPrintedName, {
				firstName: user?.firstName,
				middleName: user?.middleName,
				lastName: user?.lastName,
			});
			const sigErr = validateMinorDrawnSignature(memberWaiverSigUri);
			const minorErrs: GuardianFormErrors = {};
			if (nameErr) minorErrs.minorMemberPrintedName = nameErr;
			if (sigErr) minorErrs.minorMemberSignature = sigErr;
			if (Object.keys(minorErrs).length > 0) {
				setGuardianErrors((e) => ({ ...e, ...minorErrs }));
				setAlertModal({
					visible: true,
					title: 'Minor identification',
					message:
						'Type your full legal name exactly as on your account, then sign in the member signature box.',
					variant: 'warning',
				});
				return;
			}
			const ge = validateGuardianFields(
				guardianFullName,
				guardianRelationship,
				guardianSignature,
				guardianAcknowledged,
				'drawn',
				legalGuardianKind,
				{
					requireGuardianIdPhoto: true,
					guardianIdVerificationPhotoUrl,
				}
			);
			setGuardianErrors(ge);
			if (Object.keys(ge).length > 0) {
				setAlertModal({
					visible: true,
					title: 'Complete guardian section',
					message:
						'Enter the parent/guardian name and type, take the ID verification photo, add their signature, and check the confirmation box.',
					variant: 'warning',
				});
				return;
			}
		}
		setWaiverAccepted(true);
		setShowWaiverModal(false);
	};

	const handleComplete = async () => {
		if (!agreedToTermsAndConditions) {
			setAlertModal({
				visible: true,
				title: 'Required Agreement',
				message: 'Please agree to the terms and conditions to continue.',
				variant: 'warning',
			});
			return;
		}

		if (!waiverAccepted) {
			setAlertModal({
				visible: true,
				title: 'Liability waiver required',
				message:
					'Open the Liability Waiver, read it, and sign digitally at the bottom before continuing.',
				variant: 'warning',
			});
			return;
		}

		if (!isDrawnSignature(memberWaiverSigUri)) {
			setAlertModal({
				visible: true,
				title: 'Member signature required',
				message: 'Your waiver signature is missing. Open the waiver again and sign as the member.',
				variant: 'warning',
			});
			return;
		}

		let nextGuardianErrors: GuardianFormErrors = {};
		if (isMinor) {
			const nameErr = validateMinorPrintedNameMatchesAccount(minorWaiverPrintedName, {
				firstName: user?.firstName,
				middleName: user?.middleName,
				lastName: user?.lastName,
			});
			const sigErr = validateMinorDrawnSignature(memberWaiverSigUri);
			if (nameErr) nextGuardianErrors.minorMemberPrintedName = nameErr;
			if (sigErr) nextGuardianErrors.minorMemberSignature = sigErr;
			const ge = validateGuardianFields(
				guardianFullName,
				guardianRelationship,
				guardianSignature,
				guardianAcknowledged,
				'drawn',
				legalGuardianKind,
				{
					requireGuardianIdPhoto: true,
					guardianIdVerificationPhotoUrl,
				}
			);
			nextGuardianErrors = { ...nextGuardianErrors, ...ge };
			setGuardianErrors(nextGuardianErrors);
			if (Object.keys(nextGuardianErrors).length > 0) {
				setAlertModal({
					visible: true,
					title: 'Parent / guardian required',
					message:
						'Members under 18 need a parent or legal guardian to complete the liability consent below.',
					variant: 'warning',
				});
				return;
			}
		} else {
			setGuardianErrors({});
		}

		if (!user?.id) {
			setAlertModal({
				visible: true,
				title: 'Error',
				message: 'User not found. Please try signing up again.',
				variant: 'danger',
			});
			return;
		}

		let minorSigUrl: string | undefined;
		try {
			if (isMinor) {
				const v = await verifyGuardianIdImage(guardianIdVerificationPhotoUrl.trim());
				if (!v.verified) {
					setAlertModal({
						visible: true,
						title: 'Guardian ID photo',
						message: v.message || v.error || 'ID checks failed. Retake the photo.',
						variant: 'warning',
					});
					return;
				}
				minorSigUrl = await uploadSignatureDataUriToCloudinary(
					memberWaiverSigUri,
					'XTrimFitGym/minor-waiver-signatures'
				);
			}
		} catch (e: unknown) {
			setAlertModal({
				visible: true,
				title: 'Error',
				message: (e as Error)?.message || 'Could not prepare waiver files. Please try again.',
				variant: 'danger',
			});
			return;
		}

		// Update user with onboarding data and set hasEnteredDetails to true
		try {
			await updateUser({
				variables: {
					id: user.id,
					input: {
						phoneNumber: data.phoneNumber,
						dateOfBirth: data.dateOfBirth?.toISOString(),
						gender: data.gender,
						agreedToTermsAndConditions,
						agreedToLiabilityWaiver: waiverAccepted,
						...(isMinor && guardianIdVerificationPhotoUrl.trim()
							? { guardianIdVerificationPhotoUrl: guardianIdVerificationPhotoUrl.trim() }
							: {}),
						...(isMinor
							? {
									minorLiabilityWaiverPrintedName: minorWaiverPrintedName.trim(),
									minorLiabilityWaiverSignatureUrl: minorSigUrl,
								}
							: {}),
						membershipDetails: {
							physiqueGoalType: normalizePhysiqueGoalTypeForApi(
								data.physiqueGoalType
							),
							fitnessGoal: data.fitnessGoal || [],
							workOutTime: data.workOutTime || [],
							hasEnteredDetails: isPreMembershipFlow ? false : true,
						},
					},
				},
			});
		} catch {
			// GraphQL errors use mutation onError
		}
	};

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<ScrollView
				contentContainerClassName='flex-grow px-5 py-8'
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}
			>
				<Text className='text-text-secondary text-sm mb-4'>
					{isPreMembershipFlow ? 'Step 3 of 4' : 'Step 4 of 4'}
				</Text>
				<Text className='text-3xl font-bold mb-2 text-text-primary'>
					Terms & liability waiver
				</Text>
				<Text className='text-base text-text-secondary mb-8'>
					Agree to the Terms & Conditions, then open the Liability Waiver. Your date of birth
					determines whether you sign once as an adult or twice as a minor (you plus a
					parent/guardian).
				</Text>

				<View className='gap-6' pointerEvents={loading ? 'none' : 'auto'}>
					<Checkbox
						label={
							<Text className='text-text-primary text-base'>
								I agree to the{' '}
								<Text
									className='text-[#F9C513] underline'
									onPress={() => !loading && setShowTermsModal(true)}
								>
									Terms and Conditions
								</Text>
							</Text>
						}
						checked={agreedToTermsAndConditions}
						onChange={setAgreedToTermsAndConditions}
						disabled={loading}
					/>

					<View className='rounded-xl border border-[#F9C513]/25 bg-bg-primary p-4 gap-3'>
						<Text className='text-text-primary font-semibold text-base'>
							Liability waiver (digital signature required)
						</Text>
						<Text className='text-text-secondary text-sm leading-5'>
							{isMinor
								? 'Because you are under 18, the waiver includes two signatures: yours as the member, and your parent or legal guardian’s (with their name and guardian type). You cannot continue until both are captured.'
								: 'You must read the waiver and sign in the signature area at the bottom of that screen before continuing.'}
						</Text>
						{waiverAccepted ? (
							<View className='flex-row items-center gap-2 py-1'>
								<Ionicons name='checkmark-circle' size={22} color='#34d399' />
								<Text className='text-emerald-400 font-medium'>Waiver signed</Text>
							</View>
						) : null}
						<GradientButton
							onPress={() => !loading && openWaiverModal()}
							disabled={loading}
							variant={waiverAccepted ? 'secondary' : 'primary'}
						>
							{waiverAccepted ? 'Review / re-sign waiver' : 'Read & sign liability waiver'}
						</GradientButton>
					</View>

					<View className='flex-row gap-3 mt-4'>
						<GradientButton
							onPress={() => router.back()}
							className='flex-1'
							variant='secondary'
							disabled={loading}
						>
							Back
						</GradientButton>
						<GradientButton
							onPress={handleComplete}
							loading={loading}
							className='flex-1'
							disabled={loading || !waiverAccepted}
						>
							{loading
								? 'Loading...'
								: isPreMembershipFlow
									? 'Continue'
									: 'Complete'}
						</GradientButton>
					</View>
				</View>
			</ScrollView>

			{/* Terms and Conditions Modal */}
			<Modal
				visible={showTermsModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => setShowTermsModal(false)}
			>
				<View className='flex-1 bg-bg-darker'>
					{/* Header */}
					<View className='bg-bg-primary border-b border-bg-darker/30 px-5 py-4 flex-row items-center justify-between'>
						<View className='flex-row items-center'>
							<View className='bg-[#F9C513]/20 rounded-full p-2 border-2 border-[#F9C513]/30 mr-3'>
								<Ionicons name='document-text' size={24} color='#F9C513' />
							</View>
							<Text className='text-2xl font-bold text-text-primary'>
								Terms & Conditions
							</Text>
						</View>
						<TouchableOpacity
							onPress={() => setShowTermsModal(false)}
							className='bg-bg-darker rounded-full p-2'
						>
							<Ionicons name='close' size={24} color='#F9C513' />
						</TouchableOpacity>
					</View>

					{/* Content */}
					<ScrollView
						className='flex-1'
						contentContainerClassName='p-5'
						showsVerticalScrollIndicator={true}
					>
						<View>
							{/* 1. Membership Eligibility */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									1. Membership Eligibility
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									Participants must be 18 years old and above. Anyone below 18 must present{' '}
									<Text className='font-semibold text-text-primary'>
										written parental or guardian consent
									</Text>{' '}
									before using the facilities.
								</Text>
							</View>

							{/* 2. Health and Safety */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									2. Health and Safety
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									Members must ensure they are physically fit before joining any gym activity. The gym is not responsible for injuries resulting from improper equipment use or failure to follow instructions.
								</Text>
							</View>

							{/* 3. Conduct and Behavior */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									3. Conduct and Behavior
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									Members must behave respectfully toward staff and other users. Harassment, threats, or destructive behavior may result in suspension or termination of membership.
								</Text>
							</View>

							{/* 4. Equipment Use */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									4. Equipment Use
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									All equipment must be used properly and returned after use. Members must report any damaged or malfunctioning equipment.
								</Text>
							</View>

							{/* 5. Personal Belongings */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									5. Personal Belongings
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									The gym is not liable for lost, stolen, or damaged personal items. Members are encouraged to use lockers for safekeeping.
								</Text>
							</View>

							{/* 6. Cleanliness and Hygiene */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									6. Cleanliness and Hygiene
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									Members must wipe down equipment after use and dispose of trash properly. Proper gym attire and footwear are required.
								</Text>
							</View>

							{/* 7. Payments and Membership */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									7. Payments and Membership
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									All membership fees are non-refundable unless otherwise stated. Failure to settle payments may result in restricted access or account freeze.
								</Text>
							</View>

							{/* 8. Class and Facility Rules */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									8. Class and Facility Rules
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									Members must follow schedules, class rules, and staff instructions to ensure safety and order.
								</Text>
							</View>

							{/* 9. Liability Waiver */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									9. Liability Waiver
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									By accessing the gym, members acknowledge that physical activity carries risks. You
									must also read and accept the separate{' '}
									<Text className='font-semibold text-text-primary'>Liability Waiver</Text> on
									this step (including release of claims for accidents and injuries). Minors
									require a parent/guardian to complete that waiver with their full name, guardian
									type, and digital signature.
								</Text>
							</View>

							{/* 10. Changes to Terms */}
							<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-4'>
								<Text className='text-[#F9C513] font-bold text-lg mb-2'>
									10. Changes to Terms
								</Text>
								<Text className='text-text-secondary text-sm leading-5'>
									The gym reserves the right to modify these Terms and Conditions at any time. Members will be informed of significant updates.
								</Text>
							</View>
						</View>
					</ScrollView>

					{/* Footer */}
					<View className='bg-bg-primary border-t border-bg-darker/30 px-5 py-4'>
						<GradientButton
							onPress={() => setShowTermsModal(false)}
							style={{ height: 56 }}
						>
							I Understand
						</GradientButton>
					</View>
				</View>
			</Modal>

			{/* Liability Waiver (separate from Terms & Conditions) */}
			<Modal
				visible={showWaiverModal}
				animationType='slide'
				transparent={false}
				onRequestClose={() => setShowWaiverModal(false)}
			>
				<View className='flex-1 bg-bg-darker'>
					<View className='bg-bg-primary border-b border-bg-darker/30 px-5 py-4 flex-row items-center justify-between'>
						<View className='flex-row items-center'>
							<View className='bg-[#F9C513]/20 rounded-full p-2 border-2 border-[#F9C513]/30 mr-3'>
								<Ionicons name='shield-checkmark' size={24} color='#F9C513' />
							</View>
							<Text className='text-2xl font-bold text-text-primary'>
								Liability Waiver
							</Text>
						</View>
						<TouchableOpacity
							onPress={() => setShowWaiverModal(false)}
							className='bg-bg-darker rounded-full p-2'
						>
							<Ionicons name='close' size={24} color='#F9C513' />
						</TouchableOpacity>
					</View>

					<GHScrollView
						className='flex-1'
						contentContainerClassName='p-5 pb-12'
						keyboardShouldPersistTaps='never'
						keyboardDismissMode='on-drag'
						showsVerticalScrollIndicator
						nestedScrollEnabled
						scrollEnabled={!waiverScrollLocked}
					>
						{isMinor ? (
						<Text className='text-text-secondary text-sm leading-5 mb-5'>
							Based on your birthdate you are under 18. This waiver requires{' '}
							<Text className='text-text-primary font-semibold'>two digital signatures</Text>: you
							as the member, and your parent or legal guardian. If they are a legal guardian, they
							will also describe what kind (e.g. court-appointed).
						</Text>
						) : (
							<Text className='text-text-secondary text-sm leading-5 mb-5'>
								Based on your birthdate you are signing as an adult member. Sign at the bottom to
								accept this waiver. You cannot continue without signing.
							</Text>
						)}

						<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
							<Text className='text-[#F9C513] font-bold text-lg mb-2'>
								1. Use of facilities at your own risk
							</Text>
							<Text className='text-text-secondary text-sm leading-5'>
								By using XTrimFit Gym&apos;s facilities, equipment, classes, and services, you
								acknowledge that physical exercise and gym activities involve inherent risks,
								including risk of injury, accident, or health issues.
							</Text>
						</View>

						<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
							<Text className='text-[#F9C513] font-bold text-lg mb-2'>
								2. Release of liability
							</Text>
							<Text className='text-text-secondary text-sm leading-5'>
								To the fullest extent permitted by law, you agree that the gym, its owners,
								employees, contractors, and representatives are{' '}
								<Text className='font-semibold text-text-primary'>
									not responsible or liable
								</Text>{' '}
								for any injury, accident, loss, or damage to person or property that occurs on
								the premises or in connection with gym activities, except where the law does not
								allow such limitations.
							</Text>
						</View>

						<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-6'>
							<Text className='text-[#F9C513] font-bold text-lg mb-2'>
								3. Minors (under 18)
							</Text>
							<Text className='text-text-secondary text-sm leading-5'>
								If the member is a minor, a parent or legal guardian must read this waiver, choose
								Mother, Father, or Legal guardian, provide their full name (and if Legal guardian,
								what kind), sign digitally, and confirm they accept on behalf of the minor before
								the minor may use the gym.
							</Text>
						</View>

						<View className='bg-bg-primary rounded-xl p-4 border border-[#F9C513]/20 mb-8'>
							<Text className='text-[#F9C513] font-bold text-lg mb-2'>
								4. Medical fitness
							</Text>
							<Text className='text-text-secondary text-sm leading-5'>
								You confirm that you are medically able to participate or that a guardian has made
								that determination for a minor. When in doubt, consult a physician before using the
								gym.
							</Text>
						</View>

						{isMinor ? (
							<View className='mb-6'>
								<Input
									ref={minorWaiverNameRef}
									label='Minor member — full legal name (must match your account)'
									placeholder={`${user?.firstName || ''} ${user?.middleName || ''} ${user?.lastName || ''}`
										.replace(/\s+/g, ' ')
										.trim()}
									value={minorWaiverPrintedName}
									onChangeText={(v) => {
										setMinorWaiverPrintedName(v);
										setGuardianErrors((e) => ({ ...e, minorMemberPrintedName: undefined }));
									}}
									editable={!loading}
									autoCapitalize='words'
									returnKeyType='done'
									blurOnSubmit
									onSubmitEditing={() => {
										void Keyboard.dismiss();
										minorWaiverNameRef.current?.blur();
									}}
									error={guardianErrors.minorMemberPrintedName}
								/>
							</View>
						) : null}

						<View
							className='border-t border-[#F9C513]/25 pt-6'
							style={{ zIndex: 1, elevation: 6 }}
						>
							{isMinor ? (
								<TouchableOpacity
									activeOpacity={0.7}
									onPress={() => {
										void Keyboard.dismiss();
										minorWaiverNameRef.current?.blur();
									}}
									className='mb-3 self-start'
								>
									<Text className='text-[#F9C513] text-sm font-semibold'>
										Done typing your name? Tap here to hide the keyboard, then sign below.
									</Text>
								</TouchableOpacity>
							) : null}
							<WaiverSignaturePad
								label={isMinor ? 'Member (minor) signature' : 'Member signature'}
								hint={
									isMinor
										? 'Sign exactly as the minor member. Your parent/guardian completes their section below.'
										: 'Draw your signature with your finger or stylus. This is required to continue.'
								}
								value={memberWaiverSigUri}
								onChange={(v) => {
									setMemberWaiverSigUri(v);
									setGuardianErrors((e) => ({ ...e, minorMemberSignature: undefined }));
								}}
								onDrawingChange={setWaiverScrollLocked}
								disabled={loading}
								height={isMinor ? 190 : 220}
							/>
							{isMinor && guardianErrors.minorMemberSignature ? (
								<Text className='text-red-400 text-sm mt-2'>
									{guardianErrors.minorMemberSignature}
								</Text>
							) : null}
						</View>

						{isMinor ? (
							<View className='mt-10'>
								<GuardianLiabilitySection
									omitSignatureInput
									requireGuardianIdPhoto
									guardianIdVerificationPhotoUrl={
										guardianIdVerificationPhotoUrl || null
									}
									onPressCaptureGuardianId={() => setShowGuardianIdCamera(true)}
									idPhotoUploading={idPhotoUploading}
									renderBeforeAcknowledgment={
										<View className='mt-6'>
											<WaiverSignaturePad
												label='Parent / legal guardian signature'
												hint='The adult named above signs here on behalf of the minor member.'
												value={guardianSignature}
												onChange={(v) => {
													setGuardianSignature(v);
													setGuardianErrors((e) => ({
														...e,
														guardianSignature: undefined,
													}));
												}}
												onDrawingChange={setWaiverScrollLocked}
												disabled={loading}
												height={200}
											/>
										</View>
									}
									guardianFullName={guardianFullName}
									onChangeGuardianFullName={(v) => {
										setGuardianFullName(v);
										setGuardianErrors((e) => ({ ...e, guardianFullName: undefined }));
									}}
									guardianRelationship={guardianRelationship}
									onChangeGuardianRelationship={(v) => {
										setGuardianRelationship(v);
										if (v !== LEGAL_GUARDIAN_VALUE) {
											setLegalGuardianKind('');
										}
										setGuardianErrors((e) => ({
											...e,
											guardianRelationship: undefined,
											legalGuardianKind: undefined,
										}));
									}}
									legalGuardianKind={legalGuardianKind}
									onChangeLegalGuardianKind={(v) => {
										setLegalGuardianKind(v);
										setGuardianErrors((e) => ({ ...e, legalGuardianKind: undefined }));
									}}
									guardianSignature={guardianSignature}
									onChangeGuardianSignature={setGuardianSignature}
									acknowledged={guardianAcknowledged}
									onChangeAcknowledged={(v) => {
										setGuardianAcknowledged(v);
										setGuardianErrors((e) => ({ ...e, guardianAck: undefined }));
									}}
									errors={guardianErrors}
									disabled={loading}
								/>
							</View>
						) : null}

						<GradientButton
							onPress={confirmWaiverInModal}
							className='mt-10'
							style={{ height: 52 }}
						>
							Accept waiver & continue
						</GradientButton>
						<GradientButton
							variant='secondary'
							onPress={() => setShowWaiverModal(false)}
							className='mt-3'
						>
							Close without accepting
						</GradientButton>
					</GHScrollView>
				</View>
			</Modal>

			<CameraCapture
				visible={showGuardianIdCamera}
				onClose={() => setShowGuardianIdCamera(false)}
				onCapture={handleGuardianIdPhotoCapture}
				angle='front'
				angleLabel='ID verification'
				titleOverride='Parent / guardian with ID'
				overlayLabel='Take ID picture'
				initialFacing='back'
				idCardFrameGuide
			/>

			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant as any}
				confirmLabel="OK"
				onConfirm={() => setAlertModal((p) => ({ ...p, visible: false }))}
				onCancel={() => setAlertModal((p) => ({ ...p, visible: false }))}
				hideCancel
			/>
		</FixedView>
	);
};

export default Fourth;
