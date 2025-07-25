import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(bubbleNotificationPluginPlugin)
public class bubbleNotificationPluginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "bubbleNotificationPluginPlugin"
    public let jsName = "bubbleNotificationPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = bubbleNotificationPlugin()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }
}
