import { initializeApp, getApps, getApp, FirebaseApp } from '@react-native-firebase/app';

/**
 * Firebase is auto-initialized by @react-native-firebase/app from
 * google-services.json (Android) and GoogleService-Info.plist (iOS).
 * This module exposes the singleton for convenience.
 */
let app: FirebaseApp;

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp({});
  } else {
    app = getApp();
  }
  return app;
}
