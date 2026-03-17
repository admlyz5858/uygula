import WidgetKit
import SwiftUI

// MARK: - Data Model

struct TodoEntry: Identifiable, Codable {
    let id: String
    let text: String
    let completed: Bool
}

// MARK: - Timeline Provider

struct TodoTimelineProvider: TimelineProvider {
    private let appGroupID = "group.com.lockscreennotes.app"
    private let storageKey = "widget_todos"

    func placeholder(in context: Context) -> TodoTimelineEntry {
        TodoTimelineEntry(
            date: Date(),
            todos: [
                TodoEntry(id: "1", text: "İlk görevinizi ekleyin", completed: false),
                TodoEntry(id: "2", text: "Tamamlanan görev örneği", completed: true),
            ]
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (TodoTimelineEntry) -> Void) {
        let entry = TodoTimelineEntry(date: Date(), todos: loadTodos())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TodoTimelineEntry>) -> Void) {
        let entry = TodoTimelineEntry(date: Date(), todos: loadTodos())
        // Refresh every 15 minutes as a fallback; the app also triggers reloads explicitly
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadTodos() -> [TodoEntry] {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let jsonString = defaults.string(forKey: storageKey),
              let data = jsonString.data(using: .utf8)
        else {
            return []
        }

        do {
            return try JSONDecoder().decode([TodoEntry].self, from: data)
        } catch {
            return []
        }
    }
}

// MARK: - Timeline Entry

struct TodoTimelineEntry: TimelineEntry {
    let date: Date
    let todos: [TodoEntry]
}

// MARK: - Widget Views

struct TodoListWidgetEntryView: View {
    var entry: TodoTimelineEntry
    @Environment(\.widgetFamily) var widgetFamily
    @Environment(\.colorScheme) var colorScheme

    private var visibleTodos: [TodoEntry] {
        let maxItems: Int
        switch widgetFamily {
        case .systemSmall:
            maxItems = 3
        case .systemMedium:
            maxItems = 5
        case .systemLarge:
            maxItems = 10
        case .accessoryRectangular:
            maxItems = 3
        case .accessoryCircular:
            maxItems = 1
        case .accessoryInline:
            maxItems = 1
        @unknown default:
            maxItems = 5
        }
        return Array(entry.todos.prefix(maxItems))
    }

    private var backgroundColor: Color {
        colorScheme == .dark
            ? Color(red: 0.04, green: 0.04, blue: 0.06)
            : Color(red: 0.96, green: 0.96, blue: 0.98)
    }

    private var surfaceColor: Color {
        colorScheme == .dark
            ? Color(red: 0.07, green: 0.07, blue: 0.10)
            : Color.white
    }

    private var textColor: Color {
        colorScheme == .dark
            ? Color(red: 0.91, green: 0.91, blue: 0.93)
            : Color(red: 0.10, green: 0.10, blue: 0.18)
    }

    private var secondaryTextColor: Color {
        colorScheme == .dark
            ? Color(red: 0.56, green: 0.56, blue: 0.60)
            : Color(red: 0.42, green: 0.42, blue: 0.50)
    }

    private var accentColor: Color {
        Color(red: 0.42, green: 0.39, blue: 1.0)
    }

    private var successColor: Color {
        Color(red: 0.31, green: 0.80, blue: 0.77)
    }

    var body: some View {
        Group {
            switch widgetFamily {
            case .accessoryRectangular:
                lockScreenRectangularView
            case .accessoryCircular:
                lockScreenCircularView
            case .accessoryInline:
                lockScreenInlineView
            default:
                homeScreenView
            }
        }
    }

    // MARK: - Lock Screen (Rectangular)

