export interface BubbleNotificationPluginPlugin {
    showBubbleNotification(options: {
        title?: string;
        content?: string;
    }): Promise<{
        success: boolean;
    }>;
    hide(): Promise<void>;
    checkPermission(): Promise<{ granted: boolean }>;
    requestPermission(): Promise<{ granted: boolean }>;
}
declare const BubbleNotificationPlugin: BubbleNotificationPluginPlugin;
export { BubbleNotificationPlugin };
