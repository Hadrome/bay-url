// 仪表盘 API - 返回统计数据
export async function onRequestGet(context) {
    const { env } = context;

    try {
        // 1. 今日访问
        const todayVisitsQuery = `
            SELECT COUNT(*) as count FROM visits 
            WHERE date(visit_time, 'unixepoch') = date('now')
        `;
        const todayVisits = (await env.DB.prepare(todayVisitsQuery).first())?.count || 0;

        // 2. 今日新增链接
        const todayLinksQuery = `
            SELECT COUNT(*) as count FROM links 
            WHERE date(created_at, 'unixepoch') = date('now')
        `;
        const todayLinks = (await env.DB.prepare(todayLinksQuery).first())?.count || 0;

        // 3. 当月访问
        const monthVisitsQuery = `
            SELECT COUNT(*) as count FROM visits 
            WHERE strftime('%Y-%m', visit_time, 'unixepoch') = strftime('%Y-%m', 'now')
        `;
        const monthVisits = (await env.DB.prepare(monthVisitsQuery).first())?.count || 0;

        // 4. 当月新增链接
        const monthLinksQuery = `
            SELECT COUNT(*) as count FROM links 
            WHERE strftime('%Y-%m', created_at, 'unixepoch') = strftime('%Y-%m', 'now')
        `;
        const monthLinks = (await env.DB.prepare(monthLinksQuery).first())?.count || 0;

        // 5. 总访问量
        const totalVisitsQuery = `SELECT COUNT(*) as count FROM visits`;
        const totalVisits = (await env.DB.prepare(totalVisitsQuery).first())?.count || 0;

        // 6. 总链接数
        const totalLinksQuery = `SELECT COUNT(*) as count FROM links`;
        const totalLinks = (await env.DB.prepare(totalLinksQuery).first())?.count || 0;

        return new Response(JSON.stringify({
            today: {
                visits: todayVisits,
                links: todayLinks
            },
            month: {
                visits: monthVisits,
                links: monthLinks
            },
            total: {
                visits: totalVisits,
                links: totalLinks
            }
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

