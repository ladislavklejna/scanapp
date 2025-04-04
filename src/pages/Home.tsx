import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonPage,
  IonText,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  useIonToast,
} from '@ionic/react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Haptics } from '@capacitor/haptics';
import './Home.css';
import { PiBarcodeThin } from 'react-icons/pi';
import db from '../data/database.json';
// http://10.0.1.51:5000/sharing/t0ukj9DG3
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';

ScreenOrientation.lock({ orientation: 'portrait' });

// const updateDatabase = async () => {
//   try {
//     const response = await fetch('http://10.0.1.51/up/products.json');
//     if (!response.ok) {
//       setMessage('nelze stahnout');
//       throw new Error('❌ Nelze stáhnout JSON');
//     }

//     const jsonData = await response.json();
//     setMessage(jsonData);
//     // Uložit do lokálního úložiště
//     await Filesystem.writeFile({
//       path: 'products.json',
//       data: JSON.stringify(jsonData),
//       directory: Directory.Data,
//       encoding: Encoding.UTF8,
//     });
//     setMessagee('aktualizovano');
//     console.log('✅ JSON databáze aktualizována!');
//   } catch (error) {
//     setMessagee('chyba aktualizace DB');
//     console.error('Chyba při aktualizaci databáze:', error);
//   }
// };
// const downloadImage = async (imageUrl: string, imageName: string) => {
//   try {
//     const response = await fetch(imageUrl);
//     if (!response.ok) throw new Error('❌ Nelze stáhnout obrázek');

//     const blob = await response.blob();
//     const reader = new FileReader();

//     reader.onloadend = async () => {
//       const base64data = reader.result?.toString().split(',')[1];

//       await Filesystem.writeFile({
//         path: `images/${imageName}`,
//         data: base64data || '',
//         directory: Directory.Data,
//         encoding: Encoding.Base64,
//       });

//       console.log(`✅ Obrázek ${imageName} uložen!`);
//     };

//     reader.readAsDataURL(blob);
//   } catch (error) {
//     console.error('Chyba při stahování obrázku:', error);
//   }
// };

// Funkce pro vyhledání produktu podle EAN
const findProductByEAN = (ean: string) => {
  return db.find((p) => p.EANks === ean);
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
  const [backPressed, setBackPressed] = useState(false);
  const [item, setItem] = useState<{
    ItemNo: number;
    // image: string;
    EANks: string;
    // brand: string;
    description: string;
  } | null>(null);
  // const [item, setItem] = useState<{
  //   id: 1;
  //   image: 'images/8594033198633';
  //   ean: '8594033198633';
  //   brand: 'Fresh';
  //   name: 'Oblátka s čokoládovou náplňou';
  // } | null>(null);
  const [logs, setLogs] = useState<any[]>([]); // Stav pro logy

  // Funkce pro skenování čárového kódu
  const startScan = async () => {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes.length > 0) {
        const scannedValue = result.barcodes[0].rawValue;
        setScannedCode(scannedValue);
        Haptics.vibrate({ duration: 200 });
        // Hledání produktu podle načteného kódu
        const foundItem = findProductByEAN(scannedValue);

        setItem(
          foundItem
            ? {
                ItemNo: Number(foundItem.ItemNo), // Převedení na číslo
                EANks: foundItem.EANks,
                description: foundItem.Description || 'Popis není dostupný', // Oprava velkého "D" na malé "d"
              }
            : {
                ItemNo: 0,
                EANks: scannedValue,
                description: 'Produkt nenalezen',
              },
        );

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
    let backButtonListener: any;

    const setupListener = async () => {
      backButtonListener = await App.addListener(
        'backButton',
        async ({ canGoBack }) => {
          if (canGoBack) {
            // Pokud je možné vrátit se zpět (např. v rámci navigace), pustíme standardní chování
            window.history.back();
          } else {
            // Pokud uživatel stiskl zpět dvakrát, ukončíme aplikaci
            if (backPressed) {
              App.exitApp();
            } else {
              // Jinak zobrazíme toast a nastavíme timeout na další možnost ukončení
              setBackPressed(true);
              await Toast.show({
                text: 'Stiskněte znovu pro zavření aplikace',
              });

              setTimeout(() => setBackPressed(false), 2000); // Reset po 2 sekundách
            }
          }
        },
      );
    };

    setupListener();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [backPressed]);

  // useEffect(() => {
  //   loadLogs().then((loadedLogs) => {
  //     setLogs(loadedLogs); // Načteme logy při startu aplikace
  //   });
  // }, []);
  // useEffect(() => {
  //   const fetchAndUpdateDatabase = async () => {
  //     await updateDatabase();
  //   };

  //   fetchAndUpdateDatabase();
  // }, []);
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonImg id="logo" src="Mokate.png" alt="logo" />
        <IonGrid>
          {/* <IonRow>
            <IonCol>
              <div className="placeholder">
                {item && (
                  <p>{item != null ? 'Produkt nalezen' : 'NENALEZENO'}</p>
                )}
              </div>
            </IonCol>
          </IonRow> */}
          <IonRow>
            <IonCol>
              <div className="placeholder">
                {/* {item && <h2>{item?.brand || '?'}</h2>} */}
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <div className="placeholder">
                {item && <h2>{item?.description || '?'}</h2>}
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <div className="image-container">
                {/* {item && (
                  <IonImg className="obal" src={item?.image || 'error.png'} />
                )} */}
              </div>
            </IonCol>
          </IonRow>
          <IonRow></IonRow>
          <IonRow>
            <IonCol>
              <IonButton expand="full" onClick={startScan} shape="round">
                <PiBarcodeThin size={80} />
                {/* <h1>Scanovat</h1> */}
              </IonButton>
            </IonCol>
          </IonRow>
          {scannedCode && (
            <IonText class="text-center">
              <p>Načtený kód:</p>
              <h2>{scannedCode}</h2>
            </IonText>
          )}
          {/* <IonButton expand="full" onClick={updateDatabase}>
            Aktualizovat databázi
          </IonButton>
          {message && <p>{message}</p>}
          {messagee && <p>{messagee}</p>} */}
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
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default BarcodeScan;
