import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
	Text,
	TextInput,
	TextInputProps,
	TouchableOpacity,
	View,
} from 'react-native';

interface InputProps extends TextInputProps {
	label?: string;
	error?: string;
	containerClassName?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(function Input(
	{
		label,
		error,
		containerClassName = '',
		className = '',
		secureTextEntry,
		...props
	},
	ref
) {
	const [showPassword, setShowPassword] = useState(false);
	const isPasswordField = secureTextEntry;

	return (
		<View className={`mb-4 ${containerClassName}`}>
			{label && (
				<Text className='text-text-primary text-sm font-medium mb-2'>
					{label}
				</Text>
			)}
			<View className='relative'>
				<TextInput
					ref={ref}
					className={`border ${
						error ? 'border-red-500' : 'border-input'
					} rounded-lg p-4 text-base bg-input text-text-primary ${
						isPasswordField ? 'pr-12' : ''
					} ${className}`}
					placeholderTextColor='#6c757d'
					secureTextEntry={isPasswordField && !showPassword}
					{...props}
				/>
				{isPasswordField && (
					<TouchableOpacity
						onPress={() => setShowPassword(!showPassword)}
						className='absolute right-4 top-0 bottom-0 justify-center'
						activeOpacity={0.7}
					>
						<Ionicons
							name={showPassword ? 'eye-off' : 'eye'}
							size={20}
							color='#8E8E93'
						/>
					</TouchableOpacity>
				)}
			</View>
			{error && (
				<Text className='text-red-500 text-sm mt-1'>{error}</Text>
			)}
		</View>
	);
});

export default Input;
