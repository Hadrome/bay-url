export async function onRequestDelete(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return new Response("ID is required", { status: 400 });
    }

    try {
        // Delete link (visits will be deleted via CASCADE if supported by D1/SQLite FK, 
        // but D1 FK support might vary, so let's delete visits first manually to be safe or rely on schema)
        // The schema says ON DELETE CASCADE, so we just delete from links.

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
