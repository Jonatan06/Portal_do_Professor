document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const postContainer = document.getElementById('post-content-area');
    const commentsList = document.getElementById('comments-list');
    const commentsTitle = document.getElementById('comments-title');
    
    // --- ELEMENTOS DO FORMULÁRIO DE COMENTÁRIO ---
    const commentForm = document.getElementById('comment-form');
    const loginPrompt = document.getElementById('comment-login-prompt');
    const commentAuthorInput = document.getElementById('comment-author');

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        postContainer.innerHTML = '<h1>Erro: Post não especificado.</h1>';
        return;
    }

    // --- LÓGICA DE AUTENTICAÇÃO ---
    const aluno = getAlunoLogado();

    if (aluno) {
        // Aluno está logado
        loginPrompt.classList.add('hidden');
        commentForm.classList.remove('hidden');
        commentAuthorInput.value = aluno.nome;
    } else {
        // Aluno NÃO está logado
        loginPrompt.classList.remove('hidden');
        commentForm.classList.add('hidden');
    }

    const fetchAndRenderPost = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) throw new Error('Post não encontrado');
            const post = await response.json();

            document.title = `${post.titulo} - Portal do Professor`;
            const postDate = new Date(post.data_publicacao).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
            const imageUrl = post.imagem_url || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f';
            const formattedContent = (post.conteudo || '').replace(/\n/g, '<br>');

            let externalLinkButton = '';
            if (post.external_url) {
                externalLinkButton = `
                    <div class="external-link-wrapper">
                        <a href="${post.external_url}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-external-link-alt"></i> Acessar Conteúdo Original
                        </a>
                    </div>
                `;
            }

            postContainer.innerHTML = `
                <article>
                    <header class="post-header">
                        <div class="post-category">${post.categoria}</div>
                        <h1>${post.titulo}</h1>
                        <div class="post-meta-author">
                            <img src="/uploads/images/default-avatar.png" alt="Foto do Professor" class="author-photo">
                            <span>Por Professor</span> • <span>${postDate}</span>
                        </div>
                    </header>
                    <figure class="post-featured-image"><img src="${imageUrl}" alt="Imagem do post"></figure>
                    
                    ${externalLinkButton}

                    <div class="post-body">${formattedContent}</div>
                </article>
            `;
        } catch (error) {
            console.error('Erro ao buscar o post:', error);
            postContainer.innerHTML = `<h1>Erro 404: Post não encontrado</h1><p>O post que você está procurando não existe ou foi removido.</p>`;
        }
    };

    const fetchAndRenderComments = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            if (!response.ok) throw new Error('Falha ao carregar comentários.');
            const comments = await response.json();
            
            commentsList.innerHTML = '';
            commentsTitle.textContent = `${comments.length} Comentário(s)`;

            if (comments.length > 0) {
                comments.forEach(comment => {
                    const dataObj = new Date(comment.data_publicacao);
                    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
                    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const commentDate = `${dataFormatada} às ${horaFormatada}`;
                    commentsList.innerHTML += `
                        <div class="comment">
                            <img src="https://i.pravatar.cc/50?u=${encodeURIComponent(comment.autor)}" alt="Avatar" class="comment-avatar">
                            <div class="comment-content">
                                <div class="comment-author"><strong>${comment.autor}</strong> <span>- ${commentDate}</span></div>
                                <p class="comment-text">${comment.conteudo}</p>
                            </div>
                        </div>`;
                });
            } else {
                commentsList.innerHTML = '<p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
            }
        } catch (error) {
            console.error('Erro ao buscar comentários:', error);
            showToast(error.message, 'error');
            commentsList.innerHTML = '<p style="color:red;">Erro ao carregar comentários.</p>';
        }
    };

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!aluno) {
                showToast("Você precisa estar logado para comentar.", "error");
                return;
            }
            
            const contentInput = document.getElementById('comment-text');
            const newComment = {
                autor: aluno.nome, 
                conteudo: contentInput.value.trim()
            };

            if (!newComment.conteudo) {
                showToast('Por favor, escreva um comentário.', 'info');
                return;
            }

            try {
                const response = await fetch(`/api/posts/${postId}/comments`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newComment)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao publicar o comentário.');
                }
                
                contentInput.value = '';
                showToast('Comentário publicado com sucesso!', 'success');
                await fetchAndRenderComments();

            } catch (error) {
                console.error('Erro ao enviar comentário:', error);
                showToast(error.message, 'error');
            }
        });
    }

    fetchAndRenderPost();
    fetchAndRenderComments();
});