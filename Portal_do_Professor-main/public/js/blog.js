document.addEventListener('DOMContentLoaded', () => {
    const postContainer = document.getElementById('single-post-content-area');
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContainer.innerHTML = '<h1>Erro: Post não especificado.</h1> <a href="/blog_publico.html" class="btn-back">Voltar ao Blog</a>';
        return;
    }

    const renderComment = (comment) => {
        const commentDate = new Date(comment.data_publicacao).toLocaleString('pt-BR');
        return `<div class="comment"><img src="https://i.pravatar.cc/60?u=${comment.autor}" alt="Avatar" class="comment-avatar"><div class="comment-content"><div class="comment-author"><strong>${comment.autor}</strong> <span>- ${commentDate}</span></div><p>${comment.conteudo}</p></div></div>`;
    };

    const fetchAndRenderComments = async () => {
        const commentsList = document.getElementById('comment-list');
        if (!commentsList) return;
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            if (!response.ok) throw new Error('Falha ao carregar comentários do servidor.');
            const comments = await response.json();
            
            commentsList.innerHTML = '';
            if (comments.length > 0) {
                document.getElementById('comments-count').textContent = comments.length;
                comments.forEach(comment => { commentsList.insertAdjacentHTML('beforeend', renderComment(comment)); });
            } else {
                document.getElementById('comments-count').textContent = '0';
                commentsList.innerHTML = '<p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
            }
        } catch (error) {
            console.error('Erro ao buscar comentários:', error);
            commentsList.innerHTML = '<p style="color:red;">Erro ao carregar comentários.</p>';
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const textarea = form.querySelector('textarea');
        const conteudo = textarea.value.trim();
        if (!conteudo) return alert('Por favor, escreva um comentário.');
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conteudo: conteudo })
            });
            if (response.ok) {
                textarea.value = '';
                fetchAndRenderComments();
            } else {
                throw new Error('Falha ao publicar o comentário.');
            }
        } catch (error) {
            console.error('Erro ao enviar comentário:', error);
            alert(error.message);
        }
    };
    
    const fetchAndRenderPost = async () => {
        postContainer.innerHTML = '<h1>Carregando...</h1>';
        try {
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) throw new Error('Post não encontrado');
            const post = await response.json();
            document.title = `${post.titulo} - Blog`;
            const postDate = new Date(post.data_publicacao).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
            const imageUrl = post.imagem_url || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f';
            const formattedContent = (post.conteudo || '').replace(/\n/g, '<br>');
            postContainer.innerHTML = `
                <article class="single-post-container">
                    <header class="post-header">
                        <div class="post-meta"><a href="#" class="meta-category">${post.categoria}</a></div>
                        <h1>${post.titulo}</h1>
                        <div class="post-meta-author">
                            <img src="https://i.imgur.com/rS1xGj5.jpg" alt="Foto do Professor" class="author-photo">
                            <span>Por Professor</span> • <span>${postDate}</span>
                        </div>
                    </header>
                    <figure class="post-featured-image"><img src="${imageUrl}" alt="Imagem do post ${post.titulo}"></figure>
                    <div class="post-body"><p>${formattedContent}</p></div>
                    <section class="comments-section">
                        <h3 class="section-title"><span id="comments-count">0</span> Comentários</h3>
                        <div class="comment-list" id="comment-list"></div>
                        <div class="comment-form-wrapper">
                            <h3 class="section-title">Deixe um Comentário</h3>
                            <form class="comment-form" id="comment-form">
                                <textarea rows="5" placeholder="Seu comentário..." required></textarea>
                                <button type="submit" class="btn btn-submit">Publicar Comentário</button>
                            </form>
                        </div>
                    </section>
                </article>
            `;
            document.getElementById('comment-form').addEventListener('submit', handleCommentSubmit);
            fetchAndRenderComments();
        } catch (error) {
            console.error('Erro ao buscar o post:', error);
            postContainer.innerHTML = '<h1>Erro 404: Post não encontrado</h1><p>O post que você está procurando não existe ou foi removido.</p>';
        }
    };

    fetchAndRenderPost();
});