import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

interface CheckboxProps {
	label: React.ReactNode;
	checked: boolean;
	onChange: (checked: boolean) => void;
	error?: string;
	containerStyle?: ViewStyle;
	disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
	label,
	checked,
	onChange,
	error,
	containerStyle,
	disabled = false,
}) => {
	return (
		<View style={[styles.container, containerStyle]}>
			<TouchableOpacity
				onPress={() => !disabled && onChange(!checked)}
				style={[styles.touchable, disabled && styles.disabled]}
				disabled={disabled}
			>
				{checked ? (
					<LinearGradient
						colors={['#E41E26', '#F9C513']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={styles.checkboxChecked}
					>
						<Text style={styles.checkmark}>✓</Text>
					</LinearGradient>
				) : (
					<View style={styles.checkboxUnchecked} />
				)}
				<View style={styles.labelContainer}>{label}</View>
			</TouchableOpacity>
			{error && <Text style={styles.error}>{error}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	touchable: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	checkboxChecked: {
		width: 24,
		height: 24,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
		marginTop: 2,
	},
	checkboxUnchecked: {
		width: 24,
		height: 24,
		borderWidth: 2,
		borderColor: '#2C2C2E',
		backgroundColor: '#2C2C2E',
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
		marginTop: 2,
	},
	checkmark: {
		color: '#ffffff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	labelContainer: {
		flex: 1,
	},
	error: {
		color: '#ef4444',
		fontSize: 14,
		marginTop: 4,
		marginLeft: 36,
	},
	disabled: {
		opacity: 0.5,
	},
});

export default Checkbox;
