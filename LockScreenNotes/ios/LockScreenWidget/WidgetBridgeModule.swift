import Foundation
import WidgetKit

/// Native module that bridges React Native <-> iOS WidgetKit.
/// Writes todo JSON to App Group UserDefaults and triggers widget timeline reloads.
@objc(WidgetBridge)
class WidgetBridgeModule: RCTEventEmitter {

    private let appGroupID = "group.com.lockscreennotes.app"
    private let storageKey = "widget_todos"

    override init() {
        super.init()
        observeURLScheme()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    override func supportedEvents() -> [String]! {
        return ["onWidgetToggle"]
    }

    /// Called from JS: writes serialized todo JSON to App Group UserDefaults
    /// then tells WidgetKit to refresh.
    @objc
    func setWidgetData(_ jsonString: String) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        defaults.set(jsonString, forKey: storageKey)
        defaults.synchronize()

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    /// Explicitly reload widget timelines.
    @objc
    func reloadWidget() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    /// Observe incoming URL scheme calls from the widget (iOS < 17 fallback).
    /// When a widget item is tapped, it opens `lockscreennotes://toggle/<todoId>`.
    private func observeURLScheme() {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("RCTOpenURLNotification"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let url = notification.userInfo?["url"] as? String,
                  url.hasPrefix("lockscreennotes://toggle/") else { return }
            let todoId = String(url.dropFirst("lockscreennotes://toggle/".count))
            if !todoId.isEmpty {
                self?.sendEvent(withName: "onWidgetToggle", body: ["todoId": todoId])
            }
        }
    }
}
