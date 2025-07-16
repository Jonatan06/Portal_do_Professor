document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const API_URL = '/api/posts';
    let allPosts = [];

    if (!postsContainer || !searchInput || !sortSelect) {
        console.error("Erro: Elementos essenciais (container, busca ou ordenação) não encontrados.");
        return;
    }

    const renderPostCard = (post) => {
        const postDate = new Date(post.data_publicacao).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        
        // --- CORREÇÃO APLICADA AQUI ---
        // A variável 'postLink' agora aponta SEMPRE para a página interna do post.
        const postLink = `/post?id=${post.id}`;
        
        // O atributo 'target' não é mais necessário aqui, pois o link é sempre interno.
        const target = '';

        const excerptText = post.conteudo ? post.conteudo.replace(/<[^>]*>?/gm, ' ').trim() : 'Clique para ver mais.';
        const excerpt = excerptText.length > 120 ? excerptText.substring(0, 120) + '...' : excerptText;
        const imageUrl = post.imagem_url || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f';

        return `
            <a href="${postLink}" ${target} class="post-card">
                <div class="post-card-image" style="background-image: url('${imageUrl}')"></div>
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

    const renderFilteredPosts = () => {
        postsContainer.innerHTML = '';
        if (!searchInput || !sortSelect) return;

        const searchTerm = searchInput.value.toLowerCase();
        const sortOrder = sortSelect.value;

        // 1. Filtra os posts pelo termo de busca
        let filteredPosts = allPosts.filter(post => 
            post.titulo.toLowerCase().includes(searchTerm)
        );

        // 2. Ordena os posts filtrados
        filteredPosts.sort((a, b) => {
            switch (sortOrder) {
                case 'antigos':
                    return new Date(a.data_publicacao) - new Date(b.data_publicacao);
                case 'az':
                    return a.titulo.localeCompare(b.titulo);
                case 'za':
                    return b.titulo.localeCompare(a.titulo);
                case 'recentes':
                default:
                    return new Date(b.data_publicacao) - new Date(a.data_publicacao);
            }
        });
        
        // 3. Renderiza o resultado na tela
        if (filteredPosts.length === 0) {
            postsContainer.innerHTML = '<p>Nenhum post encontrado com os filtros selecionados.</p>';
        } else {
            filteredPosts.forEach(post => {
                postsContainer.insertAdjacentHTML('beforeend', renderPostCard(post));
            });
        }
    };

    const initialLoad = async () => {
        postsContainer.innerHTML = '<p>Carregando publicações...</p>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar posts.');
            
            allPosts = await response.json();
            
            renderFilteredPosts(); // Renderiza com os filtros padrão
        } catch (error) {
            console.error('Erro:', error);
            postsContainer.innerHTML = '<p style="color:red;">Ocorreu um erro ao carregar as publicações.</p>';
        }
    };
    
    // Adiciona os event listeners para os filtros
    searchInput.addEventListener('input', renderFilteredPosts);
    sortSelect.addEventListener('change', renderFilteredPosts);

    initialLoad();
});