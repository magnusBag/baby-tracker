export interface BubbleNotificationPluginPlugin {
    showBubbleNotification(options: {
        title?: string;
        content?: string;
    }): Promise<{
        success: boolean;
    }>;
    hide(): Promise<void>;
}
declare const BubbleNotificationPlugin: BubbleNotificationPluginPlugin;
export { BubbleNotificationPlugin };
