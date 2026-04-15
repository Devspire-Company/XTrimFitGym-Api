import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
	ActivityIndicator,
	ColorValue,
	Pressable,
	PressableProps,
	StyleSheet,
	Text,
	View,
} from 'react-native';

interface GradientButtonProps extends Omit<PressableProps, 'children'> {
	children: React.ReactNode;
	variant?: 'primary' | 'secondary';
	loading?: boolean;
	className?: string;
	textClassName?: string;
}

const GradientButton: React.FC<GradientButtonProps> = ({
	children,
	variant = 'primary',
	loading = false,
	disabled,
	className = '',
	textClassName = '',
	style,
	...pressableProps
}) => {
	const gradientColors = ['#C41820', '#D4A80F'];

	const buttonHeight =
		typeof style === 'object' && style && 'height' in style
			? (style as any).height
			: undefined;

	return (
		<Pressable
			{...pressableProps}
			disabled={disabled || loading}
			style={(state) => {
				const styleValue = typeof style === 'function' ? style(state) : style;
				return [
					styles.pressable,
					(disabled || loading) && styles.disabled,
					styleValue,
				].filter(Boolean);
			}}
			{...(className ? { className } : {})}
		>
			{variant === 'primary' ? (
				<LinearGradient
					colors={gradientColors as [ColorValue, ColorValue]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={[styles.gradient, buttonHeight && { height: buttonHeight }]}
				>
					{loading ? (
						<ActivityIndicator size='small' color='#ffffff' />
					) : typeof children === 'string' || typeof children === 'number' ? (
						<Text style={styles.text} className={textClassName}>
							{children}
						</Text>
					) : (
						children
					)}
				</LinearGradient>
			) : (
				<View
					style={[
						styles.secondaryContainer,
						buttonHeight && { height: buttonHeight },
					]}
				>
					{loading ? (
						<ActivityIndicator size='small' color='#ffffff' />
					) : typeof children === 'string' || typeof children === 'number' ? (
						<Text
							style={styles.secondaryText}
							className={textClassName}
							numberOfLines={1}
							ellipsizeMode='tail'
						>
							{children}
						</Text>
					) : (
						children
					)}
				</View>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	pressable: {
		borderRadius: 12,
		overflow: 'hidden',
	},
	disabled: {
		opacity: 0.5,
	},
	gradient: {
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 48,
	},
	secondaryContainer: {
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#2C2C2E',
		borderWidth: 1,
		borderColor: '#3A3A3C',
		minHeight: 48,
	},
	text: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '600',
	},
	secondaryText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
});

export default GradientButton;
