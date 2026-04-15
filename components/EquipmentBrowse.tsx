import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import TabHeader from '@/components/TabHeader';
import { GET_EQUIPMENTS_QUERY } from '@/graphql/queries';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
	Dimensions,
	FlatList,
	Image,
	Modal,
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export type EquipmentStatusValue = 'AVAILABLE' | 'DAMAGED' | 'UNDERMAINTENANCE';

export type EquipmentRow = {
	id: string;
	name: string;
	imageUrl: string;
	description?: string | null;
	notes?: string | null;
	sortOrder: number;
	status: EquipmentStatusValue;
	createdAt?: string | null;
	updatedAt?: string | null;
};

const { width, height: windowHeight } = Dimensions.get('window');
const PAD = 20;
const GAP = 12;
const CARD_WIDTH = (width - PAD * 2 - GAP) / 2;
const IMG_HEIGHT = CARD_WIDTH * 1.1;
/** Full photo in detail modal: fits on screen, whole image visible */
const MODAL_IMAGE_MAX_H = Math.min(windowHeight * 0.42, width * 0.95, 420);

function statusLabel(s: EquipmentStatusValue): string {
	switch (s) {
		case 'DAMAGED':
			return 'Damaged';
		case 'UNDERMAINTENANCE':
			return 'Under maintenance';
		default:
			return 'Available';
	}
}

function statusColor(s: EquipmentStatusValue): string {
	switch (s) {
		case 'DAMAGED':
			return '#EF4444';
		case 'UNDERMAINTENANCE':
			return '#F59E0B';
		default:
			return '#10B981';
	}
}

function normalizeStatus(raw: unknown): EquipmentStatusValue {
	const u = String(raw ?? 'AVAILABLE').toUpperCase();
	if (u === 'DAMAGED') return 'DAMAGED';
	if (u === 'UNDERMAINTENANCE') return 'UNDERMAINTENANCE';
	return 'AVAILABLE';
}

type Props = { showTabHeader?: boolean };

