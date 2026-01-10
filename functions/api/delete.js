export async function onRequestDelete(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return new Response("ID is required", { status: 400 });
    }

    try {
        const info = await env.DB.prepare("DELETE FROM links WHERE id = ?").bind(id).run();

        if (info.success) {
            return new Response("Deleted", { status: 200 });
        } else {
            return new Response("Failed to delete", { status: 500 });
        }
    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}

// 批量删除
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return new Response(JSON.stringify({ error: "IDs array is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // 批量删除
        const placeholders = ids.map(() => '?').join(',');
        const deleteQuery = `DELETE FROM links WHERE id IN (${placeholders})`;

        const result = await env.DB.prepare(deleteQuery).bind(...ids).run();

        return new Response(JSON.stringify({
            success: true,
            deleted: ids.length
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
