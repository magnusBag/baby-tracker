package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import personal.babytracker.plugins.BubbleNotificationPluginPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BubbleNotificationPluginPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
