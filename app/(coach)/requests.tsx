import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import ConfirmModal from '@/components/ConfirmModal';
import FixedView from '@/components/FixedView';
import TabHeader from '@/components/TabHeader';
import { UPDATE_COACH_REQUEST_MUTATION } from '@/graphql/mutations';
import { GET_PENDING_COACH_REQUESTS_QUERY } from '@/graphql/queries';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const CoachRequests = () => {
	const [refreshing, setRefreshing] = useState(false);
	const [confirmRequest, setConfirmRequest] = useState<{
		id: string;
		action: 'approve' | 'reject';
		clientName: string;
	} | null>(null);

	const { data, loading, refetch } = useQuery(GET_PENDING_COACH_REQUESTS_QUERY, {
		fetchPolicy: 'cache-and-network',
	});

	const [updateCoachRequest, { loading: updating }] = useMutation(
		UPDATE_COACH_REQUEST_MUTATION,
		{
			onCompleted: async () => {
				setConfirmRequest(null);
				await refetch();
			},
			onError: (err) => {
				setConfirmRequest(null);
			},
		}
	);

	const pendingRequests = useMemo(() => {
		const list = (data as any)?.getPendingCoachRequests || [];
		return list.filter(
			(r: any) => r && r.id && r.client && r.client.id
		);
	}, [data]);

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	const handleConfirm = () => {
		if (!confirmRequest) return;
		updateCoachRequest({
			variables: {
				id: confirmRequest.id,
				input: {
					status: confirmRequest.action === 'approve' ? 'approved' : 'denied',
				},
			},
		});
	};

	const formatDate = (dateString: string) => {
		const d = new Date(dateString);
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<FixedView className="flex-1 bg-bg-darker">
			<TabHeader />
			<ScrollView
				className="flex-1"
				contentContainerClassName="p-5"
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#F9C513"
					/>
				}
			>
				<View className="flex-row items-center gap-3 mb-4">
					<View className="w-11 h-11 rounded-2xl bg-[#F9C513]/15 border border-[#F9C513]/25 items-center justify-center">
						<Ionicons name="mail-open" size={24} color="#F9C513" />
					</View>
					<View>
						<Text className="text-[#F9C513] text-[11px] font-semibold tracking-[2px] uppercase">
							Requests
						</Text>
						<Text className="text-2xl font-bold text-text-primary mt-0.5">
							Pending client requests
						</Text>
					</View>
				</View>

				{loading && !data ? (
					<PremiumLoadingContent embedded message="Please wait.." />
				) : pendingRequests.length === 0 ? (
					<View className="bg-bg-primary rounded-2xl p-8 items-center border border-[#2C2C2E]">
						<Ionicons name="checkmark-done" size={56} color="#8E8E93" />
						<Text className="text-text-primary font-semibold mt-4 text-center">
							No pending requests
						</Text>
						<Text className="text-text-secondary text-sm mt-2 text-center">
							When members request you as their coach, they will appear here.
						</Text>
					</View>
				) : (
					<View className="gap-3">
						{pendingRequests.map((req: any) => {
							const clientName = `${req.client?.firstName || ''} ${req.client?.lastName || ''}`.trim() || 'Unknown';
							return (
								<View
									key={req.id}
									className="bg-bg-primary rounded-2xl p-4 border border-[#2C2C2E]"
								>
									<View className="flex-row items-start justify-between mb-2">
										<View className="flex-1">
											<Text className="text-text-primary font-semibold text-base">
												{clientName}
											</Text>
											{req.client?.email ? (
												<Text className="text-text-secondary text-sm mt-0.5">
													{req.client.email}
												</Text>
											) : null}
										</View>
										<Text className="text-text-secondary text-xs">
											{formatDate(req.createdAt)}
										</Text>
									</View>
									{req.message ? (
										<Text className="text-text-secondary text-sm mb-3" numberOfLines={3}>
											{req.message}
										</Text>
									) : null}
									<View className="flex-row gap-3">
										<TouchableOpacity
											onPress={() =>
												setConfirmRequest({
													id: req.id,
													action: 'approve',
													clientName,
												})
											}
											disabled={updating}
											className="flex-1 bg-green-500/20 border border-green-500/40 rounded-xl py-3 flex-row items-center justify-center gap-2"
										>
											<Ionicons name="checkmark-circle" size={20} color="#22C55E" />
											<Text className="text-green-400 font-semibold">Approve</Text>
										</TouchableOpacity>
										<TouchableOpacity
											onPress={() =>
												setConfirmRequest({
													id: req.id,
													action: 'reject',
													clientName,
												})
											}
											disabled={updating}
											className="flex-1 bg-red-500/20 border border-red-500/40 rounded-xl py-3 flex-row items-center justify-center gap-2"
										>
											<Ionicons name="close-circle" size={20} color="#EF4444" />
											<Text className="text-red-400 font-semibold">Reject</Text>
										</TouchableOpacity>
									</View>
								</View>
							);
						})}
					</View>
				)}
			</ScrollView>

			<ConfirmModal
				visible={!!confirmRequest}
				title={confirmRequest?.action === 'approve' ? 'Approve request' : 'Reject request'}
				message={
					confirmRequest?.action === 'approve'
						? `Add ${confirmRequest?.clientName} as your client?`
						: `Reject ${confirmRequest?.clientName}'s request?`
				}
				variant={confirmRequest?.action === 'approve' ? 'success' : 'danger'}
				confirmLabel={confirmRequest?.action === 'approve' ? 'Approve' : 'Reject'}
				cancelLabel="Cancel"
				onConfirm={handleConfirm}
				onCancel={() => setConfirmRequest(null)}
				loading={updating}
			/>
		</FixedView>
	);
};

export default CoachRequests;
