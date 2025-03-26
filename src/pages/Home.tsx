import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonPage,
  IonText,
  IonImg,
  IonList,
  IonItem,
  IonRippleEffect,
} from '@ionic/react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import './Home.css';
import { PiBarcodeThin } from 'react-icons/pi';
// Dummy data pro produkty
const dummyData = {
  products: [
    {
      id: 1,
      ean: '8594033198633',
      image: 'images/8594033198633.png', // změněno na 'image'
      brand: 'Fresh',
      name: 'Oblátka s čokoládovou náplňou',
    },
    {
      id: 2,
      ean: '5051007168274',
      image: 'images/5051007168274.png', // změněno na 'image'
      brand: 'Tesco',
      name: 'Oplatka s lískooříškovou náplní',
    },
    {
      id: 3,
      ean: '4056489725305',
      image: 'images/4056489725305.png', // změněno na 'image'
      brand: 'Tastino',
      name: 'Terezka citrónová',
    },
  ],
};

// Funkce pro vyhledání produktu podle EAN
const findProductByEAN = (ean: string) => {
  return dummyData.products.find((p) => p.ean === ean);
};
// Funkce pro získání formátovaného data
const getFormattedTimestamp = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year}--${hour}:${minute}`;
};

// Funkce pro zápis do logu
const saveLog = async (logEntry: {
  code: string;
  result: string;
  timestamp: string;
}) => {
  try {
    const logs = await loadLogs();
    logs.push(logEntry);

    await Filesystem.writeFile({
      path: 'logs.json',
      data: JSON.stringify(logs),
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    console.log('✅ Log zapsán!');
  } catch (error) {
    console.error('❌ Chyba při zapisování do logu:', error);
  }
};

// Funkce pro načítání logů
const loadLogs = async () => {
  try {
    const result = await Filesystem.readFile({
      path: 'logs.json',
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    const logs =
      typeof result.data === 'string'
        ? JSON.parse(result.data)
        : JSON.parse(await result.data.text());
    return logs;
  } catch (error) {
    console.warn('⚠️ Logy nebyly nalezeny, začínám nový log.');
    return []; // Pokud logy neexistují, vrátíme prázdné pole
  }
};

const BarcodeScan: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  // const [item, setItem] = useState<{
  //   id: number;
  //   image: string;
  //   ean: string;
  //   brand: string;
  //   name: string;
  // } | null>(null);
  const [item, setItem] = useState<{
    id: 1;
    image: 'images/8594033198633';
    ean: '8594033198633';
    brand: 'Fresh';
    name: 'Oblátka s čokoládovou náplňou';
  } | null>(null);
  const [logs, setLogs] = useState<any[]>([]); // Stav pro logy

  // Funkce pro skenování čárového kódu
  const startScan = async () => {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes.length > 0) {
        const scannedValue = result.barcodes[0].rawValue;
        setScannedCode(scannedValue);

        // Hledání produktu podle načteného kódu
        const foundItem = findProductByEAN(scannedValue);
        // setItem(foundItem || null);

        // Záznam do logu
        const timestamp = getFormattedTimestamp();
        const resultMessage = foundItem
          ? 'Shoda nalezena'
          : 'Produkt nenalezen';
        await saveLog({ code: scannedValue, result: resultMessage, timestamp });

        // Načteme logy znovu, aby se zobrazily v aplikaci
        const updatedLogs = await loadLogs();
        setLogs(updatedLogs);
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
    loadLogs().then((loadedLogs) => {
      setLogs(loadedLogs); // Načteme logy při startu aplikace
    });
  }, []);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonImg id="logo" src="Mokate.png" alt="logo" />

        <div className="tst">
          <IonButton
            id="photobutton"
            expand="full"
            onClick={startScan}
            shape="round"
          >
            <PiBarcodeThin size={80} />
            {/* <h1>Scanovat</h1> */}
          </IonButton>
          {scannedCode && (
            <IonText class="text-center">
              <p>Načtený kód:</p>
              <h2>{scannedCode}</h2>
            </IonText>
          )}
        </div>

        {/* {item && ( */}
        <div>
          <IonText className="text-center" id="bottom">
            <p>Produkt nalezen:</p>
            <p>Fresh</p>
            <p>Oblátka s čokoládovou náplňou</p>
          </IonText>
          <div className="obalcontainer">
            <IonImg className="obal" src="/images/8594033198633.png" />
          </div>
        </div>
        {/* )} */}

        {/* <IonText>
          <h2>Logy:</h2>
        </IonText> */}

        {/* Zobrazení logů */}
        {/* <IonList>
          {logs.map((log, index) => (
            <IonItem key={index}>
              <IonText>
                <p>
                  <strong>{log.timestamp}</strong> - {log.code}: {log.result}
                </p>
              </IonText>
            </IonItem>
          ))}
        </IonList> */}
      </IonContent>
    </IonPage>
  );
};

export default BarcodeScan;
