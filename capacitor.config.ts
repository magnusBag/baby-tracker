import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.babytracker.app",
  appName: "baby-tracker",
  webDir: "www/browser",
  plugins: {
    App: {
      url: "babytracker",
      appLinks: {
        ios: {
          appId: "io.babytracker.app",
          appName: "Baby Tracker",
        },
        android: {
          packageName: "io.babytracker.app",
          scheme: "babytracker",
        },
      },
    },
    Keyboard: {
      resize: true,
    },
  },
  ios: {
    contentInset: "always",
  },
  android: {
    buildOptions: {
      keystorePath: "/Users/mba/Downloads/play-upload-key.jks",
    },
  },
  };

export default config;
