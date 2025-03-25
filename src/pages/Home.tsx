import React, { useEffect, useState } from 'react';
import { IonButton, IonContent, IonPage, IonText, IonImg } from '@ionic/react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import './Home.css';
// Dummy JSON data pro první spuštění
const dummyData = {
  products: [
    {
      id: 1,
      ean: 8594033198633,
      img: 'public/images/8594033198633.png',
      brand: 'Fresh',
      name: 'Oblátka s čokoládovou náplňou',
    },
    {
      id: 2,
      ean: 5051007168274,
      img: 'public/images/5051007168274.png',
      brand: 'Tesco',
      name: 'Oplatka s lískooříškovou náplní',
    },
    {
      id: 3,
      ean: 4056489725305,
      img: 'public/images/4056489725305.png',
      brand: 'Tastino',
      name: 'Terezka citrónová',
    },
  ],
};

const BarcodeScan: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [item, setItem] = useState<{
    id: number;
    image: string;
    ean: string;
    brand: string;
    name: string;
  } | null>(null);

  // Uloží dummy JSON do telefonu při prvním spuštění
  const saveDummyData = async () => {
    try {
      await Filesystem.writeFile({
        path: 'database.json',
        data: JSON.stringify(dummyData),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      console.log('✅ Dummy JSON uložen!');
    } catch (error) {
      console.error('❌ Chyba při ukládání:', error);
    }
  };

  // Načte data z JSON souboru
  const loadDatabase = async () => {
    try {
      const result = await Filesystem.readFile({
        path: 'database.json',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      // Zajištění, že data jsou string
      const jsonData =
        typeof result.data === 'string'
          ? JSON.parse(result.data)
          : JSON.parse(await result.data.text());

      console.log('📄 Načtený JSON:', jsonData);
      // setMessage('Načtený JSON');
      return jsonData;
    } catch (error) {
      console.error('❌ Chyba při načítání:', error);
      // setMessage('❌ Chyba při načítání:');
      return null;
    }
  };

  // Zkontroluje, zda soubor existuje, jinak uloží dummy data
  const checkAndLoadDatabase = async () => {
    try {
      await Filesystem.stat({
        path: 'database.json',
        directory: Directory.Data,
      });
      console.log('✅ Soubor existuje!');
      return await loadDatabase();
    } catch (error) {
      console.warn('⚠️ Soubor neexistuje, ukládám dummy JSON...');
      await saveDummyData();
      return await loadDatabase();
    }
  };

  // Funkce pro skenování čárového kódu
  const startScan = async () => {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes.length > 0) {
        const scannedValue = result.barcodes[0].rawValue;
        setScannedCode(scannedValue);

        // Načti databázi a najdi odpovídající produkt
        const db = await loadDatabase();
        if (db) {
          const foundItem = db.products.find(
            (p: any) => p.ean === scannedValue,
          );
          setItem(foundItem || null);
        }
      } else {
        setScannedCode('Žádný kód nenačten.');
        setItem(null);
      }
    } catch (error) {
      console.error('Chyba při skenování:', error);
      setScannedCode('Chyba při skenování.');
    }
  };

  useEffect(() => {
    checkAndLoadDatabase();
  }, []);

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

        {item && (
          <div>
            <IonText>
              <h2>Produkt nalezen:</h2>
              <p>{item.brand}</p>
              <p>{item.name}</p>
            </IonText>
            <IonImg src={`assets/images/${item.image}`} alt={item.name} />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default BarcodeScan;
