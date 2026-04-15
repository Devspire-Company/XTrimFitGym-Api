import React, { useRef } from 'react';
import { Keyboard, Text, TouchableOpacity, View } from 'react-native';
import SignatureScreen, {
	type SignatureViewRef,
} from 'react-native-signature-canvas';

const PAD_WEB_STYLE = `
  .m-signature-pad--footer { display: none !important; margin: 0 !important; }
  .m-signature-pad {
    box-shadow: none;
    border: none;
    background-color: transparent;
  }
  .m-signature-pad--body {
    border: 2px solid rgba(249, 197, 19, 0.35);
    border-radius: 12px;
    background-color: #13161f;
  }
  .m-signature-pad--body canvas { border-radius: 10px; }
`;

export function isDrawnSignature(dataUri: string): boolean {
	return (
		typeof dataUri === 'string' &&
		dataUri.startsWith('data:image') &&
		dataUri.length > 400
	);
}

type Props = {
	label: string;
	hint?: string;
	value: string;
	onChange: (dataUri: string) => void;
	disabled?: boolean;
	height?: number;
	/** While the user is drawing, parent ScrollViews can set scrollEnabled=false to avoid stealing touches. */
	onDrawingChange?: (drawing: boolean) => void;
};

export function WaiverSignaturePad({
	label,
	hint,
	value,
	onChange,
	disabled = false,
	height = 200,
	onDrawingChange,
}: Props) {
	const ref = useRef<SignatureViewRef>(null);

	const handleBegin = () => {
		if (disabled) return;
		// Android: focused TextInput above the pad often steals the first touches from the WebView.
		Keyboard.dismiss();
		onDrawingChange?.(true);
	};

	const handleEnd = () => {
		if (disabled) return;
		onDrawingChange?.(false);
		ref.current?.readSignature();
	};

	const handleClear = () => {
		ref.current?.clearSignature();
		onChange('');
	};

	return (
		<View className='gap-2'>
			<Text className='text-text-primary font-semibold text-base'>{label}</Text>
			{hint ? (
				<Text className='text-text-secondary text-xs leading-5'>{hint}</Text>
			) : null}
			<View
				className='rounded-xl overflow-hidden border border-[#F9C513]/25 bg-bg-primary'
				style={{ height }}
				pointerEvents={disabled ? 'none' : 'auto'}
			>
				<SignatureScreen
					ref={ref}
					onBegin={handleBegin}
					onOK={(sig) => onChange(sig)}
					onEmpty={() => onChange('')}
					onEnd={handleEnd}
					penColor='#F9C513'
					minWidth={1}
					maxWidth={3}
					webStyle={PAD_WEB_STYLE}
					style={{ flex: 1, width: '100%' }}
					scrollable={false}
					nestedScrollEnabled
					androidLayerType='software'
					webviewProps={{
						// Helps Android deliver touches to the WebView when nested in a ScrollView.
						nestedScrollEnabled: true,
						overScrollMode: 'never',
					}}
				/>
			</View>
			<View className='flex-row items-center justify-between flex-wrap gap-2'>
				<TouchableOpacity
					onPress={handleClear}
					disabled={disabled}
					className='py-2 px-3 rounded-lg bg-bg-primary border border-[#F9C513]/30'
				>
					<Text className='text-[#F9C513] font-medium text-sm'>Clear</Text>
				</TouchableOpacity>
				{isDrawnSignature(value) ? (
					<Text className='text-emerald-400/90 text-xs font-medium'>Captured</Text>
				) : (
					<Text className='text-text-secondary text-xs'>Sign with finger or stylus</Text>
				)}
			</View>
		</View>
	);
}
