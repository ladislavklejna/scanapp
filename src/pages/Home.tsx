import React, { useState } from 'react';
// import { BarcodeScanning } from '@capacitor-mlkit/barcode-scanning';
import { IonButton, IonContent, IonPage, IonText } from '@ionic/react';
import * as MLKit from '@capacitor-mlkit/barcode-scanning';
// import BarcodeScanner from '@capacitor-mlkit/barcode-scanning';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

const BarcodeScan: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const startScan = async () => {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes.length > 0) {
        setScannedCode(result.barcodes[0].rawValue);
      } else {
        setScannedCode('Žádný kód nenačten.');
      }
    } catch (error) {
      console.error('Chyba při skenování:', error);
      setScannedCode('Chyba při skenování.');
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonButton expand="full" onClick={startScan}>
          📷 Spustit skenování
        </IonButton>

        {scannedCode && (
          <IonText>
            <h2>Načtený kód:</h2>
            <p>{scannedCode}</p>
          </IonText>
        )}
        <IonButton
          color="danger"
          expand="full"
          onClick={() => setScannedCode(null)}
        >
          ❌ Zrušit skenování
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default BarcodeScan;
