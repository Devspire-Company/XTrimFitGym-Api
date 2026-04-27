import { PremiumLoadingContent } from '@/components/AuthProcessingScreen';
import TabHeader from '@/components/TabHeader';
import type { GetEquipmentsQuery } from '@/graphql/generated/types';
import { GET_EQUIPMENTS_QUERY } from '@/graphql/queries';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
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
	quantity: number;
	maintenanceStartedAt?: string | null;
	isArchived?: boolean | null;
	archivedAt?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	isReservedInWindow?: boolean | null;
	reservedQuantityInWindow?: number | null;
	reservationWindowLabel?: string | null;
	upcomingUsages?: Array<{
		sessionId: string;
		sessionName: string;
		date: string;
		startTime: string;
		endTime?: string | null;
		quantity: number;
	}> | null;
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

function statusLabelCompact(s: EquipmentStatusValue): string {
	switch (s) {
		case 'UNDERMAINTENANCE':
			return 'Maintenance';
		default:
			return statusLabel(s);
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

function formatDate(value: string | null | undefined): string {
	if (!value) return 'N/A';
	const parsed = new Date(value);
	if (!Number.isFinite(parsed.getTime())) return 'N/A';
	return parsed.toLocaleDateString('en-PH', {
		timeZone: 'Asia/Manila',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function isArchivedEquipmentRow(row: Partial<EquipmentRow> & Record<string, unknown>): boolean {
	const flag = row.isArchived ?? row.archived ?? row.is_archive;
	if (typeof flag === 'boolean' && flag) return true;
	const archivedAt = row.archivedAt ?? row.archived_at;
	if (typeof archivedAt === 'string' && archivedAt.trim()) return true;
	if (typeof row.notes === 'string' && row.notes.trim()) {
		const rawNotes = row.notes.trim().toLowerCase();
		let decodedNotes = rawNotes;
		try {
			decodedNotes = decodeURIComponent(rawNotes);
		} catch {
			// Keep raw notes if decoding fails.
		}
		return (
			rawNotes.includes('__archived__') ||
			decodedNotes.includes('__archived__') ||
			rawNotes.includes('_archived_|') ||
			decodedNotes.includes('_archived_|') ||
			rawNotes.includes('archived|') ||
			decodedNotes.includes('archived|') ||
			rawNotes.includes('archived:') ||
			decodedNotes.includes('archived:')
		);
	}
	return false;
}

type Props = { showTabHeader?: boolean };

export function EquipmentBrowse({ showTabHeader = true }: Props) {
	const [refreshing, setRefreshing] = useState(false);
	const { data, loading, error, refetch } = useQuery<GetEquipmentsQuery>(GET_EQUIPMENTS_QUERY, {
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
	const rawList = (data?.getEquipments ?? []) as (Partial<EquipmentRow> &
		Record<string, unknown>)[];
	const list: EquipmentRow[] = rawList.map((row) => ({
		id: String(row.id),
		name: String(row.name),
		imageUrl: String(row.imageUrl),
		description: row.description ?? null,
		notes: row.notes ?? null,
		sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : 0,
		status: normalizeStatus(row.status),
		quantity: typeof row.quantity === 'number' && row.quantity >= 0 ? row.quantity : 0,
		maintenanceStartedAt: typeof row.maintenanceStartedAt === 'string' ? row.maintenanceStartedAt : null,
		isArchived: typeof row.isArchived === 'boolean' ? row.isArchived : null,
		archivedAt: typeof row.archivedAt === 'string' ? row.archivedAt : null,
		createdAt: row.createdAt ?? null,
		updatedAt: row.updatedAt ?? null,
		isReservedInWindow:
			typeof row.isReservedInWindow === 'boolean' ? row.isReservedInWindow : null,
		reservedQuantityInWindow:
			typeof row.reservedQuantityInWindow === 'number'
				? row.reservedQuantityInWindow
				: null,
		reservationWindowLabel:
			typeof row.reservationWindowLabel === 'string'
				? row.reservationWindowLabel
				: null,
		upcomingUsages: Array.isArray(row.upcomingUsages)
			? (row.upcomingUsages as any[])
			: [],
	})).filter((row, index) => !isArchivedEquipmentRow(rawList[index]));
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
								<ExpoLinearGradient
									colors={['rgba(13,13,13,0.05)', 'rgba(13,13,13,0.84)']}
									start={{ x: 0.5, y: 0 }}
									end={{ x: 0.5, y: 1 }}
									style={StyleSheet.absoluteFillObject}
								/>
								<View style={styles.label}>
									<View style={styles.labelTopRow}>
										<Text style={styles.labelText} numberOfLines={2} ellipsizeMode="tail">
											{item.name}
										</Text>
									</View>
									<View style={styles.statusRow}>
										<View style={styles.statusPillWrap}>
											<Text style={[styles.statusPill, { color: statusColor(item.status) }]}>
												{statusLabelCompact(item.status)}
											</Text>
										</View>
										{item.isReservedInWindow ? (
											<View style={[styles.statusPillWrap, { marginLeft: 6 }]}>
												<Text style={[styles.statusPill, { color: '#F97316' }]}>
													In use now
												</Text>
											</View>
										) : null}
									</View>
									<View style={styles.stockRow}>
										<Text style={styles.stockMeta}>Qty {item.quantity}</Text>
										<Text
											style={[
												styles.stockMeta,
												item.quantity > 0 ? styles.stockIn : styles.stockOut,
											]}
										>
											{item.quantity > 0 ? 'In stock' : 'Out of stock'}
										</Text>
									</View>
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
								<View style={styles.detailStatusRow}>
									<View style={styles.detailStatusPill}>
										<Text style={[styles.detailStatus, { color: statusColor(detail.status) }]}>
											{statusLabel(detail.status)}
										</Text>
									</View>
									<Text style={[styles.detailBody, styles.detailQty]}>
										Qty {detail.quantity}
									</Text>
								</View>
								{detail.status === 'UNDERMAINTENANCE' ? (
									<Text style={[styles.detailBody, { marginBottom: 14 }]}>
										Under maintenance since: {formatDate(detail.maintenanceStartedAt)}
									</Text>
								) : (
									<Text style={[styles.detailBody, { marginBottom: 14 }]}>
										Availability:{' '}
										{detail.isReservedInWindow
											? 'In use right now'
											: detail.quantity > 0
												? 'In stock'
												: 'Out of stock'}
									</Text>
								)}
								{detail.isReservedInWindow ? (
									<Text style={[styles.detailBody, { marginBottom: 14 }]}>
										Reserved qty now: {detail.reservedQuantityInWindow || 0}
									</Text>
								) : null}
								{(detail.upcomingUsages || []).length > 0 ? (
									<View style={{ marginBottom: 14 }}>
										<Text style={styles.detailMeta}>Upcoming usage</Text>
										{(detail.upcomingUsages || []).slice(0, 3).map((slot) => (
											<Text key={`${slot.sessionId}-${slot.startTime}`} style={styles.detailBody}>
												{slot.sessionName}: {slot.startTime}
												{slot.endTime ? ` - ${slot.endTime}` : ''} (qty {slot.quantity})
											</Text>
										))}
									</View>
								) : null}
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
		borderColor: 'rgba(249, 197, 19, 0.24)',
		shadowColor: '#000',
		shadowOpacity: 0.3,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 6 },
		elevation: 6,
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
		paddingVertical: 8,
		minHeight: 82,
		backgroundColor: 'rgba(13, 13, 13, 0.74)',
		borderTopWidth: 1,
		borderTopColor: 'rgba(249, 197, 19, 0.2)',
	},
	labelTopRow: {
		minHeight: 30,
		justifyContent: 'flex-start',
	},
	statusRow: {
		marginTop: 4,
		minHeight: 20,
		alignItems: 'flex-start',
		justifyContent: 'center',
	},
	statusPillWrap: {
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.2)',
		borderRadius: 999,
		paddingHorizontal: 7,
		paddingVertical: 2,
		backgroundColor: 'rgba(255,255,255,0.05)',
	},
	statusPill: {
		fontSize: 9,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.45,
	},
	labelText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '700',
		letterSpacing: 0.2,
		lineHeight: 16,
	},
	stockRow: {
		marginTop: 5,
		minHeight: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	stockMeta: {
		color: '#D1D5DB',
		fontSize: 11,
		fontWeight: '600',
	},
	stockIn: {
		color: '#34D399',
	},
	stockOut: {
		color: '#F87171',
	},
	stockText: {
		color: '#D1D5DB',
		fontSize: 11,
		fontWeight: '600',
		marginTop: 2,
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
		marginBottom: 10,
	},
	detailStatusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	detailStatusPill: {
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.16)',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
		backgroundColor: 'rgba(255,255,255,0.05)',
	},
	detailQty: {
		fontWeight: '700',
		color: '#E2E8F0',
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
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
});
