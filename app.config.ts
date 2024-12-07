// app.config.ts
import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: 'mb-expo-1',
  slug: 'mb-expo-1',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.peryssiahaan.mbexpo1',
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json'
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        androidMode: 'default'
      }
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: '6fc6c391-7878-4bc2-a5b6-0f2cca17a9bd'
    }
  },
  runtimeVersion: {
    policy: 'appVersion'
  },
  updates: {
    url: 'https://u.expo.dev/6fc6c391-7878-4bc2-a5b6-0f2cca17a9bd'
  }
};

export default config;
