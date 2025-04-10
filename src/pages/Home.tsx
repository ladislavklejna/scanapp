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
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import { Table } from 'reactstrap';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

ScreenOrientation.lock({ orientation: 'portrait' });

// Funkce pro vyhledání produktu podle EAN
const findProductByEAN = (ean: string) => {
  return db.find((p) => p.ean === ean);
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
  const [image, setImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const [item, setItem] = useState<{
    id: number;
    // image: string;
    ean: string;
    // brand: string;
    name: string;
    variants: string;
    gram: string;
  } | null>(null);

  const [logs, setLogs] = useState<any[]>([]); // Stav pro logy

  // Funkce pro skenování čárového kódu
  const startScan = async () => {
    try {
      const result = await BarcodeScanner.scan();
      if (result.barcodes.length > 0) {
        const scannedValue = result.barcodes[0].rawValue;
        setScannedCode(scannedValue);
        Haptics.vibrate({ duration: 200 });

        const foundItem = findProductByEAN(scannedValue);

        if (foundItem != undefined) {
          setItem({
            id: Number(foundItem.id),
            ean: foundItem.ean,
            name: foundItem.name || 'Popis není dostupný',
            gram: foundItem.gram,
            variants: foundItem.variants,
          });

          const imageList: string[] = [];
          const formats = ['png', 'jpg'];

          for (let i = 0; i < 5; i++) {
            const baseName = i === 0 ? foundItem.ean : `${foundItem.ean}-${i}`;
            let found = false;

            for (const ext of formats) {
              const path = `images/${baseName}.${ext}`;
              try {
                const response = await fetch(path);
                if (response.ok) {
                  imageList.push(path);
                  found = true;
                  break;
                }
              } catch (err) {
                console.warn(`Nepodařilo se načíst obrázek: ${path}`);
              }
            }

            if (!found) {
              break;
            }
          }

          setImages(imageList);
        } else {
          setItem({
            id: 0,
            ean: scannedValue,
            name: 'Produkt nenalezen',
            gram: '???',
            variants: 'false',
          });
          setImages(['images/error.png']);
        }
      } else {
        setScannedCode('Žádný kód nenačten.');
        setItem(null);
        setImages(['images/error.png']);
      }
    } catch (error) {
      console.error('Chyba při skenování:', error);
      setScannedCode('Chyba při skenování.');
      setItem(null);
      setImages(['images/error.png']);
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
              <Table bordered striped>
                <tbody>
                  {/* <tr>
                    <th scope="row">Značka</th>
                    <td>{item && <h6>{item.name}</h6>}</td>
                  </tr> */}
                  <tr>
                    <th scope="row">Název</th>
                    <td>
                      <div id="xxx">
                        {item && <p className="marg-zero">{item.name}</p>}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Váha</th>
                    <td>
                      {item && (
                        <h6>
                          {item.gram}
                          {item.gram == '???' ? '' : 'g'}
                        </h6>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <div
                className={`image-container ${
                  item && images.length > 1 ? 'pozor' : '' // tady zkusit zmenu
                }`}
              >
                {item && images.length === 1 && <IonImg src={images[0]} />}
                {item && images.length > 1 && (
                  <Swiper
                    modules={[Navigation]}
                    navigation
                    spaceBetween={10}
                    slidesPerView={1}
                  >
                    {images.map((imgSrc, index) => (
                      <SwiperSlide key={index}>
                        <IonImg src={imgSrc} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <div className="placeholderlada">
                {item && images.length > 1 && (
                  <p className="text-red">! více obalových variant !</p>
                )}
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                className="scanbtn"
                expand="full"
                onClick={startScan}
                shape="round"
              >
                <PiBarcodeThin size={70} />
                {/* <h1>Scanovat</h1> */}
              </IonButton>
            </IonCol>
          </IonRow>
          {scannedCode && (
            <IonText class="text-center">
              <p className="marg-zero">Načtený kód:</p>
              <h2>{scannedCode}</h2>
            </IonText>
          )}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default BarcodeScan;
