document.addEventListener('DOMContentLoaded', () => {
    // URL Shortener Logic
    const shortenForm = document.getElementById('shortenForm');
    if (shortenForm) {
        const urlInput = document.getElementById('urlInput');
        const slugInput = document.getElementById('slugInput');
        const submitBtn = shortenForm.querySelector('button[type="submit"]');
        const resultDiv = document.getElementById('result');
        const shortUrlLink = document.getElementById('shortUrl');
        const copyBtn = document.getElementById('copyBtn');
        const errorMsg = document.getElementById('errorMsg');

        shortenForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Reset state
            errorMsg.style.display = 'none';
            resultDiv.classList.remove('visible');
            submitBtn.disabled = true;
            submitBtn.textContent = '生成中...';

            try {
                const response = await fetch('/api/shorten', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: urlInput.value,
                        slug: slugInput.value || undefined
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || '生成失败');
                }

                const fullUrl = `${window.location.origin}/${data.slug}`;
                shortUrlLink.href = fullUrl;
                shortUrlLink.textContent = fullUrl;
                resultDiv.classList.add('visible');
                
            } catch (err) {
                errorMsg.textContent = err.message;
                errorMsg.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '缩短链接';
            }
        });

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(shortUrlLink.href).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '已复制!';
                setTimeout(() => copyBtn.textContent = originalText, 2000);
            });
        });
    }

    // Admin Dashboard Logic
    const adminLogin = document.getElementById('adminLogin');
    if (adminLogin) {
        const dashboard = document.getElementById('dashboard');
        const loginForm = document.getElementById('loginForm');
        const tokenInput = document.getElementById('tokenInput');
        const linkList = document.getElementById('linkList');
        const logoutBtn = document.getElementById('logoutBtn');
        
        let authToken = localStorage.getItem('adminToken');

        const loadLinks = async () => {
            try {
                const response = await fetch('/api/list', {
                    headers: { 'Admin-Token': authToken }
                });
                
                if (response.status === 401) {
                    throw new Error('未授权');
                }

                const links = await response.json();
                renderLinks(links);
                showDashboard();
            } catch (err) {
                logout();
            }
        };

        const renderLinks = (links) => {
            linkList.innerHTML = links.map(link => `
                <div class="link-item">
                    <div class="link-info">
                        <a href="/${link.slug}" target="_blank" class="link-slug">/${link.slug}</a>
                        <span class="link-url">${link.url}</span>
                        <div class="link-stats">
                            访问: ${link.visits || 0} | 创建: ${new Date(link.created_at * 1000).toLocaleDateString()}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteLink(${link.id})">删除</button>
                </div>
            `).join('');
        };

        const showDashboard = () => {
            adminLogin.classList.add('hidden');
            dashboard.classList.remove('hidden');
        };

        const logout = () => {
            localStorage.removeItem('adminToken');
            authToken = null;
            adminLogin.classList.remove('hidden');
            dashboard.classList.add('hidden');
            linkList.innerHTML = '';
        };

        // Expose delete function globally
        window.deleteLink = async (id) => {
            if (!confirm('确定要删除这个链接吗？')) return;
            
            try {
                const response = await fetch(`/api/delete?id=${id}`, {
                    method: 'DELETE',
                    headers: { 'Admin-Token': authToken }
                });
                
                if (response.ok) {
                    loadLinks();
                } else {
                    alert('删除失败');
                }
            } catch (err) {
                console.error(err);
                alert('发生错误');
            }
        };

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            authToken = tokenInput.value;
            localStorage.setItem('adminToken', authToken);
            loadLinks();
        });

        logoutBtn.addEventListener('click', logout);

        if (authToken) {
            loadLinks();
        }
    }
});
