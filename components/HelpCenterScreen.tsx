import {
	HELP_CONTACT_LINE,
	HELP_CONTACT_PLACEHOLDER,
	HELP_SECTIONS,
} from '@/constants/help-content';
import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface HelpCenterScreenProps {
	role: 'member' | 'coach' | null;
}

export const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ role }) => {
	const [expandedSection, setExpandedSection] = useState<number | null>(0);

	const sections = HELP_SECTIONS.filter(
		(s) => s.role === null || s.role === role,
	);

	return (
		<FixedView className="flex-1 bg-bg-darker">
			<TabHeader />
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="pt-4 pb-2">
					<Text className="text-[#F9C513] text-[11px] font-semibold tracking-[2px] uppercase">
						Help
					</Text>
					<Text className="text-2xl font-bold text-text-primary mt-0.5">
						Help Center
					</Text>
				</View>

				{sections.map((section, sectionIndex) => (
					<View
						key={section.sectionTitle}
						className="mb-4 bg-bg-primary rounded-2xl border border-[#2C2C2E] overflow-hidden"
					>
						<TouchableOpacity
							activeOpacity={0.7}
							onPress={() =>
								setExpandedSection(
									expandedSection === sectionIndex ? null : sectionIndex,
								)
							}
							className="flex-row items-center justify-between px-4 py-4"
						>
							<Text className="text-text-primary font-semibold text-base flex-1">
								{section.sectionTitle}
							</Text>
							<Ionicons
								name={
									expandedSection === sectionIndex
										? 'chevron-up'
										: 'chevron-down'
								}
								size={20}
								color="#8E8E93"
							/>
						</TouchableOpacity>
						{expandedSection === sectionIndex && (
							<View className="px-4 pb-4 border-t border-[#2C2C2E]">
								{section.items.map((item, i) => (
									<View key={i} className="pt-3">
										<Text className="text-[#F9C513] text-sm font-medium">
											{item.question}
										</Text>
										<Text className="text-text-secondary text-sm mt-1 leading-5">
											{item.answer}
										</Text>
									</View>
								))}
							</View>
						)}
					</View>
				))}

				<View className="mt-2 mb-4 bg-bg-primary rounded-2xl border border-[#F9C513]/25 p-4">
					<Text className="text-text-primary font-semibold text-base mb-2">
						Contact support
					</Text>
					<Text className="text-text-secondary text-sm leading-5">
						{HELP_CONTACT_LINE}
					</Text>
					<Text className="text-text-secondary text-sm mt-2 leading-5">
						{HELP_CONTACT_PLACEHOLDER}
					</Text>
				</View>
			</ScrollView>
		</FixedView>
	);
};
