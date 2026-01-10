export async function onRequest(context) {
    const { request, env, params, next } = context;
    const slug = params.slug;

    // 1. If root path, pass to static assets (index.html)
    if (!slug) {
        return next();
    }

    // 2. If valid filename (has extension) or is 'admin' path, pass to static assets
    // This prevents DB lookups for style.css, script.js, favicon.ico, etc.
    if (slug.includes('.') || slug === 'admin') {
        return next();
    }

    // 3. Query the database for the slug
    const stmt = env.DB.prepare("SELECT * FROM links WHERE slug = ?");
    const link = await stmt.bind(slug).first();

    if (!link) {
        return new Response("Short URL not found", { status: 404 });
    }

    // Check expiration
    if (link.expires_at && link.expires_at < Date.now() / 1000) {
        return new Response("Short URL expired", { status: 410 });
    }

    // Check max_visits (One-time view)
    if (link.max_visits) {
        const countStmt = env.DB.prepare("SELECT COUNT(*) as count FROM visits WHERE link_id = ?");
        const countResult = await countStmt.bind(link.id).first();
        if (countResult && countResult.count >= link.max_visits) {
            return new Response("This link has reached its maximum visit limit (Burn after reading).", { status: 410 });
        }
    }

    // Async logging
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
