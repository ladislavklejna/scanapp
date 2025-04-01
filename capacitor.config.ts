import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ionic.scanapp',
  appName: 'Mokate Scanner',
  webDir: 'dist',
  plugins: {
    ScreenOrientation: {
      allowOrientationChange: false,
      preferredOrientation: 'portrait',
    },
  },
};

export default config;
