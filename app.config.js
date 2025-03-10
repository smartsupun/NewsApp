import 'dotenv/config';

export default {
  name: "News App",
  slug: "newsapp",
  version: "1.0.4",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#fff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    versionCode: 5,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#fff"
    },
    package: 'com.hsd_apps.newsapp',
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT"
    ],
  },
  scheme: "newsapp",
  plugins: [
    "expo-router",
    "expo-notifications",
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow NewsApp to use Face ID."
      }
    ]
  ],
  extra: {
    facebookAppId: process.env.EXPO_FACEBOOK_APP_ID,
    googlewebClientId: process.env.EXPO_GOOGLE_CLIENT_ID,
    newsApiId: process.env.EXPO_NEWS_API_ID,
    newsApiUrl: process.env.EXPO_NEWS_API_URL,
    eas: {
      projectId: "a07c2c8e-b8a4-4834-a979-7e7c58f5f46d"
    }
  },
  web: {
    bundler: "metro"
  },
  owner: "hsd_apps",
  runtimeVersion: "1.0.0"

};