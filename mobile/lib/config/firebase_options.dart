import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for Linux.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyA1mJbJs3YPqJsKPzE5RtJ5OzH9pZ5vHJg',
    appId: '1:598024098653:web:8dcd7e8f5a4c3b2e1f0g9h',
    messagingSenderId: '598024098653',
    projectId: 'marketplace-50f56',
    authDomain: 'marketplace-50f56.firebaseapp.com',
    storageBucket: 'marketplace-50f56.appspot.com',
    measurementId: 'G-MEASUREMENT_ID',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyA1mJbJs3YPqJsKPzE5RtJ5OzH9pZ5vHJg',
    appId: '1:598024098653:android:8dcd7e8f5a4c3b2e1f0g9h',
    messagingSenderId: '598024098653',
    projectId: 'marketplace-50f56',
    storageBucket: 'marketplace-50f56.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyA1mJbJs3YPqJsKPzE5RtJ5OzH9pZ5vHJg',
    appId: '1:598024098653:ios:8dcd7e8f5a4c3b2e1f0g9h',
    messagingSenderId: '598024098653',
    projectId: 'marketplace-50f56',
    storageBucket: 'marketplace-50f56.appspot.com',
    iosClientId: 'ios-client-id',
    iosBundleId: 'com.pharmaconnect.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyA1mJbJs3YPqJsKPzE5RtJ5OzH9pZ5vHJg',
    appId: '1:598024098653:macos:8dcd7e8f5a4c3b2e1f0g9h',
    messagingSenderId: '598024098653',
    projectId: 'marketplace-50f56',
    storageBucket: 'marketplace-50f56.appspot.com',
    iosClientId: 'macos-client-id',
    iosBundleId: 'com.pharmaconnect.app.macos',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyA1mJbJs3YPqJsKPzE5RtJ5OzH9pZ5vHJg',
    appId: '1:598024098653:windows:8dcd7e8f5a4c3b2e1f0g9h',
    messagingSenderId: '598024098653',
    projectId: 'marketplace-50f56',
    storageBucket: 'marketplace-50f56.appspot.com',
  );
}
