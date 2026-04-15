import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { isDrawnSignature } from '@/components/WaiverSignaturePad';
import { AGE_OF_MAJORITY } from '@/utils/age-waiver';
import type { ReactNode } from 'react';
import React from 'react';
import {
	ActivityIndicator,
	Image,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export const LEGAL_GUARDIAN_VALUE = 'Legal guardian';

export const GUARDIAN_TYPE_OPTIONS = [
	{ label: 'Mother', value: 'Mother' },
	{ label: 'Father', value: 'Father' },
	{ label: 'Legal guardian', value: LEGAL_GUARDIAN_VALUE },
];

export type GuardianFormErrors = {
	guardianFullName?: string;
	guardianRelationship?: string;
	/** Required when guardian type is Legal guardian: describe what kind (e.g. court-appointed). */
	legalGuardianKind?: string;
	guardianSignature?: string;
	guardianAck?: string;
	guardianIdPhoto?: string;
	minorMemberPrintedName?: string;
	minorMemberSignature?: string;
};

type Props = {
	guardianFullName: string;
	onChangeGuardianFullName: (v: string) => void;
	guardianRelationship: string;
	onChangeGuardianRelationship: (v: string) => void;
	/** When guardian type is Legal guardian, user describes what kind (free text). */
	legalGuardianKind: string;
	onChangeLegalGuardianKind: (v: string) => void;
	guardianSignature: string;
	onChangeGuardianSignature: (v: string) => void;
	acknowledged: boolean;
	onChangeAcknowledged: (v: boolean) => void;
	errors: GuardianFormErrors;
	disabled?: boolean;
	/** When set, typed signature field is omitted (use a drawn signature pad in `renderBeforeAcknowledgment`). */
	omitSignatureInput?: boolean;
	/** Rendered after guardian type and before the acknowledgment checkbox (e.g. signature pad). */
	renderBeforeAcknowledgment?: ReactNode;
	/** When true, show guardian + ID photo capture (minors). */
	requireGuardianIdPhoto?: boolean;
	guardianIdVerificationPhotoUrl?: string | null;
	onPressCaptureGuardianId?: () => void;
	idPhotoUploading?: boolean;
};

/**
 * Parent/guardian digital attestation for members under 18 (gym liability waiver).
 * Backend stores consent via `agreedToLiabilityWaiver` on the minor's user record.
 */
export function GuardianLiabilitySection({
	guardianFullName,
	onChangeGuardianFullName,
	guardianRelationship,
	onChangeGuardianRelationship,
	legalGuardianKind,
	onChangeLegalGuardianKind,
	guardianSignature,
	onChangeGuardianSignature,
	acknowledged,
	onChangeAcknowledged,
	errors,
	disabled = false,
	omitSignatureInput = false,
	renderBeforeAcknowledgment,
	requireGuardianIdPhoto = false,
	guardianIdVerificationPhotoUrl,
	onPressCaptureGuardianId,
	idPhotoUploading = false,
}: Props) {
	return (
		<View className='gap-4'>
			<View className='bg-bg-primary/80 rounded-xl p-4 border border-[#F9C513]/25'>
				<Text className='text-[#F9C513] font-semibold text-base mb-2'>
					Parent / guardian — liability waiver
				</Text>
				<Text className='text-text-secondary text-sm leading-5'>
					Because you are under {AGE_OF_MAJORITY}, a parent or legal guardian must read the Liability
					Waiver and sign below on your behalf. That waiver states that use of the gym is at your own
					risk and that the gym is not responsible for injuries or accidents that may occur.
				</Text>
			</View>

			<Input
				label="Parent or guardian's full name"
				placeholder='Full legal name'
				value={guardianFullName}
				onChangeText={onChangeGuardianFullName}
				editable={!disabled}
				error={errors.guardianFullName}
			/>

			<Select
				label='Guardian type'
				options={GUARDIAN_TYPE_OPTIONS}
				value={guardianRelationship}
				onChange={onChangeGuardianRelationship}
				placeholder='Mother, Father, or Legal guardian'
				error={errors.guardianRelationship}
			/>

			{guardianRelationship === LEGAL_GUARDIAN_VALUE ? (
				<Input
					label='What kind of legal guardian?'
					placeholder='e.g. Court-appointed, permanent legal guardian, temporary guardian'
					value={legalGuardianKind}
					onChangeText={onChangeLegalGuardianKind}
					editable={!disabled}
					error={errors.legalGuardianKind}
				/>
			) : null}

			{requireGuardianIdPhoto ? (
				<View className='gap-2'>
					<Text className='text-text-primary font-medium text-base'>
						Parent / guardian with photo ID
					</Text>
					<Text className='text-text-secondary text-sm leading-5'>
						Take a clear photo of the adult named above holding a valid government-issued photo ID
						(driver&apos;s license, passport, national ID, etc.). You may cover ID numbers if the
						name and photo of the adult are still visible.
					</Text>
					{guardianIdVerificationPhotoUrl ? (
						<View className='gap-3 mt-1'>
							<Image
								source={{ uri: guardianIdVerificationPhotoUrl }}
								className='w-full h-40 rounded-xl bg-bg-darker'
								resizeMode='cover'
							/>
							<TouchableOpacity
								onPress={onPressCaptureGuardianId}
								disabled={disabled || idPhotoUploading || !onPressCaptureGuardianId}
								className='py-3 px-4 rounded-xl border border-[#F9C513]/50 bg-bg-primary items-center'
								style={{ borderWidth: 0.5, opacity: disabled || idPhotoUploading ? 0.5 : 1 }}
							>
								<Text className='text-[#F9C513] font-semibold'>Retake ID photo</Text>
							</TouchableOpacity>
						</View>
					) : (
						<TouchableOpacity
							onPress={onPressCaptureGuardianId}
							disabled={disabled || idPhotoUploading || !onPressCaptureGuardianId}
							className='py-3 px-4 rounded-xl border border-[#F9C513]/50 bg-bg-primary items-center mt-1'
							style={{ borderWidth: 0.5, opacity: disabled || idPhotoUploading ? 0.5 : 1 }}
						>
							<Text className='text-[#F9C513] font-semibold'>Take ID verification photo</Text>
						</TouchableOpacity>
					)}
					{idPhotoUploading ? (
						<View className='flex-row items-center gap-2 py-2'>
							<ActivityIndicator size='small' color='#F9C513' />
							<Text className='text-text-secondary text-sm'>Uploading…</Text>
						</View>
					) : null}
					{errors.guardianIdPhoto ? (
						<Text className='text-red-400 text-sm'>{errors.guardianIdPhoto}</Text>
					) : null}
				</View>
			) : null}

			{!omitSignatureInput ? (
				<Input
					label='Virtual signature (type the guardian full name exactly as above)'
					placeholder='Same as parent/guardian name'
					value={guardianSignature}
					onChangeText={onChangeGuardianSignature}
					editable={!disabled}
					autoCapitalize='words'
					error={errors.guardianSignature}
				/>
			) : null}

			{renderBeforeAcknowledgment}

			{omitSignatureInput && errors.guardianSignature ? (
				<Text className='text-red-400 text-sm -mt-1'>{errors.guardianSignature}</Text>
			) : null}

			<Checkbox
				label={
					<Text className='text-text-primary text-base leading-5'>
						I am the parent or legal guardian named above. I have read the Terms & Conditions and
						the Liability Waiver, and I accept both on behalf of the minor member, including the
						release of claims for injuries or accidents at the gym.
					</Text>
				}
				checked={acknowledged}
				onChange={onChangeAcknowledged}
				disabled={disabled}
			/>
			{errors.guardianAck ? (
				<Text className='text-red-400 text-sm -mt-2'>{errors.guardianAck}</Text>
			) : null}
		</View>
	);
}

export type GuardianSignatureMode = 'typed' | 'drawn';

/** Validate guardian fields; returns empty object if valid. */
export function validateGuardianFields(
	guardianFullName: string,
	guardianRelationship: string,
	guardianSignature: string,
	acknowledged: boolean,
	signatureMode: GuardianSignatureMode = 'typed',
	legalGuardianKind = '',
	options?: {
		requireGuardianIdPhoto?: boolean;
		guardianIdVerificationPhotoUrl?: string | null;
	}
): GuardianFormErrors {
	const errors: GuardianFormErrors = {};
	const name = guardianFullName.trim();
	if (name.length < 2) {
		errors.guardianFullName = 'Enter the parent or guardian full name';
	}
	if (!guardianRelationship.trim()) {
		errors.guardianRelationship = 'Select guardian type';
	}
	if (guardianRelationship.trim() === LEGAL_GUARDIAN_VALUE) {
		const kind = legalGuardianKind.trim();
		if (kind.length < 3) {
			errors.legalGuardianKind =
				'Describe what kind of legal guardian you are (at least a few words).';
		}
	}
	if (!acknowledged) {
		errors.guardianAck = 'Parent/guardian must confirm this statement';
	}
	const sig = guardianSignature.trim();
	if (signatureMode === 'drawn') {
		if (!isDrawnSignature(sig)) {
			errors.guardianSignature = 'Parent/guardian must sign in the signature box';
		}
	} else if (!sig) {
		errors.guardianSignature = 'Type the full name to sign';
	} else if (name.length >= 2 && sig.toLowerCase() !== name.toLowerCase()) {
		errors.guardianSignature = 'Signature must match the full name above';
	}
	if (options?.requireGuardianIdPhoto) {
		const url = (options.guardianIdVerificationPhotoUrl || '').trim();
		if (!url) {
			errors.guardianIdPhoto =
				'Add a verification photo of the parent or legal guardian with their ID';
		}
	}
	return errors;
}
