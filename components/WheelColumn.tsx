import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	FlatList,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Text,
	View,
} from 'react-native';

export const WHEEL_ITEM_HEIGHT = 48;
const VISIBLE_ROWS = 5;
export const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * VISIBLE_ROWS;
export const WHEEL_PAD = (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

function smoothstep01(t: number) {
	const x = Math.max(0, Math.min(1, t));
	return x * x * (3 - 2 * x);
}

export type WheelColumnProps = {
	data: string[];
	selectedIndex: number;
	onSelectIndex: (index: number) => void;
};

export function WheelColumn({ data, selectedIndex, onSelectIndex }: WheelColumnProps) {
	const listRef = useRef<FlatList<string>>(null);
	const [scrollY, setScrollY] = useState(() => selectedIndex * WHEEL_ITEM_HEIGHT);

	const scrollToIndex = useCallback(
		(index: number, animated: boolean) => {
			const i = Math.max(0, Math.min(data.length - 1, index));
			const y = i * WHEEL_ITEM_HEIGHT;
			listRef.current?.scrollToOffset({
				offset: y,
				animated,
			});
			if (!animated) {
				setScrollY(y);
			}
		},
		[data.length],
	);

	const dataKey = data.join('|');
	useEffect(() => {
		scrollToIndex(selectedIndex, false);
		setScrollY(
			Math.max(
				0,
				Math.min(data.length - 1, selectedIndex) * WHEEL_ITEM_HEIGHT,
			),
		);
	}, [selectedIndex, dataKey, data.length, scrollToIndex]);

	const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
		setScrollY(e.nativeEvent.contentOffset.y);
	}, []);

	const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const y = e.nativeEvent.contentOffset.y;
		let i = Math.round(y / WHEEL_ITEM_HEIGHT);
		i = Math.max(0, Math.min(data.length - 1, i));
		onSelectIndex(i);
		scrollToIndex(i, true);
	};

	return (
		<View
			style={{
				flex: 1,
				height: WHEEL_HEIGHT,
				position: 'relative',
				minWidth: 0,
			}}
		>
			<View
				pointerEvents='none'
				style={{
					position: 'absolute',
					left: 4,
					right: 4,
					top: WHEEL_PAD,
					height: WHEEL_ITEM_HEIGHT,
					borderRadius: 10,
					borderWidth: 1,
					borderColor: '#F9C513',
					backgroundColor: 'rgba(249, 197, 19, 0.06)',
					zIndex: 1,
				}}
			/>
			<FlatList
				ref={listRef}
				data={data}
				extraData={scrollY}
				keyExtractor={(item, index) => `${item}-${index}`}
				showsVerticalScrollIndicator={false}
				snapToInterval={WHEEL_ITEM_HEIGHT}
				decelerationRate='normal'
				bounces={false}
				removeClippedSubviews={false}
				contentContainerStyle={{
					paddingTop: WHEEL_PAD,
					paddingBottom: WHEEL_PAD,
				}}
				onScroll={onScroll}
				scrollEventThrottle={8}
				onMomentumScrollEnd={onMomentumScrollEnd}
				getItemLayout={(_, index) => ({
					length: WHEEL_ITEM_HEIGHT,
					offset: WHEEL_ITEM_HEIGHT * index,
					index,
				})}
				renderItem={({ item, index }) => {
					const centerRel = scrollY / WHEEL_ITEM_HEIGHT;
					const dist = Math.abs(index - centerRel);
					const rawBlend = 1 - Math.min(1, dist * 1.15);
					const w = smoothstep01(rawBlend);
					const r = Math.round(lerp(184, 255, w));
					const g = Math.round(lerp(188, 255, w));
					const b = Math.round(lerp(200, 255, w));
					const a = lerp(0.45, 1, w);
					const fontWeight: '400' | '500' | '600' | '700' =
						w > 0.65 ? '700' : w > 0.35 ? '600' : '400';

					return (
						<View
							style={{
								height: WHEEL_ITEM_HEIGHT,
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<Text
								style={{
									fontSize: 17,
									fontWeight,
									color: `rgba(${r},${g},${b},${a})`,
								}}
							>
								{item}
							</Text>
						</View>
					);
				}}
			/>
		</View>
	);
}
