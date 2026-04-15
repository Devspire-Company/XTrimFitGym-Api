import FixedView from '@/components/FixedView';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type PremiumLoadingContentProps = {
	message?: string;
	/** Use inside cards/sections (no flex:1) so the bar doesn’t collapse in ScrollViews. */
	embedded?: boolean;
};

/** “Please wait..” + gradient bar — use inside a flex container or full screen. */
export function PremiumLoadingContent({
	message = 'Please wait..',
	embedded = false,
}: PremiumLoadingContentProps) {
	const dot = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const dotLoop = Animated.loop(
			Animated.timing(dot, {
				toValue: 1,
				duration: 1400,
				easing: Easing.linear,
				useNativeDriver: true,
			}),
		);
		dotLoop.start();
		return () => {
			dotLoop.stop();
		};
	}, [dot]);

	const barSlide = dot.interpolate({
		inputRange: [0, 0.5, 1],
		outputRange: [-56, 56, -56],
	});

	return (
		<View
			className={
				embedded
					? 'justify-center items-center px-8 py-6'
					: 'flex-1 justify-center items-center px-8'
			}
			style={embedded ? styles.embeddedWrap : undefined}
		>
			<Text className='text-text-primary text-lg font-medium text-center'>
				{message}
			</Text>
			<View
				className={
					embedded
						? 'mt-6 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]'
						: 'mt-8 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]'
				}
				style={styles.track}
			>
				<Animated.View
					style={[styles.barPill, { transform: [{ translateX: barSlide }] }]}
				>
					<LinearGradient
						colors={['#C41820', '#F9C513']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>
			</View>
		</View>
	);
}

const AuthProcessingScreen = () => {
	return (
		<FixedView className='flex-1 bg-bg-darker'>
			<PremiumLoadingContent />
		</FixedView>
	);
};

const styles = StyleSheet.create({
	embeddedWrap: {
		minHeight: 168,
		width: '100%',
	},
	track: {
		width: 192,
		height: 4,
		alignSelf: 'center',
	},
	barPill: {
		width: 72,
		height: 4,
		borderRadius: 2,
		overflow: 'hidden',
		alignSelf: 'center',
	},
});

export default AuthProcessingScreen;
