export interface BubbleNotificationPluginPlugin {
    showBubbleNotification(
        options: { title: string; content: string },
    ): Promise<void>;
    hide(): Promise<void>;
}
