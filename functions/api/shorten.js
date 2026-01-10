export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const { url, slug } = await request.json();

        if (!url) {
            return new Response(JSON.stringify({ message: "URL is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return new Response(JSON.stringify({ message: "Invalid URL" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        let finalSlug = slug;

        if (!finalSlug) {
            // Generate random slug (6 chars)
            finalSlug = generateRandomString(6);
            // Ensure uniqueness (simple retry logic)
            let exists = await env.DB.prepare("SELECT 1 FROM links WHERE slug = ?").bind(finalSlug).first();
            let retries = 0;
            while (exists && retries < 5) {
                finalSlug = generateRandomString(6);
                exists = await env.DB.prepare("SELECT 1 FROM links WHERE slug = ?").bind(finalSlug).first();
                retries++;
            }
            if (exists) {
                return new Response(JSON.stringify({ message: "Failed to generate unique slug" }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                });
            }
        } else {
            // Check custom slug
            const exists = await env.DB.prepare("SELECT 1 FROM links WHERE slug = ?").bind(finalSlug).first();
            if (exists) {
                return new Response(JSON.stringify({ message: "Slug already exists" }), {
                    status: 409,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        // Insert into DB
        const info = await env.DB.prepare(
            "INSERT INTO links (url, slug) VALUES (?, ?)"
        )
            .bind(url, finalSlug)
            .run();

        return new Response(JSON.stringify({ slug: finalSlug, url: url }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        return new Response(JSON.stringify({ message: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
