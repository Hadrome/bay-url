export async function onRequest(context) {
    const { request, env, params } = context;
    const slug = params.slug;

    if (!slug) {
        return new Response("Not Found", { status: 404 });
    }

    // Query the database for the slug
    const stmt = env.DB.prepare("SELECT * FROM links WHERE slug = ?");
    const link = await stmt.bind(slug).first();

    if (!link) {
        return new Response("Short URL not found", { status: 404 });
    }

    // Check expiration
    if (link.expires_at && link.expires_at < Date.now() / 1000) {
        return new Response("Short URL expired", { status: 410 });
    }

    // Async logging (don't await to speed up response)
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";
    const referer = request.headers.get("Referer") || "unknown";

    context.waitUntil(
        env.DB.prepare(
            "INSERT INTO visits (link_id, ip, user_agent, referer) VALUES (?, ?, ?, ?)"
        )
            .bind(link.id, ip, userAgent, referer)
            .run()
    );

    return Response.redirect(link.url, 302);
}
