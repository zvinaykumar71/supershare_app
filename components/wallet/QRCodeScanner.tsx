import { Colors } from '@/Constants/Colors';
import { useConfirmQRPayment } from '@/hooks/useWallet';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface QRCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function QRCodeScanner({ visible, onClose, onPaymentSuccess }: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const confirmPaymentMutation = useConfirmQRPayment();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string; type: string }) => {
    if (scanned) return;

    try {
      const parsedData = JSON.parse(data);
      // Validate QR data structure - must have qrCode (main identifier) or rideId + amount
      if (!parsedData.qrCode && (!parsedData.rideId || !parsedData.amount)) {
        throw new Error('Invalid QR code format');
      }
      // Store the parsed data with qrCode for payment confirmation
      setQrData({
        ...parsedData,
        qrCode: parsedData.qrCode || parsedData.qr_code || data, // Use qrCode if available, otherwise use full data
      });
      setScanned(true);
    } catch {
      Alert.alert('Invalid QR Code', 'This QR code is not valid for payment');
      setScanned(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!qrData) return;

    try {
      // Send qrCode to backend for payment confirmation
      const paymentData = {
        qrCode: qrData.qrCode || qrData.qr_code || JSON.stringify(qrData)
      };

      const result = await confirmPaymentMutation.mutateAsync(paymentData as any);

      Alert.alert(
        'Payment Successful',
        `Payment of ${formatCurrency(qrData.amount || (result as any)?.payment?.amount || 0)} has been completed successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setQrData(null);
              onClose();
              onPaymentSuccess?.();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Payment Failed',
        error?.response?.data?.message || error?.message || 'Failed to process payment. Please try again.'
      );
      setScanned(false);
      setQrData(null);
    }
  };

  const handleReset = () => {
    setScanned(false);
    setQrData(null);
  };

  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Requesting camera permission...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="camera-outline" size={64} color={Colors.danger} />
            <Text style={styles.errorTitle}>Camera Permission Required</Text>
            <Text style={styles.errorText}>
              Please enable camera permission to scan QR codes
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Scanner */}
        {!scanned ? (
          <View style={styles.scannerContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={styles.corner} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
            <View style={styles.instructions}>
              <Ionicons name="qr-code-outline" size={32} color="white" />
              <Text style={styles.instructionText}>
                Position the QR code within the frame
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.confirmContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.confirmTitle}>QR Code Scanned</Text>

            {qrData && (
              <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ride ID:</Text>
                  <Text style={styles.detailValue}>{qrData.rideId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(qrData.amount || 0)}
                  </Text>
                </View>
                {qrData.paymentId && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment ID:</Text>
                    <Text style={styles.detailValue}>{qrData.paymentId}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmPayment}
                disabled={confirmPaymentMutation.isPending}
              >
                {confirmPaymentMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleReset}>
                <Text style={styles.cancelButtonText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 32,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  confirmContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 32,
  },
  paymentDetails: {
    width: '100%',
    backgroundColor: Colors.lightGray + '40',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
