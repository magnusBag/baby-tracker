package io.babytracker.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.babytracker.app.plugins.BubbleNotificationPluginPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(BubbleNotificationPluginPlugin.class);
    }
}
