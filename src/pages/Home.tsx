import { useEffect, useState } from 'react';
import {
  IonFab,
  IonFabButton,
  IonIcon,
  IonPage,
  IonContent,
  IonAlert,
  IonButton,
} from '@ionic/react';
import { camera, close } from 'ionicons/icons';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

const Home: React.FC = () => {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (status.granted === false) {
        setError('Aplikace potřebuje přístup ke kameře.');
      }
    };

    checkPermission();
  }, []);

  const startScan = async () => {
    try {
      document.body.classList.add('scanner-active'); // Skryje obsah pod skenerem
      setIsScanning(true);
      const result = await BarcodeScanner.startScan();
      document.body.classList.remove('scanner-active');
      setIsScanning(false);

      if (result.hasContent) {
        setScannedData(result.content);
      }
    } catch (err) {
      setError('Nepodařilo se spustit skener.');
      setIsScanning(false);
    }
  };

  const stopScan = async () => {
    await BarcodeScanner.stopScan();
    document.body.classList.remove('scanner-active');
    setIsScanning(false);
  };

  return (
    <IonPage>
      <IonContent>
        <h1>Naskenovaný kód: {scannedData}</h1>

        {/* Floating Action Button (FAB) */}
        {!isScanning && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={startScan}>
              <IonIcon icon={camera} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Zrušit skenování */}
        {isScanning && (
          <IonButton expand="full" color="danger" onClick={stopScan}>
            <IonIcon icon={close} slot="start" />
            Zrušit skenování
          </IonButton>
        )}

        {/* Chybová hláška */}
        {error && <IonAlert isOpen={true} message={error} buttons={['OK']} />}
      </IonContent>
    </IonPage>
  );
};

export default Home;
