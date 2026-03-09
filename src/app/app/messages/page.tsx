export default function MessagesPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Messages</h1>
        <p className="text-xs text-text-secondary mt-1">Desk communications, context-linked notes, and collaboration threads.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">Inbox placeholder</div>
        <p>No unread messages in this workspace. Use IB/CHAT in terminal for linked conversation flows.</p>
      </section>
    </div>
  );
}

