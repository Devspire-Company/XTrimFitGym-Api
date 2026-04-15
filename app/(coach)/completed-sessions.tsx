import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { useAuth } from '@/contexts/AuthContext';
import { GetCoachSessionLogsQuery } from '@/graphql/generated/types';
import { GET_COACH_SESSION_LOGS_QUERY } from '@/graphql/queries';
import { formatTimeTo12Hour } from '@/utils/time-utils';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
	FlatList,
	Modal,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	Image,
	Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const CoachCompletedSessions = () => {
	const { user } = useAuth();
	const router = useRouter();
	const [refreshing, setRefreshing] = useState(false);
	const [selectedSessionLog, setSelectedSessionLog] = useState<any>(null);
	const [showProgressImagesModal, setShowProgressImagesModal] = useState(false);
	// Track expanded state for folder structure
	const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
	const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
	const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

	const { data, refetch, loading } = useQuery<GetCoachSessionLogsQuery>(
		GET_COACH_SESSION_LOGS_QUERY,
		{
			variables: { coachId: user?.id || '' },
			fetchPolicy: 'cache-and-network',
			skip: !user?.id,
		}
	);

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			if (user?.id) {
				await refetch();
			}
		} finally {
			setRefreshing(false);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatDateHeader = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return 'Today';
		}
		if (date.toDateString() === yesterday.toDateString()) {
			return 'Yesterday';
		}
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const sessionLogs = data?.getCoachSessionLogs || [];

	// Group session logs by client → goal → date
	const groupedLogs = useMemo(() => {
		const groups: Record<
			string,
			Record<
				string,
				Record<string, any[]>
			>
		> = {};

		sessionLogs.forEach((log: any) => {
			const clientId = log.client?.id || log.clientId || 'Unknown';
			const clientName = log.client
				? `${log.client.firstName} ${log.client.lastName}`
				: 'Unknown Client';

			const goalId = log.session?.goal?.id || log.session?.goalId || 'No Goal';
			const goalTitle = log.session?.goal?.title || 'No Goal';

			const dateKey = log.session?.date
				? new Date(log.session.date).toDateString()
				: log.completedAt
				? new Date(log.completedAt).toDateString()
				: 'Unknown';

			// Create client key
			const clientKey = `${clientId}|${clientName}`;
			// Create goal key
			const goalKey = `${goalId}|${goalTitle}`;

			if (!groups[clientKey]) {
				groups[clientKey] = {};
			}
			if (!groups[clientKey][goalKey]) {
				groups[clientKey][goalKey] = {};
			}
			if (!groups[clientKey][goalKey][dateKey]) {
				groups[clientKey][goalKey][dateKey] = [];
			}

			groups[clientKey][goalKey][dateKey].push(log);
		});

		// Sort clients alphabetically
		const sortedClients = Object.keys(groups).sort((a, b) => {
			const nameA = a.split('|')[1];
			const nameB = b.split('|')[1];
			return nameA.localeCompare(nameB);
		});

		// Sort goals within each client
		sortedClients.forEach((clientKey) => {
			const goalKeys = Object.keys(groups[clientKey]);
			goalKeys.sort((a, b) => {
				const titleA = a.split('|')[1];
				const titleB = b.split('|')[1];
				return titleA.localeCompare(titleB);
			});
		});

		// Sort dates within each goal (most recent first)
		sortedClients.forEach((clientKey) => {
			Object.keys(groups[clientKey]).forEach((goalKey) => {
				const dateKeys = Object.keys(groups[clientKey][goalKey]);
				dateKeys.sort((a, b) => {
					return new Date(b).getTime() - new Date(a).getTime();
				});
			});
		});

		// Sort logs within each date by completedAt (most recent first)
		sortedClients.forEach((clientKey) => {
			Object.keys(groups[clientKey]).forEach((goalKey) => {
				Object.keys(groups[clientKey][goalKey]).forEach((dateKey) => {
					groups[clientKey][goalKey][dateKey].sort((a, b) => {
						const dateA = a.completedAt
							? new Date(a.completedAt).getTime()
							: 0;
						const dateB = b.completedAt
							? new Date(b.completedAt).getTime()
							: 0;
						return dateB - dateA;
					});
				});
			});
		});

		return { groups, sortedClients };
	}, [sessionLogs]);

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<View className='flex-row items-center justify-between px-5 pt-12 pb-4 bg-bg-darker'>
				<TouchableOpacity
					onPress={() => router.back()}
					className='flex-row items-center'
				>
					<Ionicons name='arrow-back' size={24} color='#F9C513' />
					<Text className='text-[#F9C513] font-semibold ml-2'>Back</Text>
				</TouchableOpacity>
				<View className='flex-row items-center'>
					<Ionicons name='person-circle' size={32} color='#F9C513' />
				</View>
			</View>
			<ScrollView
				className='flex-1'
				contentContainerClassName='p-5'
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor='#F9C513'
					/>
				}
			>
				<View className='mb-6'>
					<Text className='text-3xl font-bold text-text-primary'>
						Completed Sessions
					</Text>
					<Text className='text-text-secondary mt-1'>
						All completed sessions organized by client and goal
					</Text>
				</View>

				{loading ? (
					<PremiumLoadingContent embedded message='Please wait..' />
				) : sessionLogs.length === 0 ? (
					<View
						className='bg-bg-primary rounded-xl p-6 items-center border border-[#F9C513]'
						style={{ borderWidth: 0.5 }}
					>
						<Ionicons name='checkmark-circle-outline' size={48} color='#8E8E93' />
						<Text className='text-text-secondary mt-4 text-center text-base'>
							No completed sessions yet
						</Text>
						<Text className='text-text-secondary mt-2 text-center text-sm'>
							Completed sessions will appear here
						</Text>
					</View>
				) : (
					<View>
						{groupedLogs.sortedClients.map((clientKey) => {
							const [clientId, clientName] = clientKey.split('|');
							const goals = groupedLogs.groups[clientKey];
							const isClientExpanded = expandedClients.has(clientKey);

							return (
								<View key={clientKey} className='mb-4'>
									{/* Client Header - Collapsible */}
									<TouchableOpacity
										onPress={() => {
											const newExpanded = new Set(expandedClients);
											if (isClientExpanded) {
												newExpanded.delete(clientKey);
											} else {
												newExpanded.add(clientKey);
											}
											setExpandedClients(newExpanded);
										}}
										className='bg-bg-primary rounded-xl p-4 mb-2 border border-[#F9C513]'
										style={{ borderWidth: 0.5 }}
									>
										<View className='flex-row items-center justify-between'>
											<View className='flex-row items-center flex-1'>
												<Ionicons
													name={isClientExpanded ? 'folder-open' : 'folder'}
													size={24}
													color='#F9C513'
												/>
												<Text className='text-xl font-bold text-text-primary ml-3'>
													{clientName}
												</Text>
											</View>
											<Ionicons
												name={isClientExpanded ? 'chevron-up' : 'chevron-down'}
												size={20}
												color='#8E8E93'
											/>
										</View>
									</TouchableOpacity>

									{/* Goals for this client - Only show if client is expanded */}
									{isClientExpanded && (
										<View className='ml-4'>
											{Object.keys(goals).map((goalKey) => {
												const [goalId, goalTitle] = goalKey.split('|');
												const dates = goals[goalKey];
												const goalFullKey = `${clientKey}|${goalKey}`;
												const isGoalExpanded = expandedGoals.has(goalFullKey);

												return (
													<View key={goalKey} className='mb-3'>
														{/* Goal Header - Collapsible */}
														<TouchableOpacity
															onPress={() => {
																const newExpanded = new Set(expandedGoals);
																if (isGoalExpanded) {
																	newExpanded.delete(goalFullKey);
																} else {
																	newExpanded.add(goalFullKey);
																}
																setExpandedGoals(newExpanded);
															}}
															className='bg-bg-primary rounded-lg p-3 mb-2 border border-[#F9C513]'
															style={{ borderWidth: 0.5 }}
														>
															<View className='flex-row items-center justify-between'>
																<View className='flex-row items-center flex-1'>
																	<Ionicons
																		name={isGoalExpanded ? 'folder-open' : 'folder'}
																		size={20}
																		color='#F9C513'
																	/>
																	<Text className='text-lg font-semibold text-text-primary ml-3'>
																		{goalTitle}
																	</Text>
																</View>
																<Ionicons
																	name={isGoalExpanded ? 'chevron-up' : 'chevron-down'}
																	size={18}
																	color='#8E8E93'
																/>
															</View>
														</TouchableOpacity>

														{/* Dates for this goal - Only show if goal is expanded */}
														{isGoalExpanded && (
															<View className='ml-4'>
																{Object.keys(dates).map((dateKey) => {
																	const logs = dates[dateKey];
																	const dateFullKey = `${goalFullKey}|${dateKey}`;
																	const isDateExpanded = expandedDates.has(dateFullKey);

																	return (
																		<View key={dateKey} className='mb-2'>
																			{/* Date Header - Collapsible */}
																			<TouchableOpacity
																				onPress={() => {
																					const newExpanded = new Set(expandedDates);
																					if (isDateExpanded) {
																						newExpanded.delete(dateFullKey);
																					} else {
																						newExpanded.add(dateFullKey);
																					}
																					setExpandedDates(newExpanded);
																				}}
																				className='bg-bg-primary rounded-lg p-3 mb-2 border border-[#F9C513]'
																				style={{ borderWidth: 0.5 }}
																			>
																				<View className='flex-row items-center justify-between'>
																					<View className='flex-row items-center flex-1'>
																						<Ionicons
																							name={isDateExpanded ? 'folder-open' : 'folder'}
																							size={18}
																							color='#F9C513'
																						/>
																						<Text className='text-base font-semibold text-text-secondary ml-3'>
																							{formatDateHeader(dateKey)}
																						</Text>
																					</View>
																					<View className='flex-row items-center'>
																						<Text className='text-text-secondary text-sm mr-2'>
																							{logs.length} session{logs.length !== 1 ? 's' : ''}
																						</Text>
																						<Ionicons
																							name={isDateExpanded ? 'chevron-up' : 'chevron-down'}
																							size={16}
																							color='#8E8E93'
																						/>
																					</View>
																				</View>
																			</TouchableOpacity>

																			{/* Session Logs for this date - Only show if date is expanded */}
																			{isDateExpanded && (
																				<View className='ml-4'>
																					{logs.map((log: any) => (
																						<TouchableOpacity
																							key={log.id}
																							onPress={() => {
																								setSelectedSessionLog(log);
																								setShowProgressImagesModal(true);
																							}}
																							className='bg-bg-primary rounded-xl p-4 mb-3 border border-[#F9C513]'
																							style={{ borderWidth: 0.5 }}
																						>
																							<View className='flex-row'>
																								<View
																									className='bg-bg-darker rounded-lg p-3 mr-3 items-center justify-center min-w-[80] border border-[#F9C513]'
																									style={{ borderWidth: 0.5 }}
																								>
																									{log.session?.startTime && (
																										<Text className='text-[#F9C513] font-bold text-lg'>
																											{formatTimeTo12Hour(log.session.startTime)}
																										</Text>
																									)}
																									<Text className='text-text-secondary text-xs mt-1'>
																										{log.session?.date
																											? formatDate(log.session.date)
																											: 'N/A'}
																									</Text>
																								</View>
																								<View className='flex-1'>
																									<Text className='text-text-primary font-semibold text-base mb-2'>
																										{log.session?.name || 'Session'}
																									</Text>
																									<View className='flex-row items-center mb-1'>
																										<Ionicons
																											name='checkmark-circle'
																											size={14}
																											color='#4CAF50'
																										/>
																										<Text className='text-text-secondary text-sm ml-1'>
																											Completed
																										</Text>
																									</View>
																									{log.session?.gymArea && (
																										<View className='flex-row items-center mb-1'>
																											<Ionicons
																												name='location'
																												size={14}
																												color='#8E8E93'
																											/>
																											<Text className='text-text-secondary text-sm ml-1'>
																												{log.session.gymArea}
																											</Text>
																										</View>
																									)}
																									{log.weight && (
																										<View className='flex-row items-center mt-1'>
																											<Ionicons
																												name='scale'
																												size={14}
																												color='#8E8E93'
																											/>
																											<Text className='text-text-secondary text-sm ml-1'>
																												Weight: {log.weight} kg
																											</Text>
																										</View>
																									)}
																									{log.progressImages && (
																										<View className='flex-row items-center mt-2'>
																											<Ionicons
																												name='images'
																												size={14}
																												color='#F9C513'
																											/>
																											<Text className='text-[#F9C513] text-xs ml-1'>
																												4 Progress Photos
																											</Text>
																										</View>
																									)}
																								</View>
																							</View>
																						</TouchableOpacity>
																					))}
																				</View>
																			)}
																		</View>
																	);
																})}
															</View>
														)}
													</View>
												);
											})}
										</View>
									)}
								</View>
							);
						})}
					</View>
				)}
			</ScrollView>

			{/* Progress Images Modal */}
			<Modal
				visible={showProgressImagesModal}
				animationType='slide'
				transparent
				onRequestClose={() => {
					setShowProgressImagesModal(false);
					setSelectedSessionLog(null);
				}}
			>
				<View className='flex-1 bg-bg-darker justify-end'>
					<View
						className='bg-bg-primary rounded-t-3xl p-6 max-h-[90%] border-t border-[#F9C513]'
						style={{ borderTopWidth: 0.5 }}
					>
						<ScrollView showsVerticalScrollIndicator={false}>
							<View className='flex-row justify-between items-center mb-6'>
								<View className='flex-1'>
									<Text className='text-2xl font-bold text-text-primary'>
										Progress Photos
									</Text>
									{selectedSessionLog?.session && (
										<Text className='text-text-secondary text-sm mt-1'>
											{selectedSessionLog.session.name} -{' '}
											{formatDate(selectedSessionLog.session.date)}
										</Text>
									)}
								</View>
								<TouchableOpacity
									onPress={() => {
										setShowProgressImagesModal(false);
										setSelectedSessionLog(null);
									}}
								>
									<Ionicons name='close' size={28} color='#8E8E93' />
								</TouchableOpacity>
							</View>

							{selectedSessionLog?.progressImages ? (
								<View>
									{selectedSessionLog.progressImages.front && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Front
											</Text>
											<Image
												source={{ uri: selectedSessionLog.progressImages.front }}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
									{selectedSessionLog.progressImages.rightSide && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Right Side
											</Text>
											<Image
												source={{
													uri: selectedSessionLog.progressImages.rightSide,
												}}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
									{selectedSessionLog.progressImages.leftSide && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Left Side
											</Text>
											<Image
												source={{
													uri: selectedSessionLog.progressImages.leftSide,
												}}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
									{selectedSessionLog.progressImages.back && (
										<View className='mb-4'>
											<Text className='text-text-primary font-semibold mb-2'>
												Back
											</Text>
											<Image
												source={{ uri: selectedSessionLog.progressImages.back }}
												style={{
													width: '100%',
													height: width * 0.8,
													borderRadius: 12,
													borderWidth: 0.5,
													borderColor: '#F9C513',
												}}
												resizeMode='cover'
											/>
										</View>
									)}
									{selectedSessionLog.weight && (
										<View className='mb-4 p-4 bg-bg-darker rounded-xl border border-[#F9C513]' style={{ borderWidth: 0.5 }}>
											<Text className='text-text-primary font-semibold mb-1'>
												Weight
											</Text>
											<Text className='text-text-secondary text-lg'>
												{selectedSessionLog.weight} kg
											</Text>
										</View>
									)}
								</View>
							) : (
								<View className='items-center py-10'>
									<Ionicons name='images-outline' size={64} color='#8E8E93' />
									<Text className='text-text-secondary mt-4 text-center'>
										No progress photos available
									</Text>
								</View>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</FixedView>
	);
};

export default CoachCompletedSessions;

