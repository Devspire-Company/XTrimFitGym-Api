import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { sanitizePhilippineMobileNationalDigits } from '@/utils/philippine-phone';

type PhilippinePhoneInputProps = {
	label?: string;
	value: string;
	onChangeText: (nationalDigits: string) => void;
	error?: string;
	placeholder?: string;
	containerClassName?: string;
	editable?: boolean;
};

const PhilippinePhoneInput = ({
	label = 'Phone Number',
	value,
	onChangeText,
	error,
	placeholder = '9XX XXX XXXX',
	containerClassName = '',
	editable = true,
}: PhilippinePhoneInputProps) => {
	return (
		<View className={`mb-4 ${containerClassName}`}>
			{label ? (
				<Text className='text-text-primary text-sm font-medium mb-2'>{label}</Text>
			) : null}
			<View
				className={`flex-row items-stretch overflow-hidden rounded-lg border ${
					error ? 'border-red-500' : 'border-input'
				}`}
			>
				<View className='justify-center border-r border-input bg-bg-darker px-3'>
					<Text className='text-base font-semibold text-text-primary'>+63</Text>
				</View>
				<TextInput
					className='min-h-[52px] flex-1 bg-input px-3 py-3 text-base text-text-primary'
					placeholder={placeholder}
					placeholderTextColor='#6c757d'
					value={value}
					onChangeText={(text) => onChangeText(sanitizePhilippineMobileNationalDigits(text))}
					keyboardType='phone-pad'
					inputMode='numeric'
					editable={editable}
					autoCorrect={false}
				/>
			</View>
			{error ? <Text className='mt-1 text-sm text-red-500'>{error}</Text> : null}
		</View>
	);
};

export default PhilippinePhoneInput;
