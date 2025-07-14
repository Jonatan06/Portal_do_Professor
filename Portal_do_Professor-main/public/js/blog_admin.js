document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/posts';

    // --- ELEMENTOS DO DOM ---
    const addPostForm = document.getElementById('add-post-form');
    const postsListContainer = document.getElementById('posts-list-container');
    const postImageInput = document.getElementById('post-image');
    const fileNameDisplay = document.querySelector('.file-name-display');

    // --- FUNÇÕES DE UI (Modal) ---
    const showConfirmationModal = (title, text) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmation-modal');
            const modalTitle = modal.querySelector('.modal-title');
            const modalText = modal.querySelector('#modal-text');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            modalTitle.textContent = title;
            modalText.textContent = text;
            modal.classList.remove('hidden');

            const handleConfirm = () => {
                modal.classList.add('hidden');
                resolve(true);
            };
            const handleCancel = () => {
                modal.classList.add('hidden');
                resolve(false);
            };

            confirmBtn.onclick = handleConfirm;
            cancelBtn.onclick = handleCancel;
        });
    };


    // --- LÓGICA DO FORMULÁRIO E POSTS ---
    if (postImageInput && fileNameDisplay) {
        postImageInput.addEventListener('change', () => {
            fileNameDisplay.textContent = postImageInput.files.length > 0 ? postImageInput.files[0].name : 'Nenhum arquivo escolhido';
        });
    }

    // ATUALIZADO: Adicionado data-tooltip
    const renderPostItem = (post) => {
        const postDate = new Date(post.data_publicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        const imageUrl = post.imagem_url || '/uploads/images/default-image.png';
        return `
            <div class="post-item" data-id="${post.id}">
                <img src="${imageUrl}" alt="Imagem do post" class="post-item-image" onerror="this.onerror=null;this.src='/uploads/images/default-image.png';">
                <div class="post-item-info">
                    <h3>${post.titulo}</h3>
                    <p><span class="category-badge">${post.categoria || 'Geral'}</span><span class="date-info">${postDate}</span></p>
                </div>
                <div class="post-item-actions">
                    <button class="btn-icon btn-delete" data-tooltip="Apagar Post"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
    };

    // ATUALIZADO: Adicionada chamada a initTooltips()
    const fetchAndRenderPosts = async () => {
        if (!postsListContainer) return;
        postsListContainer.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Carregando posts...</div>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar posts.');
            const posts = await response.json();
            postsListContainer.innerHTML = '';
            if (posts.length === 0) {
                postsListContainer.innerHTML = '<p class="empty-list">Nenhum post publicado ainda.</p>';
            } else {
                posts.forEach(post => {
                    postsListContainer.insertAdjacentHTML('beforeend', renderPostItem(post));
                });
            }
            // Inicializa os tooltips após os posts serem renderizados
            initTooltips();
        } catch (error) {
            console.error('Erro:', error);
            postsListContainer.innerHTML = '<p class="error-message">Não foi possível carregar os posts.</p>';
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(addPostForm);
        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            if (response.ok) {
                addPostForm.reset();
                if (fileNameDisplay) { fileNameDisplay.textContent = 'Nenhum arquivo escolhido'; }
                fetchAndRenderPosts();
                showToast('Post publicado com sucesso!', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Falha ao publicar o post.');
            }
        } catch (error) {
            console.error('Erro ao publicar:', error);
            showToast(error.message, 'error');
        }
    };

    const handleDeleteClick = async (e) => {
        const deleteButton = e.target.closest('.btn-delete');
        if (!deleteButton) return;

        const postItem = deleteButton.closest('.post-item');
        const postId = postItem.dataset.id;
        const postTitle = postItem.querySelector('h3').textContent;

        const confirmed = await showConfirmationModal('Apagar Post', `Tem certeza que deseja apagar "${postTitle}"?`);

        if (confirmed) {
            try {
                const response = await fetch(`${API_URL}/${postId}`, { method: 'DELETE' });
                if (response.ok) {
                    postItem.remove();
                    showToast('Post apagado com sucesso.', 'success');
                } else {
                    throw new Error('Falha ao apagar o post.');
                }
            } catch (error) {
                console.error('Erro ao apagar:', error);
                showToast(error.message, 'error');
            }
        }
    };

    // --- INICIALIZAÇÃO ---
    if (addPostForm) { addPostForm.addEventListener('submit', handleFormSubmit); }
    if (postsListContainer) { postsListContainer.addEventListener('click', handleDeleteClick); }
    fetchAndRenderPosts();
});