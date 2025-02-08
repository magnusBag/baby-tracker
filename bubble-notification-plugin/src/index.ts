import { registerPlugin } from "@capacitor/core";

export interface BubbleNotificationPluginPlugin {
    showBubbleNotification(
        options: { title?: string; content?: string },
    ): Promise<{ success: boolean }>;
    hide(): Promise<void>;
    checkPermission(): Promise<{ granted: boolean }>;
    requestPermission(): Promise<{ granted: boolean }>;
}

const BubbleNotificationPlugin = registerPlugin<BubbleNotificationPluginPlugin>(
    "BubbleNotificationPlugin",
);

export { BubbleNotificationPlugin };
