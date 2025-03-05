export default {
  expo: {
    name: "NewsApp",
    slug: "newsapp",
    version: "1.0.0",
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
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#fff"
      },
      package: 'com.newsapp.dev'
    },
    scheme: "newsapp",
    plugins: [
      "expo-router",
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Allow NewsApp to use Face ID."
        }
      ]
    ],
    extra: {
      // You can add Facebook App ID here for easier management
      facebookAppId: process.env.FACEBOOK_APP_ID || "599520879746921",
      eas: {
        projectId: "a07c2c8e-b8a4-4834-a979-7e7c58f5f46d"
      }
    },

    owner: "hsd_apps",
    runtimeVersion: "1.0.0",
  }
};