package io.ionic.starter;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Person;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import personal.babytracker.plugins.BubbleActivity;
import io.ionic.starter.R;

@CapacitorPlugin(name = "BubbleNotifications")
public class BubbleNotificationsPlugin extends Plugin {

    private static final String CHANNEL_ID = "bubble_notifications";
    private static final int NOTIFICATION_ID = 1;

    @PluginMethod
    public void show(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            String title = call.getString("title");
            String content = call.getString("content");

            NotificationManager notificationManager
                    = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);

            // Create notification channel
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Bubble Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setAllowBubbles(true);
                notificationManager.createNotificationChannel(channel);
            }

            // Create bubble metadata
            Notification.BubbleMetadata bubbleMetadata = new Notification.BubbleMetadata.Builder()
                    .setDesiredHeight(600)
                    .setAutoExpandBubble(true)
                    .setIntent(createBubblePendingIntent())
                    .setIcon(Icon.createWithResource(getContext(), R.drawable.ic_bubble))
                    .build();

            // Create notification
            Notification.Builder builder = new Notification.Builder(getContext(), CHANNEL_ID)
                    .setBubbleMetadata(bubbleMetadata)
                    .setSmallIcon(R.drawable.ic_notification)
                    .setContentTitle(title)
                    .setContentText(content)
                    .setCategory(Notification.CATEGORY_MESSAGE);

            notificationManager.notify(NOTIFICATION_ID, builder.build());
            call.resolve();
        } else {
            call.reject("Bubble notifications require Android 11 or higher");
        }
    }

    @PluginMethod
    public void hide(PluginCall call) {
        NotificationManager notificationManager
                = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.cancel(NOTIFICATION_ID);
        call.resolve();
    }

    private PendingIntent createBubblePendingIntent() {
        // Create intent for bubble content
        Intent target = new Intent(getContext(), BubbleActivity.class);
        target.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        return PendingIntent.getActivity(
                getContext(),
                0,
                target,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );
    }
}
