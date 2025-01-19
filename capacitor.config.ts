import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "personal.babytracker",
  appName: "baby-tracker",
  webDir: "www/browser",
  plugins: {
    App: {
      url: "babytracker",
      appLinks: {
        ios: {
          appId: "personal.babytracker",
          appName: "Baby Tracker",
        },
        android: {
          packageName: "personal.babytracker",
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
  android: {},
};

export default config;
