import { WebPlugin } from "@capacitor/core";

import type { BubbleNotificationPluginPlugin } from "./index";

export class BubbleNotificationPluginWeb extends WebPlugin
  implements BubbleNotificationPluginPlugin {
  async showBubbleNotification(
    options: { title?: string; content?: string },
  ): Promise<{ success: boolean }> {
    if (!("Notification" in window)) {
      throw new Error("Notifications not supported in this browser");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    const notification = new Notification(options.title || "Baby Tracker", {
      body: options.content || "Quick Actions Available",
    });

    return { success: true };
  }

  async hide(): Promise<void> {
    // Web implementation doesn't support hiding notifications
    return;
  }
}

const BubbleNotificationPlugin = new BubbleNotificationPluginWeb();

export { BubbleNotificationPlugin };