    private var lockScreenRectangularView: some View {
        VStack(alignment: .leading, spacing: 2) {
            if visibleTodos.isEmpty {
                Text("Notlarım")
                    .font(.caption.bold())
                Text("Henüz görev yok")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            } else {
                ForEach(visibleTodos) { todo in
                    if #available(iOSApplicationExtension 17.0, *) {
                        Button(intent: ToggleTodoIntent(todoId: todo.id)) {
                            todoRowCompact(todo)
                        }
                        .buttonStyle(.plain)
                    } else {
                        Link(destination: URL(string: "lockscreennotes://toggle/\(todo.id)")!) {
                            todoRowCompact(todo)
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func todoRowCompact(_ todo: TodoEntry) -> some View {
        HStack(spacing: 5) {
            Image(systemName: todo.completed ? "checkmark.circle.fill" : "circle")
                .font(.caption2)
                .foregroundColor(todo.completed ? .green : .primary)
            Text(todo.text)
                .font(.caption2)
                .strikethrough(todo.completed)
                .foregroundColor(todo.completed ? .secondary : .primary)
                .lineLimit(1)
        }
    }

    // MARK: - Lock Screen (Circular)

    private var lockScreenCircularView: some View {
        let pending = entry.todos.filter { !$0.completed }.count
        VStack(spacing: 1) {
            Image(systemName: "checklist")
                .font(.title3)
            Text("\(pending)")
                .font(.caption.bold())
        }
    }

    // MARK: - Lock Screen (Inline)

    private var lockScreenInlineView: some View {
        let pending = entry.todos.filter { !$0.completed }.count
        Text("Notlarım: \(pending) bekleyen")
    }

    // MARK: - Home Screen Widget

    private var homeScreenView: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Image(systemName: "checklist")
                    .font(.subheadline.bold())
                    .foregroundColor(accentColor)
                Text("Notlarım")
                    .font(.subheadline.bold())
                    .foregroundColor(textColor)
                Spacer()
                let pending = entry.todos.filter { !$0.completed }.count
                Text("\(pending) bekleyen")
                    .font(.caption2)
                    .foregroundColor(secondaryTextColor)
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
            .padding(.bottom, 8)

            if visibleTodos.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        Image(systemName: "doc.text")
                            .font(.title2)
                            .foregroundColor(secondaryTextColor)
                        Text("Henüz görev yok")
                            .font(.caption)
                            .foregroundColor(secondaryTextColor)
                    }
                    Spacer()
                }
                Spacer()
            } else {
                VStack(spacing: 4) {
                    ForEach(visibleTodos) { todo in
                        if #available(iOSApplicationExtension 17.0, *) {
                            Button(intent: ToggleTodoIntent(todoId: todo.id)) {
                                todoRow(todo)
                            }
                            .buttonStyle(.plain)
                        } else {
                            Link(destination: URL(string: "lockscreennotes://toggle/\(todo.id)")!) {
                                todoRow(todo)
                            }
                        }
                    }
                }
                .padding(.horizontal, 10)
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(backgroundColor)
    }

    private func todoRow(_ todo: TodoEntry) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .stroke(todo.completed ? successColor : secondaryTextColor.opacity(0.5), lineWidth: 1.5)
                    .frame(width: 20, height: 20)
                if todo.completed {
                    Circle()
                        .fill(successColor.opacity(0.15))
                        .frame(width: 20, height: 20)
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(successColor)
                }
            }

            Text(todo.text)
                .font(.caption)
                .foregroundColor(todo.completed ? secondaryTextColor : textColor)
                .strikethrough(todo.completed, color: secondaryTextColor)
                .lineLimit(1)

            Spacer()
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(todo.completed
                      ? surfaceColor.opacity(0.5)
                      : surfaceColor)
        )
    }
}

// MARK: - Widget Configuration

struct TodoListWidget: Widget {
    let kind: String = "TodoListWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TodoTimelineProvider()) { entry in
            TodoListWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Notlarım")
        .description("Yapılacaklar listesi ve notlarınızı kilit ekranında görüntüleyin.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryRectangular,
            .accessoryCircular,
            .accessoryInline,
        ])
    }
}

// MARK: - Interactive Intent (iOS 17+)

import AppIntents

@available(iOSApplicationExtension 17.0, iOS 17.0, *)
struct ToggleTodoIntent: AppIntent {
    static var title: LocalizedStringResource = "Görev Durumunu Değiştir"
    static var description = IntentDescription("Bir görevi tamamlandı/tamamlanmadı olarak işaretler.")

    @Parameter(title: "Todo ID")
    var todoId: String

    init() {
        self.todoId = ""
    }

    init(todoId: String) {
        self.todoId = todoId
    }

    func perform() async throws -> some IntentResult {
        let appGroupID = "group.com.lockscreennotes.app"
        let storageKey = "widget_todos"

        guard let defaults = UserDefaults(suiteName: appGroupID),
              let jsonString = defaults.string(forKey: storageKey),
              let data = jsonString.data(using: .utf8)
        else {
            return .result()
        }

        do {
            var todos = try JSONDecoder().decode([TodoEntry].self, from: data)
            if let index = todos.firstIndex(where: { $0.id == todoId }) {
                let current = todos[index]
                todos[index] = TodoEntry(
                    id: current.id,
                    text: current.text,
                    completed: !current.completed
                )

                let encoded = try JSONEncoder().encode(todos)
                if let jsonStr = String(data: encoded, encoding: .utf8) {
                    defaults.set(jsonStr, forKey: storageKey)
                }
            }
        } catch {
            // Failed to toggle
        }

        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}

// MARK: - Preview

struct TodoListWidget_Previews: PreviewProvider {
    static var previews: some View {
        let entry = TodoTimelineEntry(
            date: Date(),
            todos: [
                TodoEntry(id: "1", text: "Market alışverişi yap", completed: false),
                TodoEntry(id: "2", text: "Raporu bitir", completed: false),
                TodoEntry(id: "3", text: "Spor yap", completed: true),
                TodoEntry(id: "4", text: "Kitap oku", completed: false),
            ]
        )

        Group {
            TodoListWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")

            TodoListWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
                .previewDisplayName("Lock Screen Rectangular")

            TodoListWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .accessoryCircular))
                .previewDisplayName("Lock Screen Circular")
        }
    }
}
