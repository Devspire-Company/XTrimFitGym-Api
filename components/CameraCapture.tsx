import ConfirmModal from '@/components/ConfirmModal';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';

/** ISO/IEC 7810 ID-1 width ÷ height (credit card / typical ID). */
const ID1_ASPECT_WIDTH_OVER_HEIGHT = 85.6 / 53.98;

interface CameraCaptureProps {
	visible: boolean;
	onClose: () => void;
	onCapture: (uri: string) => void;
	angle: 'front' | 'rightSide' | 'leftSide' | 'back';
	angleLabel: string;
	/** When set, replaces the header title (e.g. ID verification instead of progress angle). */
	titleOverride?: string;
	/** Replaces the large overlay label on the live camera (defaults to `angleLabel`). */
	overlayLabel?: string;
	/** Initial camera facing when the modal opens. */
	initialFacing?: CameraType;
	/** Show dimmed mask + frame matching ID-1 proportions (government ID size guide). */
	idCardFrameGuide?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
	visible,
	onClose,
	onCapture,
	angle,
	angleLabel,
	titleOverride,
	overlayLabel,
	initialFacing = 'back',
	idCardFrameGuide = false,
}) => {
	const { width: winW, height: winH } = useWindowDimensions();
	const [facing, setFacing] = useState<CameraType>(initialFacing);
	const [cameraLayout, setCameraLayout] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [permission, requestPermission] = useCameraPermissions();
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [isCapturing, setIsCapturing] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		visible: boolean;
		title: string;
		message: string;
		variant: 'danger' | 'neutral' | 'success';
	}>({ visible: false, title: '', message: '', variant: 'neutral' });
	const alertConfirmRef = useRef<(() => void) | null>(null);
	const cameraRef = useRef<any>(null);

	useEffect(() => {
		if (visible) {
			setCapturedImage(null);
			setFacing(initialFacing);
			setCameraLayout(null);
		}
	}, [visible, initialFacing]);

	const idFrameLayout = useMemo(() => {
		if (!idCardFrameGuide) return null;
		const sw = Math.max(240, cameraLayout?.width ?? 0);
		const sh = Math.max(360, cameraLayout?.height ?? 0);
		const maxH = sh * 0.38;
		const maxW = sw * 0.9;
		let cardW = maxW;
		let cardH = cardW / ID1_ASPECT_WIDTH_OVER_HEIGHT;
		if (cardH > maxH) {
			cardH = maxH;
			cardW = cardH * ID1_ASPECT_WIDTH_OVER_HEIGHT;
		}
		const left = (sw - cardW) / 2;
		const top = sh * 0.12 + (sh * 0.55 - cardH) / 2;
		return { sw, sh, cardW, cardH, left, top };
	}, [cameraLayout?.height, cameraLayout?.width, idCardFrameGuide, winH, winW]);

	const closeAlertModal = () => {
		alertConfirmRef.current?.();
		alertConfirmRef.current = null;
		setAlertModal((p) => ({ ...p, visible: false }));
	};

	// Permission request modal
	if (!permission) {
		return (
			<>
				<Modal
					visible={visible}
					animationType='fade'
					transparent={false}
					onRequestClose={onClose}
				>
					<View style={styles.modalContainer}>
						<View style={styles.modalContent}>
							<ActivityIndicator size='large' color='#F9C513' />
							<Text style={styles.modalText}>
								Requesting camera permission...
							</Text>
						</View>
					</View>
				</Modal>
				<ConfirmModal
					visible={alertModal.visible}
					title={alertModal.title}
					message={alertModal.message}
					variant={alertModal.variant}
					confirmLabel="OK"
					onConfirm={closeAlertModal}
					onCancel={closeAlertModal}
					hideCancel
				/>
			</>
		);
	}

	if (!permission.granted) {
		return (
			<>
			<Modal
				visible={visible}
				animationType='slide'
				transparent={true}
				onRequestClose={onClose}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Ionicons name='camera-outline' size={64} color='#F9C513' />
						<Text style={styles.modalTitle}>Camera Permission Required</Text>
						<Text style={styles.modalText}>
							We need access to your camera to capture progress photos. Please
							grant camera permission to continue.
						</Text>
						<TouchableOpacity
							onPress={async () => {
								const result = await requestPermission();
								if (!result.granted) {
									alertConfirmRef.current = onClose;
									setAlertModal({
										visible: true,
										title: 'Permission Denied',
										message: 'Camera permission is required to capture progress photos. Please enable it in your device settings.',
										variant: 'neutral',
									});
								}
							}}
							style={styles.modalButton}
						>
							<Text style={styles.modalButtonText}>Grant Permission</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={onClose}
							style={[styles.modalButton, styles.modalCancelButton]}
						>
							<Text
								style={[styles.modalButtonText, styles.modalCancelButtonText]}
							>
								Cancel
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			<ConfirmModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
				confirmLabel="OK"
				onConfirm={closeAlertModal}
				onCancel={closeAlertModal}
				hideCancel
			/>
			</>
		);
	}

	if (!visible) return null;

	const handleCapture = async () => {
		if (!cameraRef.current) return;

		setIsCapturing(true);
		try {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.6,
				base64: false,
			});

			if (photo?.uri) {
				let finalUri = photo.uri;

				if (
					idCardFrameGuide &&
					idFrameLayout &&
					cameraLayout &&
					typeof photo.width === 'number' &&
					typeof photo.height === 'number'
				) {
					const scaleX = photo.width / cameraLayout.width;
					const scaleY = photo.height / cameraLayout.height;

					const rawX = Math.round(idFrameLayout.left * scaleX);
					const rawY = Math.round(idFrameLayout.top * scaleY);
					const rawW = Math.round(idFrameLayout.cardW * scaleX);
					const rawH = Math.round(idFrameLayout.cardH * scaleY);

					const originX = Math.max(0, Math.min(rawX, photo.width - 1));
					const originY = Math.max(0, Math.min(rawY, photo.height - 1));
					const width = Math.max(
						1,
						Math.min(rawW, photo.width - originX)
					);
					const height = Math.max(
						1,
						Math.min(rawH, photo.height - originY)
					);

					const cropped = await ImageManipulator.manipulateAsync(
						photo.uri,
						[{ crop: { originX, originY, width, height } }],
						{ compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
					);
					finalUri = cropped.uri;
				}

				setCapturedImage(finalUri);
			}
		} catch (error) {
			setAlertModal({
				visible: true,
				title: 'Error',
				message: 'Failed to capture photo. Please try again.',
				variant: 'danger',
			});
		} finally {
			setIsCapturing(false);
		}
	};

	const handleRetake = () => {
		setCapturedImage(null);
	};

	const handleUsePhoto = () => {
		if (capturedImage) {
			onCapture(capturedImage);
			setCapturedImage(null);
		}
	};

	return (
		<>
		<Modal
			visible={visible}
			animationType='slide'
			transparent={false}
			onRequestClose={onClose}
		>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerText}>
						{titleOverride ?? `Capture ${angleLabel}`}
					</Text>
					<TouchableOpacity onPress={onClose}>
						<Ionicons name='close' size={28} color='#fff' />
					</TouchableOpacity>
				</View>

				{capturedImage ? (
					<View style={styles.previewContainer}>
						<Image source={{ uri: capturedImage }} style={styles.preview} />
						<View style={styles.previewActions}>
							<TouchableOpacity
								onPress={handleRetake}
								style={[styles.actionButton, styles.retakeButton]}
							>
								<Ionicons name='refresh' size={24} color='#fff' />
								<Text style={styles.actionButtonText}>Retake</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleUsePhoto}
								style={[styles.actionButton, styles.useButton]}
							>
								<Ionicons name='checkmark' size={24} color='#fff' />
								<Text style={styles.actionButtonText}>Use Photo</Text>
							</TouchableOpacity>
						</View>
					</View>
				) : (
					<View style={styles.cameraContainer}>
						<CameraView
							ref={cameraRef}
							style={styles.camera}
							facing={facing}
							onLayout={(e) => {
								const { width, height } = e.nativeEvent.layout;
								if (width > 0 && height > 0) {
									setCameraLayout({ width, height });
								}
							}}
						>
							<View style={styles.overlay}>
								{idFrameLayout ? (
									<View
										pointerEvents='none'
										style={[
											StyleSheet.absoluteFillObject,
											{ width: idFrameLayout.sw, height: idFrameLayout.sh },
										]}
									>
										<View
											style={{
												position: 'absolute',
												left: 0,
												right: 0,
												top: 0,
												height: idFrameLayout.top,
												backgroundColor: 'rgba(0,0,0,0.55)',
											}}
										/>
										<View
											style={{
												position: 'absolute',
												left: 0,
												top: idFrameLayout.top,
												width: idFrameLayout.left,
												height: idFrameLayout.cardH,
												backgroundColor: 'rgba(0,0,0,0.55)',
											}}
										/>
										<View
											style={{
												position: 'absolute',
												right: 0,
												top: idFrameLayout.top,
												width: idFrameLayout.left,
												height: idFrameLayout.cardH,
												backgroundColor: 'rgba(0,0,0,0.55)',
											}}
										/>
										<View
											style={{
												position: 'absolute',
												left: 0,
												right: 0,
												top: idFrameLayout.top + idFrameLayout.cardH,
												height: Math.max(0, idFrameLayout.sh - idFrameLayout.top - idFrameLayout.cardH),
												backgroundColor: 'rgba(0,0,0,0.55)',
											}}
										/>
										<View
											style={{
												position: 'absolute',
												left: idFrameLayout.left,
												top: idFrameLayout.top,
												width: idFrameLayout.cardW,
												height: idFrameLayout.cardH,
												borderRadius: 10,
												borderWidth: 3,
												borderColor: '#F9C513',
												backgroundColor: 'transparent',
											}}
										/>
										<Text
											style={{
												position: 'absolute',
												left: idFrameLayout.left,
												top: idFrameLayout.top + idFrameLayout.cardH + 8,
												width: idFrameLayout.cardW,
												textAlign: 'center',
												color: '#fff',
												fontSize: 12,
												fontWeight: '600',
												textShadowColor: 'rgba(0,0,0,0.85)',
												textShadowRadius: 4,
											}}
										>
											Align ID inside frame
										</Text>
									</View>
								) : null}
								<View style={styles.angleLabelContainer}>
									<Text style={styles.angleLabel}>{overlayLabel ?? angleLabel}</Text>
								</View>
								<View style={styles.cameraControls}>
									{idCardFrameGuide ? (
										<View style={styles.placeholder} />
									) : (
										<TouchableOpacity
											onPress={() =>
												setFacing(facing === 'back' ? 'front' : 'back')
											}
											style={styles.flipButton}
										>
											<Ionicons name='camera-reverse' size={32} color='#fff' />
										</TouchableOpacity>
									)}
									<TouchableOpacity
										onPress={handleCapture}
										disabled={isCapturing}
										style={styles.captureButton}
									>
										{isCapturing ? (
											<ActivityIndicator size='small' color='#fff' />
										) : (
											<View style={styles.captureButtonInner} />
										)}
									</TouchableOpacity>
									<View style={styles.placeholder} />
								</View>
							</View>
						</CameraView>
					</View>
				)}
			</View>
		</Modal>
		<ConfirmModal
			visible={alertModal.visible}
			title={alertModal.title}
			message={alertModal.message}
			variant={alertModal.variant}
			confirmLabel="OK"
			onConfirm={closeAlertModal}
			onCancel={closeAlertModal}
			hideCancel
		/>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	modalContainer: {
		flex: 1,
		backgroundColor: '#1C1C1E',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: '#1C1C1E',
		borderRadius: 20,
		padding: 30,
		alignItems: 'center',
		width: '90%',
		maxWidth: 400,
		borderWidth: 1,
		borderColor: '#F9C513',
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#fff',
		marginTop: 20,
		marginBottom: 10,
		textAlign: 'center',
	},
	modalText: {
		fontSize: 16,
		color: '#8E8E93',
		textAlign: 'center',
		marginBottom: 30,
		lineHeight: 24,
	},
	modalButton: {
		backgroundColor: '#F9C513',
		paddingVertical: 14,
		paddingHorizontal: 32,
		borderRadius: 10,
		marginTop: 10,
		width: '100%',
		alignItems: 'center',
	},
	modalButtonText: {
		color: '#000',
		fontSize: 16,
		fontWeight: '600',
	},
	modalCancelButton: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: '#8E8E93',
	},
	modalCancelButtonText: {
		color: '#8E8E93',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		paddingTop: 50,
		backgroundColor: '#000',
	},
	headerText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
	},
	cameraContainer: {
		flex: 1,
	},
	camera: {
		flex: 1,
	},
	overlay: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'space-between',
	},
	angleLabelContainer: {
		alignItems: 'center',
		paddingTop: 20,
	},
	angleLabel: {
		fontSize: 18,
		fontWeight: '600',
		color: '#fff',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
	},
	cameraControls: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		paddingBottom: 40,
	},
	flipButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	captureButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#fff',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 4,
		borderColor: '#F9C513',
	},
	captureButtonInner: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: '#F9C513',
	},
	placeholder: {
		width: 60,
	},
	previewContainer: {
		flex: 1,
		backgroundColor: '#000',
	},
	preview: {
		flex: 1,
		width: '100%',
		resizeMode: 'contain',
	},
	previewActions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 20,
		backgroundColor: '#000',
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		gap: 8,
	},
	retakeButton: {
		backgroundColor: '#8E8E93',
	},
	useButton: {
		backgroundColor: '#F9C513',
	},
	actionButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
});

export default CameraCapture;
