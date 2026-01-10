export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { retention_days } = await request.json();

        // Default to 30 days if invalid
        const days = parseInt(retention_days) || 30;

        if (days < 1) {
            return new Response(JSON.stringify({ message: "保留天数必须大于 0" }), { status: 400 });
        }

        // 1. Save setting
        await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('retention_days', ?)").bind(String(days)).run();

        // 2. Execute Clean: Delete LINKS created before X days
        // We use unixepoch('now')

        const cutoffTimestampStmt = await env.DB.prepare(`SELECT unixepoch('now', '-' || ? || ' days') as cutoff`).bind(String(days)).first();
        const cutoff = cutoffTimestampStmt.cutoff;

        // First, delete visits associated with to-be-deleted links (Optional, but good for consistency, though links deletion might case cascade issues if not handled, D1 enforces foreign keys? D1 foreign keys support is limited, best to manual clean or let them orphan. 
        // Actually, user wants to reduce space.
        // Let's delete links directly.

        const result = await env.DB.prepare(`
            DELETE FROM links 
            WHERE created_at < ?
        `).bind(cutoff).run();

        // Also clean orphaned visits (if any) or old visits to save space?
        // User asked to clean "stored short links", so links deletion is priority.
        // Let's also clean visits older than cutoff for hygiene.

        await env.DB.prepare(`
            DELETE FROM visits
            WHERE visit_time < ?
        `).bind(cutoff).run();

        return new Response(JSON.stringify({
            success: true,
            message: `清理完成，已删除 ${result.meta.changes} 条过期短链`,
            deleted: result.meta.changes
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
