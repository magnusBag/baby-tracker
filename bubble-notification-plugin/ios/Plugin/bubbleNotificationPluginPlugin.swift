import Foundation
import Capacitor
import UserNotifications

@objc(bubbleNotificationPluginPlugin)
public class bubbleNotificationPluginPlugin: CAPPlugin {
    private let notificationCenter = UNUserNotificationCenter.current()
    
    @objc func showBubbleNotification(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? ""
        let content = call.getString("content") ?? ""
        
        if title.isEmpty || content.isEmpty {
            call.reject("Title and content are required")
            return
        }
        
        notificationCenter.requestAuthorization(options: [.alert, .sound, .badge]) { (granted, error) in
            if granted {
                let content = UNMutableNotificationContent()
                content.title = title
                content.body = "test"
                content.sound = UNNotificationSound.default
                
                let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                let request = UNNotificationRequest(identifier: UUID().uuidString,
                                                 content: content,
                                                 trigger: trigger)
                
                self.notificationCenter.add(request) { (error) in
                    if let error = error {
                        call.reject("Failed to show notification: \(error.localizedDescription)")
                    } else {
                        call.resolve(["success": true])
                    }
                }
            } else {
                call.reject("Notification permission not granted")
            }
        }
    }
    
    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": value
        ])
    }
} 
