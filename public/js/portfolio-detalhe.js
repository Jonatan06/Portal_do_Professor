document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. SETUP INICIAL ---
    const postContainer = document.getElementById('post-content-area');
    const commentsSection = document.getElementById('comments-section');
    const commentsList = document.getElementById('comments-list');
    const commentsTitle = document.getElementById('comments-title');
    const mainCommentForm = document.getElementById('comment-form');
    const loginPrompt = document.getElementById('comment-login-prompt');

    const postId = new URLSearchParams(window.location.search).get('id');
    let currentUser = {};

    if (!postId) {
        postContainer.innerHTML = '<h1>Erro: Post não especificado.</h1>';
        if (commentsSection) commentsSection.style.display = 'none';
        return;
    }

    // --- 2. FUNÇÕES DE LÓGICA E RENDERIZAÇÃO ---

    function setUserState() {
        const token = localStorage.getItem('alunoAuthToken') || localStorage.getItem('authToken');
        const alunoData = JSON.parse(localStorage.getItem('alunoLogado') || 'null');
        const profData = JSON.parse(localStorage.getItem('professorLogado') || 'null');
        const userData = alunoData || profData;
        
        if (token && userData) {
            currentUser = {
                loggedIn: true,
                role: alunoData ? 'aluno' : 'professor',
                user: userData,
                token: token
            };
        } else {
            currentUser = { loggedIn: false };
        }
    }

    function updateUIForAuthState() {
        if (currentUser.loggedIn) {
            loginPrompt.classList.add('hidden');
            mainCommentForm.classList.remove('hidden');
            document.getElementById('comment-author').value = currentUser.user.nome;
        } else {
            loginPrompt.classList.remove('hidden');
            mainCommentForm.classList.add('hidden');
        }
    }
    
    async function fetchPostDetails() {
        try {
            const response = await fetch(`/api/posts/${postId}`);
            if (!response.ok) throw new Error('Post não encontrado');
            const post = await response.json();
            document.title = `${post.titulo} - Portal do Professor`;

            // ==================================================================
            // ||           **INÍCIO DA CORREÇÃO PRINCIPAL** ||
            // ==================================================================
            // Cria o HTML do botão de link externo, somente se ele existir
            const externalLinkButton = post.external_url 
                ? `<a href="${post.external_url}" target="_blank" rel="noopener noreferrer" class="btn-external-link">
                       <i class="fas fa-external-link-alt"></i> Acessar Link Externo
                   </a>`
                : '';
            // ==================================================================
            // ||             **FIM DA CORREÇÃO PRINCIPAL** ||
            // ==================================================================

            postContainer.innerHTML = `
                <header class="post-header">
                    <span class="post-category">${post.categoria || 'Geral'}</span>
                    <h1>${post.titulo}</h1>
                    <div class="post-meta-author">
                        <img src="/uploads/images/default-avatar.png" alt="Foto do Professor" class="author-photo">
                        <span>Por Professor</span> • <span>${new Date(post.data_publicacao).toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
                    </div>
                </header>
                <figure class="post-featured-image"><img src="${post.imagem_url || '/uploads/images/default-image.png'}" alt="Imagem de capa do post"></figure>
                <div class="post-body">
                    ${externalLinkButton}
                    ${(post.conteudo || '').replace(/\n/g, '<br>')}
                </div>`;
        } catch(error) {
            postContainer.innerHTML = '<h1>Post não encontrado</h1><p>O post que você procura não existe ou foi removido.</p>';
            if(commentsSection) commentsSection.style.display = 'none';
        }
    }
    
    async function fetchAndRenderComments() {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, { cache: 'no-cache' });
            if (!response.ok) throw new Error('Falha ao carregar comentários.');
            const comments = await response.json();
            commentsTitle.textContent = `${comments.length} Comentário(s)`;
            const commentTree = buildCommentTree(comments);
            commentsList.innerHTML = commentTree.length > 0 
                ? commentTree.map(commentNode => renderComment(commentNode, false)).join('')
                : '<p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
        } catch (error) {
            console.error('Erro ao renderizar comentários:', error);
        }
    }

    function buildCommentTree(comments) {
        const commentMap = comments.reduce((map, comment) => {
            map[comment.id] = { ...comment, replies: [] };
            return map;
        }, {});
        const tree = [];
        for (const commentId in commentMap) {
            const comment = commentMap[commentId];
            if (comment.parent_id) {
                if (commentMap[comment.parent_id]) {
                    commentMap[comment.parent_id].replies.push(comment);
                }
            } else {
                tree.push(comment);
            }
        }
        return tree;
    }

    function renderComment(commentNode, isReply) {
        const { id, conteudo, autor, data_publicacao, data_edicao, autor_imagem_url, aluno_id, replies } = commentNode;
        const dataPubFormatada = new Date(data_publicacao + 'Z').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        const dataEditFormatada = data_edicao ? new Date(data_edicao + 'Z').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null;
        
        const avatarSrc = autor_imagem_url || '/uploads/images/default-avatar.png';
        const isAuthor = currentUser.loggedIn && currentUser.role === 'aluno' && Number(currentUser.user.id) === Number(aluno_id);
        const isProfessor = currentUser.loggedIn && currentUser.role === 'professor';
        const isProfessorOwner = isProfessor && autor === `${currentUser.user.nome} (Professor)`;

        let actionsHTML = '<div class="comment-actions">';
        if (isAuthor || isProfessorOwner) actionsHTML += `<button class="btn-edit-comment" data-id="${id}">Editar</button>`;
        if (isAuthor || isProfessor) actionsHTML += `<button class="btn-delete-comment" data-id="${id}">Apagar</button>`;
        if (isProfessor && !isReply) actionsHTML += `<button class="btn-reply-comment" data-id="${id}">Responder</button>`;
        actionsHTML += '</div>';

        return `
            <div class="comment ${isReply ? 'comment-reply' : ''}" id="comment-container-${id}">
                <div class="comment-box">
                    <img src="${avatarSrc}" alt="Avatar de ${autor}" class="comment-avatar">
                    <div class="comment-content">
                        <div class="comment-author"><strong>${autor}</strong><span>- ${dataPubFormatada}</span>${dataEditFormatada ? `<span class="edited-timestamp">(editado em ${dataEditFormatada})</span>` : ''}</div>
                        <p class="comment-text">${conteudo}</p>
                        ${actionsHTML}
                    </div>
                </div>
                <div class="reply-form-container" id="reply-form-for-${id}"></div>
                <div class="replies-container" id="replies-for-${id}">${(replies || []).map(reply => renderComment(reply, true)).join('')}</div>
            </div>`;
    }

    // --- 3. FUNÇÕES DE AÇÃO E EVENTOS ---

    function showConfirmationModal(title, text) {
        return new Promise(resolve => {
            const modal = document.getElementById('confirmation-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalText = document.getElementById('modal-text');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');
            const closeBtn = document.getElementById('modal-close-btn');

            modalTitle.textContent = title;
            modalText.textContent = text;
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);

            const close = (decision) => {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                    resolve(decision);
                }, 300);
            };

            confirmBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
            closeBtn.onclick = () => close(false);
        });
    }
    
    async function submitComment(commentData, onSuccess) {
        if (!currentUser.loggedIn) return showToast('Autenticação necessária.', 'error');
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': currentUser.token },
                body: JSON.stringify(commentData)
            });
            if (!response.ok) throw new Error((await response.json()).message);
            showToast('Publicado com sucesso!', 'success');
            if (onSuccess) onSuccess();
            await fetchAndRenderComments();
        } catch (error) { showToast(`Erro: ${error.message}`, 'error'); }
    }

    mainCommentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const contentInput = document.getElementById('comment-text');
        const conteudo = contentInput.value.trim();
        if (!conteudo) return;
        submitComment({ post_id: postId, conteudo, parent_id: null }, () => contentInput.value = '');
    });
    
    // Listener único para todas as ações na lista de comentários
    commentsList.addEventListener('click', async (e) => {
        const target = e.target;
        const commentContainer = target.closest('.comment');
        if (!commentContainer) return;

        const commentId = commentContainer.id.split('-')[2];
        const form = target.closest('form');

        // Ações de Apagar, Editar, Responder
        if (target.matches('.btn-delete-comment')) {
            const confirmed = await showConfirmationModal('Apagar Comentário', 'Tem certeza de que deseja apagar este comentário permanentemente?');
            if (confirmed) {
                try {
                    const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE', headers: { 'x-auth-token': currentUser.token } });
                    if (!response.ok) throw new Error((await response.json()).message || 'Falha ao apagar');
                    showToast('Comentário apagado.', 'success');
                    await fetchAndRenderComments();
                } catch (error) { showToast(`Erro: ${error.message}`, 'error'); }
            }
        }
        
        if (target.matches('.btn-edit-comment')) {
            const commentBox = commentContainer.querySelector('.comment-box');
            const commentText = commentBox.querySelector('.comment-text').textContent;
            commentBox.classList.add('hidden');
            const formHTML = `<form class="edit-comment-form"><textarea>${commentText}</textarea><div><button type="submit">Salvar</button><button type="button" class="cancel-edit">Cancelar</button></div></form>`;
            commentBox.insertAdjacentHTML('afterend', formHTML);
        }

        if (target.matches('.btn-reply-comment')) {
            const replyContainer = commentContainer.querySelector('.reply-form-container');
            if (replyContainer.innerHTML) {
                replyContainer.innerHTML = '';
            } else {
                replyContainer.innerHTML = `<form class="reply-comment-form"><textarea placeholder="Escreva sua resposta..."></textarea><div><button type="submit">Responder</button><button type="button" class="cancel-reply">Cancelar</button></div></form>`;
            }
        }

        // Ações de Cancelar Edição/Resposta
        if (target.matches('.cancel-edit')) {
            const formContainer = target.closest('.edit-comment-form');
            commentContainer.querySelector('.comment-box').classList.remove('hidden');
            formContainer.remove();
        }
        
        if (target.matches('.cancel-reply')) {
            target.closest('.reply-form-container').innerHTML = '';
        }

        // Submissão de Formulários de Edição/Resposta
        if (form) {
            e.preventDefault();
            const textarea = form.querySelector('textarea');
            const content = textarea.value.trim();
            if (!content) return;

            if (form.matches('.edit-comment-form')) {
                try {
                    const response = await fetch(`/api/comments/${commentId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'x-auth-token': currentUser.token },
                        body: JSON.stringify({ conteudo: content })
                    });
                    if (!response.ok) throw new Error((await response.json()).message);
                    showToast('Comentário editado!', 'success');
                    await fetchAndRenderComments();
                } catch (error) { showToast(`Erro: ${error.message}`, 'error'); }
            }

            if (form.matches('.reply-comment-form')) {
                submitComment({ post_id: postId, conteudo: content, parent_id: commentId }, () => {
                    form.closest('.reply-form-container').innerHTML = '';
                });
            }
        }
    });
    
    // --- 4. INICIALIZAÇÃO DA PÁGINA ---
    async function init() {
        setUserState();
        updateUIForAuthState();
        await fetchPostDetails();
        await fetchAndRenderComments();
    }

    init();
});