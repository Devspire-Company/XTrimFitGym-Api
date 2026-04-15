import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type CoachScheduleCalendarProps = {
	selectedDay: string;
	/** Days with at least one scheduled session (gold dot). */
	sessionDays: Set<string>;
	/** Days with at least one door / biometric check-in record (green check). */
	attendanceDays: Set<string>;
	onDayPress: (dateString: string) => void;
	/** When false (e.g. “Upcoming” list), only dots/today ring show — no gold fill for selected. */
	highlightSelected: boolean;
};

function parseKey(key: string): { y: number; m: number; day: number } | null {
	const p = key.split('-').map((x) => parseInt(x, 10));
	if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return null;
	return { y: p[0], m: p[1] - 1, day: p[2] };
}

function localKeyFromDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): (number | null)[][] {
	const firstDow = new Date(year, month, 1).getDay();
	const dim = new Date(year, month + 1, 0).getDate();
	const cells: (number | null)[] = [];
	for (let i = 0; i < firstDow; i++) cells.push(null);
	for (let d = 1; d <= dim; d++) cells.push(d);
	while (cells.length % 7 !== 0) cells.push(null);
	const rows: (number | null)[][] = [];
	for (let i = 0; i < cells.length; i += 7) {
		rows.push(cells.slice(i, i + 7));
	}
	return rows;
}

export function CoachScheduleCalendar({
	selectedDay,
	sessionDays,
	attendanceDays,
	onDayPress,
	highlightSelected,
}: CoachScheduleCalendarProps) {
	const parsed = parseKey(selectedDay);
	const [viewY, setViewY] = useState(parsed?.y ?? new Date().getFullYear());
	const [viewM, setViewM] = useState(parsed?.m ?? new Date().getMonth());

	useEffect(() => {
		const p = parseKey(selectedDay);
		if (p) {
			setViewY(p.y);
			setViewM(p.m);
		}
	}, [selectedDay]);

	const todayKey = localKeyFromDate(new Date());
	const grid = useMemo(() => buildMonthGrid(viewY, viewM), [viewY, viewM]);

	const goPrev = () => {
		if (viewM === 0) {
			setViewM(11);
			setViewY((y) => y - 1);
		} else setViewM((m) => m - 1);
	};

	const goNext = () => {
		if (viewM === 11) {
			setViewM(0);
			setViewY((y) => y + 1);
		} else setViewM((m) => m + 1);
	};

	const monthLabel = new Date(viewY, viewM, 1).toLocaleDateString('en-US', {
		month: 'long',
		year: 'numeric',
	});

	const keyFor = (d: number) =>
		`${viewY}-${String(viewM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

	return (
		<View style={styles.wrap}>
			<View style={styles.header}>
				<TouchableOpacity onPress={goPrev} hitSlop={12} accessibilityLabel='Previous month'>
					<Ionicons name='chevron-back' size={22} color='#F9C513' />
				</TouchableOpacity>
				<Text style={styles.monthTitle}>{monthLabel}</Text>
				<TouchableOpacity onPress={goNext} hitSlop={12} accessibilityLabel='Next month'>
					<Ionicons name='chevron-forward' size={22} color='#F9C513' />
				</TouchableOpacity>
			</View>
			<View style={styles.weekRow}>
				{WEEKDAYS.map((w) => (
					<Text key={w} style={styles.weekLabel}>
						{w}
					</Text>
				))}
			</View>
			{grid.map((week, wi) => (
				<View key={wi} style={styles.week}>
					{week.map((day, di) => {
						if (day == null) {
							return <View key={`e-${wi}-${di}`} style={styles.dayCell} />;
						}
						const key = keyFor(day);
						const isSel = highlightSelected && key === selectedDay;
						const isToday = key === todayKey;
						const hasSession = sessionDays.has(key);
						const hasAttendance = attendanceDays.has(key);
						return (
							<TouchableOpacity
								key={key}
								style={[
									styles.dayCell,
									isSel && styles.daySel,
									isToday && !isSel && styles.dayToday,
								]}
								onPress={() => onDayPress(key)}
								activeOpacity={0.7}
							>
								<Text style={[styles.dayNum, isSel && styles.dayNumSel]}>{day}</Text>
								<View style={styles.markersRow}>
									{hasSession ? (
										<View style={[styles.dot, isSel && styles.dotOnSelected]} />
									) : (
										<View style={styles.markerSlot} />
									)}
									{hasAttendance ? (
										<Ionicons
											name='checkmark-circle'
											size={12}
											color={isSel ? '#166534' : '#34C759'}
										/>
									) : (
										<View style={styles.markerSlot} />
									)}
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		paddingVertical: 8,
		paddingHorizontal: 4,
		backgroundColor: '#1C1C1E',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
		paddingHorizontal: 4,
	},
	monthTitle: {
		color: '#F5F5F5',
		fontSize: 16,
		fontWeight: '700',
	},
	weekRow: {
		flexDirection: 'row',
		marginBottom: 6,
	},
	weekLabel: {
		flex: 1,
		textAlign: 'center',
		color: '#F9C513',
		fontSize: 11,
		fontWeight: '600',
	},
	week: {
		flexDirection: 'row',
	},
	dayCell: {
		flex: 1,
		minHeight: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
		paddingVertical: 4,
	},
	daySel: {
		backgroundColor: '#F9C513',
	},
	dayToday: {
		borderWidth: 1,
		borderColor: '#F9C513',
	},
	dayNum: {
		color: '#E5E7EB',
		fontSize: 14,
		fontWeight: '500',
	},
	dayNumSel: {
		color: '#111827',
		fontWeight: '700',
	},
	markersRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 3,
		marginTop: 2,
		minHeight: 14,
	},
	markerSlot: {
		width: 12,
		height: 12,
	},
	dot: {
		width: 5,
		height: 5,
		borderRadius: 2.5,
		backgroundColor: '#F9C513',
	},
	dotOnSelected: {
		backgroundColor: '#92400E',
	},
});
