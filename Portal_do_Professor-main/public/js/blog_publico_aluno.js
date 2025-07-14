document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const API_URL = '/api/posts';

    if (!postsContainer) return;

    const renderPostCard = (post) => {
        const postDate = new Date(post.data_publicacao).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        
        const postLink = post.external_url || `/blog.html?id=${post.id}`;
        const target = post.external_url ? 'target="_blank" rel="noopener noreferrer"' : '';
        const excerpt = post.conteudo ? (post.conteudo.length > 120 ? post.conteudo.substring(0, 120) + '...' : post.conteudo) : 'Clique para ver mais.';

        return `
            <a href="${postLink}" ${target} class="post-card">
                <div class="post-card-image" style="background-image: url('${post.imagem_url || 'https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?w=1200'}')"></div>
                <div class="post-card-content">
                    <span class="post-card-category">${post.categoria || 'Geral'}</span>
                    <h3 class="post-card-title">${post.titulo}</h3>
                    <p class="post-card-description">${excerpt}</p>
                    <div class="post-card-footer">
                        <span>${postDate}</span>
                    </div>
                </div>
            </a>
        `;
    };

    const fetchAndRenderPosts = async () => {
        postsContainer.innerHTML = '<p>Carregando publicações...</p>';

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar posts.');
            
            const posts = await response.json();
            postsContainer.innerHTML = '';

            if (posts.length === 0) {
                postsContainer.innerHTML = '<p>Nenhum post encontrado no momento.</p>';
            } else {
                posts.forEach(post => {
                    postsContainer.insertAdjacentHTML('beforeend', renderPostCard(post));
                });
            }
        } catch (error) {
            console.error('Erro:', error);
            postsContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar as publicações.</p>';
        }
    };

    fetchAndRenderPosts();
});