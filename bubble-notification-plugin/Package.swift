// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BubbleNotificationPlugin",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "BubbleNotificationPlugin",
            targets: ["bubbleNotificationPluginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "bubbleNotificationPluginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/bubbleNotificationPluginPlugin"),
        .testTarget(
            name: "bubbleNotificationPluginPluginTests",
            dependencies: ["bubbleNotificationPluginPlugin"],
            path: "ios/Tests/bubbleNotificationPluginPluginTests")
    ]
)