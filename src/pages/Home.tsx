import React, { useState, useEffect } from 'react';
import { IonButton, IonContent, IonPage, IonText, IonImg } from '@ionic/react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import './Home.css';
const BarcodeScan: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [item, setItem] = useState<{
    id: number;
    ean: string;
    name: string;
    img: string;
  } | null>(null);
  const [database, setDatabase] = useState<any[]>([]);

  // Načtení JSON při startu aplikace
  useEffect(() => {
    fetch('/database.json')
      .then((res) => res.json())
      .then((data) => setDatabase(data))
      .catch((error) => console.error('Chyba při načítání databáze:', error));
  }, []);

  const startScan = async () => {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes.length > 0) {
        const code = result.barcodes[0].rawValue;
        // const code = '8594033198633';
        setScannedCode(code);
        findItemInDatabase(code);
      } else {
        setScannedCode('Žádný kód nenačten.');
        setItem(null);
      }
    } catch (error) {
      console.error('Chyba při skenování:', error);
      setScannedCode('Chyba při skenování.');
      setItem(null);
    }
  };

  const findItemInDatabase = (code: string) => {
    const foundItem = database.find((item) => item.ean === code);
    if (foundItem) {
      setItem(foundItem);
    } else {
      setItem(null);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="mt"></div>
        <IonButton expand="full" onClick={startScan}>
          📷 Spustit skenování
        </IonButton>

        {scannedCode && (
          <IonText>
            <h2>Načtený kód:</h2>
            <p>{scannedCode}</p>
          </IonText>
        )}

        {item ? (
          <div>
            <h2>{item.name}</h2>
            <IonImg src={item.img} alt={item.name} />
          </div>
        ) : scannedCode ? (
          <p>Produkt nebyl nalezen v databázi.</p>
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default BarcodeScan;
