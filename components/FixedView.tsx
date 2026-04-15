import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FixedView = ({
	children,
	style,
	className,
	extraTopPadding = 0,
	...rest
}: {
	children?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	className?: string;
	extraTopPadding?: number;
}) => {
	const insets = useSafeAreaInsets();
	return (
		<React.Fragment>
			<StatusBar style='light' backgroundColor='transparent' />
			<View
				style={[
					{
						paddingTop: insets.top + extraTopPadding,
						paddingBottom: insets.bottom,
					},
					style,
				]}
				className={className}
				{...rest}
			>
				{children}
			</View>
		</React.Fragment>
	);
};

export default FixedView;
