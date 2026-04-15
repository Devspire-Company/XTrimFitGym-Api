import React, { useState } from 'react';
import {
	FlatList,
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

interface SelectOption {
	label: string;
	value: string;
}

interface SelectProps {
	label?: string;
	options: SelectOption[];
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	containerClassName?: string;
	disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
	label,
	options,
	value,
	onChange,
	placeholder = 'Select an option',
	error,
	containerClassName = '',
	disabled = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<View className={`mb-5 ${containerClassName}`}>
			{label && (
				<Text className='text-text-primary text-sm font-medium mb-2'>
					{label}
				</Text>
			)}
			<TouchableOpacity
				onPress={() => !disabled && setIsOpen(true)}
				disabled={disabled}
				activeOpacity={disabled ? 1 : 0.7}
				className={`border ${
					error ? 'border-red-500' : 'border-input'
				} rounded-lg p-4 bg-input flex-row justify-between items-start ${disabled ? 'opacity-50' : ''}`}
			>
				<View style={{ flex: 1, paddingRight: 10 }}>
					<Text
						className={`text-base leading-6 ${
							selectedOption ? 'text-text-primary' : 'text-gray-500'
						}`}
					>
						{selectedOption ? selectedOption.label : placeholder}
					</Text>
				</View>
				<Text className='text-text-secondary text-lg pt-0.5'>▼</Text>
			</TouchableOpacity>
			{error && <Text className='text-red-500 text-sm mt-1'>{error}</Text>}

			<Modal
				visible={isOpen}
				transparent
				animationType='slide'
				onRequestClose={() => setIsOpen(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{label || 'Select'}</Text>
							<TouchableOpacity onPress={() => setIsOpen(false)}>
								<Text style={styles.closeButton}>✕</Text>
							</TouchableOpacity>
						</View>
						<FlatList
							data={options}
							keyExtractor={(item) => item.value}
							removeClippedSubviews={false}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={[
										styles.option,
										value === item.value && styles.selectedOption,
									]}
									onPress={() => {
										onChange(item.value);
										setIsOpen(false);
									}}
								>
									<View style={styles.optionTextWrap}>
										<Text
											style={[
												styles.optionText,
												value === item.value && styles.selectedOptionText,
											]}
										>
											{item.label}
										</Text>
									</View>
									{value === item.value ? (
										<Text style={styles.checkmark}>✓</Text>
									) : (
										<View style={styles.checkmarkSpacer} />
									)}
								</TouchableOpacity>
							)}
						/>
					</View>
				</View>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#1C1C1E',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '70%',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#fff',
	},
	closeButton: {
		fontSize: 24,
		color: '#fff',
	},
	option: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	optionTextWrap: {
		flex: 1,
		paddingRight: 12,
		minWidth: 0,
	},
	checkmarkSpacer: {
		width: 22,
	},
	selectedOption: {
		backgroundColor: '#2a2a2a',
	},
	optionText: {
		fontSize: 16,
		lineHeight: 22,
		color: '#fff',
	},
	selectedOptionText: {
		color: '#F9C513',
		fontWeight: '600',
	},
	checkmark: {
		fontSize: 18,
		lineHeight: 22,
		color: '#F9C513',
		fontWeight: 'bold',
		marginTop: 2,
		width: 22,
		textAlign: 'right',
	},
});

export default Select;
