# NewsApp

## Overview
NewsApp is a modern, feature-rich mobile news application built with React Native and Expo, providing users with personalized news content, authentication, and advanced features.

## Project Details
- **Version**: 1.0.4
- **Platform**: iOS, Android
- **Development Environment**: Expo

## Features
- 📰 Real-time news updates from NewsAPI
- 🔐 Multi-authentication methods
  - Email/Password
  - Google Sign-In
  - Facebook Login
- 🌙 Dynamic Dark/Light mode
- 🔔 Customizable notifications
  - Breaking news alerts
  - Category-specific updates
  - Daily news digest
- 📑 Article bookmarking
- 🔒 Biometric authentication (Fingerprint/Face ID)
- 📱 Offline content support
- 🌍 Multiple news categories
  - General
  - Business
  - Entertainment
  - Health
  - Science
  - Sports
  - Technology

## Tech Stack
### Core Technologies
- **Framework**: React Native with Expo Router
- **Language**: TypeScript
- **State Management**: MobX
- **Authentication**: 
  - Expo Auth Session
  - AWS Cognito

### Key Libraries
- `expo-local-authentication`: Biometric login
- `expo-notifications`: Push notifications
- `@react-native-async-storage/async-storage`: Local storage
- `@react-native-community/netinfo`: Network connectivity
- `yup`: Form validation
- `expo-secure-store`: Secure credential storage

## Prerequisites
- Node.js (v20.11.1)
- npm or Yarn
- Expo CLI
- Android Studio or Xcode (for emulators)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/smartsupun/NewsApp
cd newsapp
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
The project uses environment variables from `.env` and `app.config.js`. Key configurations include:

- **NewsAPI**: 
  - API Key: `e3cb147b60e54b6896bfd472623aed99`
  - API URL: `https://newsapi.org/v2`

- **Authentication Providers**:
  - Facebook App ID: `599520879746921`
  - Google Client ID: `101566213848-fe6a8n483k4uf9pvg3g9o3qhp5i8ahnn.apps.googleusercontent.com`

- **AWS Cognito**:
  - Domain: `ap-southeast-1335m9qdxx.auth.ap-southeast-1.amazoncognito.com`
  - FB Client ID: `6i3eoe6ab26tn8r6ljmm36cskb`
  - Google Client ID: `7opkttdhbtba8qufk8oh43eir8`

### 4. Run the Application
```bash
# Start development server
npx expo start

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

## Project Structure
```
newsapp/
├── app/                # Navigation and screen components
│   ├── (app)/          # Main app screens
│   ├── (auth)/         # Authentication screens
│   └── _layout.tsx     # Root layout
├── src/                # Core application logic
│   ├── components/     # Reusable UI components
│   ├── models/         # Data models
│   ├── services/       # Services and stores
│   │   ├── api/        # API communication
│   │   ├── auth/       # Authentication services
│   │   ├── database/   # Local storage
│   │   └── stores/     # MobX stores
│   ├── theme/          # Styling and design system
│   └── utils/          # Utility functions
└── assets/             # Static assets
```

## Key Stores and Services
- `AuthStore`: User authentication and account management
- `NewsStore`: News articles, bookmarking, and search
- `SettingsStore`: App-wide settings (dark mode, notifications)

## Authentication Flows
1. Email Registration/Login
2. Google OAuth
3. Facebook OAuth
4. Biometric Authentication

## Notification Management
- Breaking news alerts
- Category-specific updates
- Configurable daily digest
- Granular notification preferences

## Device Support
- Supports iOS and Android
- Adaptive UI for various screen sizes
- Dark/Light mode
- Biometric authentication support

## Build and Deployment
```bash
# Build for production
eas build
```

## Environment Configurations
- Development Client
- Internal Distribution
- Test Channel with APK support

## Performance Optimizations
- Offline caching of articles
- Efficient state management with MobX
- Responsive design with adaptive scaling

## Security Features
- Secure token storage
- Biometric authentication
- OAuth with AWS Cognito
- Secure password management

## Troubleshooting
- Ensure all environment variables are correctly set
- Check network connectivity for API calls
- Verify Expo and React Native versions compatibility

## License
Distributed under the MIT License.

## Contact
- Project Owner: Supun Lakshan
- Project Repository: [NewsApp GitHub]((https://github.com/smartsupun/NewsApp))

## Acknowledgements
- NewsAPI for news content
- Expo for mobile development framework
- MobX for state management
- React Native community
