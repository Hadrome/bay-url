export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);

    // 获取分页和筛选参数
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * pageSize;

    try {
        // 构建搜索条件
        let whereClause = '';
        let bindParams = [];

        if (search) {
            whereClause = 'WHERE l.slug LIKE ? OR l.url LIKE ? OR l.note LIKE ?';
            const searchPattern = `%${search}%`;
            bindParams = [searchPattern, searchPattern, searchPattern];
        }

        // 获取总数
        const countQuery = `SELECT COUNT(DISTINCT l.id) as total FROM links l ${whereClause}`;
        const countStmt = search
            ? env.DB.prepare(countQuery).bind(...bindParams)
            : env.DB.prepare(countQuery);
        const countResult = await countStmt.first();
        const total = countResult?.total || 0;

        // 获取分页数据
        const query = `
            SELECT 
                l.id, 
                l.url, 
                l.slug, 
                l.created_at,
                l.expires_at, 
                l.max_visits,
                l.note, 
                COUNT(v.id) as visits 
            FROM links l
            LEFT JOIN visits v ON l.id = v.link_id
            ${whereClause}
            GROUP BY l.id
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const dataStmt = search
            ? env.DB.prepare(query).bind(...bindParams, pageSize, offset)
            : env.DB.prepare(query).bind(pageSize, offset);

        const { results } = await dataStmt.all();

        return new Response(JSON.stringify({
            data: results,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ message: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
