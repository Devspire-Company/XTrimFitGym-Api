import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { GET_CURRENT_MEMBERSHIP_QUERY } from '@/graphql/queries';
import { useQuery } from '@apollo/client/react';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CoachSubscription = () => {
	const [refreshing, setRefreshing] = useState(false);
	const { data: currentMembershipData, refetch: refetchMembership } = useQuery(GET_CURRENT_MEMBERSHIP_QUERY, {
		fetchPolicy: 'cache-and-network',
	});

	useEffect(() => {
		refetchMembership();
	}, [refetchMembership]);

	// Handle pull-to-refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refetchMembership();
		} finally {
			setRefreshing(false);
		}
	};

	const currentMembership = currentMembershipData?.getCurrentMembership;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<TabHeader showCoachIcon={false} />
			<ScrollView
				className='flex-1'
				contentContainerClassName='p-5'
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor='#F9C513' />
				}
			>
				<View className='flex-row justify-between items-center mb-6'>
					<View>
						<Text className='text-3xl font-bold text-text-primary'>
							Subscription
						</Text>
						<Text className='text-text-secondary mt-1'>
							Your membership status
						</Text>
					</View>
					<Ionicons name='card' size={32} color='#F9C513' />
				</View>

				{currentMembership ? (
					<>
						<View className='bg-gradient-to-r from-[#E41E26] to-[#F9C513] rounded-xl p-6 mb-6'>
							<View className='flex-row items-center justify-between'>
								<View className='flex-1'>
									<Text className='text-white text-sm font-semibold mb-1'>
										ACTIVE MEMBERSHIP
									</Text>
									<Text className='text-white text-2xl font-bold mb-1'>
										{currentMembership.membership?.name || 'Premium'}
									</Text>
									<Text className='text-white/80 text-sm'>
										Expires: {formatDate(currentMembership.expiresAt)}
									</Text>
								</View>
								<Ionicons name='checkmark-circle' size={48} color='white' />
							</View>
						</View>

						<View className='bg-bg-primary rounded-xl p-5'>
							<View className='mb-4'>
								<Text className='text-text-secondary text-sm mb-1'>
									Plan Name
								</Text>
								<Text className='text-text-primary font-semibold text-lg'>
									{currentMembership.membership?.name}
								</Text>
							</View>
							<View className='mb-4'>
								<Text className='text-text-secondary text-sm mb-1'>
									Started On
								</Text>
								<Text className='text-text-primary font-semibold text-lg'>
									{formatDate(currentMembership.startedAt)}
								</Text>
							</View>
							<View className='mb-4'>
								<Text className='text-text-secondary text-sm mb-1'>
									Expires On
								</Text>
								<Text className='text-text-primary font-semibold text-lg'>
									{formatDate(currentMembership.expiresAt)}
								</Text>
							</View>
							<View>
								<Text className='text-text-secondary text-sm mb-1'>
									Price Paid
								</Text>
								<Text className='text-text-primary font-semibold text-lg'>
									₱{currentMembership.priceAtPurchase?.toLocaleString() || '0'}
								</Text>
							</View>
						</View>
					</>
				) : (
					<View className='bg-bg-primary rounded-xl p-6 items-center'>
						<View className='bg-[#F9C513]/20 rounded-full p-4 mb-4'>
							<Ionicons name='card-outline' size={48} color='#F9C513' />
						</View>
						<Text className='text-2xl font-bold text-text-primary mb-2'>
							Free Account
						</Text>
						<Text className='text-text-secondary text-center'>
							Your subscription information will appear here
						</Text>
					</View>
				)}
			</ScrollView>
		</FixedView>
	);
};

export default CoachSubscription;