export function EquipmentBrowse({ showTabHeader = true }: Props) {
	const [refreshing, setRefreshing] = useState(false);
	const { data, loading, error, refetch } = useQuery(GET_EQUIPMENTS_QUERY, {
		fetchPolicy: 'cache-and-network',
	});

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await refetch();
		} finally {
			setRefreshing(false);
		}
	}, [refetch]);
	const rawList = (data?.getEquipments ?? []) as Partial<EquipmentRow>[];
	const list: EquipmentRow[] = rawList.map((row) => ({
		id: String(row.id),
		name: String(row.name),
		imageUrl: String(row.imageUrl),
		description: row.description ?? null,
		notes: row.notes ?? null,
		sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
		status: normalizeStatus(row.status),
		createdAt: row.createdAt ?? null,
		updatedAt: row.updatedAt ?? null,
	}));
	const [detail, setDetail] = useState<EquipmentRow | null>(null);

	return (
		<View style={{ flex: 1 }} className="bg-[#0D0D0D]">
			{showTabHeader ? <TabHeader /> : null}
			<View className="px-5 pt-4 pb-5">
				<View className="flex-row items-center gap-3 mb-1">
					<View className="w-11 h-11 rounded-2xl bg-[#F9C513]/15 border border-[#F9C513]/25 items-center justify-center">
						<Ionicons name="barbell" size={24} color="#F9C513" />
					</View>
					<View>
						<Text className="text-[#F9C513] text-[11px] font-semibold tracking-[2px] uppercase">
							Equipment
						</Text>
						<Text className="text-2xl font-bold text-white mt-0.5">
							What we have for you
						</Text>
					</View>
				</View>
			</View>
			{loading && !data?.getEquipments?.length ? (
				<View style={styles.centered}>
					<PremiumLoadingContent message="Please wait.." />
				</View>
			) : error ? (
				<View style={styles.centered}>
					<Text style={styles.errorText}>Could not load equipment.</Text>
				</View>
			) : (
				<FlatList
					data={list}
					keyExtractor={(item) => item.id}
					contentContainerStyle={[
						styles.list,
						list.length === 0 ? { flexGrow: 1 } : undefined,
					]}
					numColumns={2}
					columnWrapperStyle={styles.row}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor="#F9C513"
							colors={Platform.OS === 'android' ? ['#F9C513'] : undefined}
						/>
					}
					renderItem={({ item }) => (
						<TouchableOpacity
							activeOpacity={0.85}
							onPress={() => setDetail(item)}
							style={[styles.card, { width: CARD_WIDTH }]}
						>
							<Image
								source={{ uri: item.imageUrl }}
								style={[styles.image, { width: CARD_WIDTH, height: IMG_HEIGHT }]}
								resizeMode="cover"
							/>
							<View style={[StyleSheet.absoluteFillObject, { justifyContent: 'flex-end' }]} pointerEvents="none">
								<View style={styles.label}>
									<Text style={[styles.statusPill, { color: statusColor(item.status) }]}>
										{statusLabel(item.status)}
									</Text>
									<Text style={styles.labelText} numberOfLines={2}>
										{item.name}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					)}
				/>
			)}

			<Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Equipment details</Text>
							<TouchableOpacity onPress={() => setDetail(null)} hitSlop={12}>
								<Ionicons name="close" size={28} color="#fff" />
							</TouchableOpacity>
						</View>
						{detail ? (
							<ScrollView showsVerticalScrollIndicator={false}>
								<View style={styles.modalImageWrap}>
									<Image
										source={{ uri: detail.imageUrl }}
										style={styles.modalImage}
										resizeMode="contain"
									/>
								</View>
								<Text style={styles.detailName}>{detail.name}</Text>
								<Text style={[styles.detailStatus, { color: statusColor(detail.status), marginBottom: 14 }]}>
									{statusLabel(detail.status)}
								</Text>
								<Text style={styles.detailMeta}>Description</Text>
								<Text style={[styles.detailBody, { marginBottom: 14 }]}>
									{detail.description?.trim() ? detail.description : '—'}
								</Text>
								<Text style={styles.detailMeta}>Notes</Text>
								<Text style={styles.detailBody}>
									{detail.notes?.trim() ? detail.notes : '—'}
								</Text>
							</ScrollView>
						) : null}
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: { color: '#8E8E93' },
	list: {
		paddingHorizontal: PAD,
		paddingBottom: 100,
	},
	row: {
		gap: GAP,
		marginBottom: GAP,
	},
	card: {
		backgroundColor: '#1A1A2E',
		borderRadius: 16,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(44, 44, 46, 0.8)',
	},
	image: {
		backgroundColor: '#1A1A2E',
	},
	label: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: 12,
		paddingVertical: 12,
		backgroundColor: 'rgba(13, 13, 13, 0.88)',
		borderTopWidth: 1,
		borderTopColor: 'rgba(249, 197, 19, 0.2)',
	},
	statusPill: {
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 4,
	},
	labelText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '600',
		letterSpacing: 0.2,
		lineHeight: 18,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.75)',
		justifyContent: 'flex-end',
	},
	modalCard: {
		backgroundColor: '#1C1C1E',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '92%',
		paddingHorizontal: 20,
		paddingBottom: 32,
		paddingTop: 12,
		borderWidth: 1,
		borderColor: 'rgba(249, 197, 19, 0.25)',
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	modalTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '700',
	},
	modalImageWrap: {
		width: '100%',
		height: MODAL_IMAGE_MAX_H,
		marginBottom: 16,
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: '#0D0D0D',
		borderWidth: 1,
		borderColor: 'rgba(249, 197, 19, 0.15)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalImage: {
		width: '100%',
		height: '100%',
		backgroundColor: '#0D0D0D',
	},
	detailName: {
		color: '#fff',
		fontSize: 22,
		fontWeight: '700',
		marginBottom: 12,
	},
	detailMeta: {
		color: '#8E8E93',
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 6,
	},
	detailBody: {
		color: '#E5E5EA',
		fontSize: 15,
		lineHeight: 22,
	},
	detailStatus: {
		fontSize: 16,
		fontWeight: '700',
	},
});
