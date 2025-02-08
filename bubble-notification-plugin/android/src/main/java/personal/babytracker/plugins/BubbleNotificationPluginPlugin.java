package io.babytracker.app.plugins;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Person;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Collections;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.activity.result.ActivityResultLauncher;

@CapacitorPlugin(name = "BubbleNotificationPlugin")
public class BubbleNotificationPluginPlugin extends Plugin {

    private static final String CHANNEL_ID = "bubble_notification_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final String TAG = "BubbleNotificationPlugin";
    private static final String SHORTCUT_ID = "bubble_shortcut";

    private ActivityResultLauncher<String> requestPermissionLauncher;

    @Override
    public void load() {
        super.load();
        createNotificationChannel();
        requestPermissionLauncher = getActivity().registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            isGranted -> {
                // Handle permission result if needed
            }
        );
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Bubble Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setAllowBubbles(true);
                channel.setDescription("Notifications that can bubble");

                NotificationManager notificationManager = getContext().getSystemService(NotificationManager.class);
                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                    Log.d(TAG, "Notification channel created successfully");
                } else {
                    Log.e(TAG, "NotificationManager is null");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error creating notification channel: " + e.getMessage());
            }
        }
    }

    @PluginMethod
    public void showBubbleNotification(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                call.reject("Bubble notifications are only supported on Android 11 (API level 30) and above");
                return;
            }

            String title = call.getString("title", "Baby Tracker");
            String content = call.getString("content", "Quick Actions Available");

            // Create bubble intent
            Intent target = new Intent(getContext(), BubbleActivity.class);
            target.setAction(Intent.ACTION_VIEW);
            PendingIntent bubbleIntent = PendingIntent.getActivity(
                    getContext(),
                    0,
                    target,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
            );

            // Create person for the bubble
            Person person = new Person.Builder()
                    .setName(title)
                    .setImportant(true)
                    .build();

            // Create shortcut info for the bubble
            ShortcutInfo shortcut = new ShortcutInfo.Builder(getContext(), "bubble_shortcut")
                    .setIntent(target)
                    .setLongLived(true)
                    .setShortLabel(title)
                    .setPerson(person)
                    .build();

            // Update the shortcut
            ShortcutManager shortcutManager = getContext().getSystemService(ShortcutManager.class);
            if (shortcutManager != null) {
                shortcutManager.addDynamicShortcuts(Collections.singletonList(shortcut));
            }

            // Create bubble metadata
            Notification.BubbleMetadata bubbleMetadata = new Notification.BubbleMetadata.Builder(
                    bubbleIntent,
                    Icon.createWithResource(getContext(), io.babytracker.app.plugins.R.drawable.ic_bubble)
            )
                    .setDesiredHeight(600)
                    .setAutoExpandBubble(true)
                    .setSuppressNotification(true)
                    .build();

            // Create notification with MessagingStyle
            Notification.MessagingStyle messagingStyle = new Notification.MessagingStyle(person)
                    .setConversationTitle(title);

            // Add a message to ensure bubble appears
            messagingStyle.addMessage(new Notification.MessagingStyle.Message(
                    content,
                    System.currentTimeMillis(),
                    person
            ));

            // Build the notification
            Notification notification = new Notification.Builder(getContext(), CHANNEL_ID)
                    .setSmallIcon(io.babytracker.app.plugins.R.drawable.ic_notification)
                    .setStyle(messagingStyle)
                    .setBubbleMetadata(bubbleMetadata)
                    .setShortcutId("bubble_shortcut")
                    .addPerson(person)
                    .setCategory(Notification.CATEGORY_MESSAGE)
                    .setOngoing(true)
                    .build();

            // Show the notification
            NotificationManager notificationManager = getContext().getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                if (!notificationManager.areBubblesAllowed()) {
                    Log.w(TAG, "Bubbles are not allowed by the system");
                }
                notificationManager.notify(NOTIFICATION_ID, notification);
                Log.d(TAG, "Bubble notification shown successfully");
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } else {
                throw new Exception("NotificationManager is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to show bubble notification: " + e.getMessage());
            call.reject("Failed to show bubble notification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void hide(PluginCall call) {
        try {
            NotificationManager notificationManager = getContext().getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.cancel(NOTIFICATION_ID);
                Log.d(TAG, "Notification hidden successfully");
                call.resolve();
            } else {
                throw new Exception("NotificationManager is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to hide notification: " + e.getMessage());
            call.reject("Failed to hide notification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

}
