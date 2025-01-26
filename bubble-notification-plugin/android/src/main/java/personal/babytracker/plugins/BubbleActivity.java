package personal.babytracker.plugins;

import android.os.Bundle;
import android.content.Intent;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class BubbleActivity extends BridgeActivity {
    private static final String BUBBLE_CLOSED_ACTION = "bubble_closed";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Load the main app content
        load();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Notify that the bubble was closed
        sendBroadcast(new Intent(BUBBLE_CLOSED_ACTION));
    }
}
