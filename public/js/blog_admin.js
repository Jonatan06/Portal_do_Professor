document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/posts';

    // --- ELEMENTOS DO DOM ---
    const addPostForm = document.getElementById('add-post-form');
    const postsListContainer = document.getElementById('posts-list-container');
    const postImageInput = document.getElementById('post-image');
    const fileNameDisplay = document.querySelector('.file-name-display');

    // --- FUNÇÕES DE UI (Notificação e Modal) ---
    let notificationTimeout;
    function showNotification(message, isError = false) {
        const notification = document.getElementById('custom-notification');
        const notificationMessage = document.getElementById('notification-message');
        const notificationIcon = notification.querySelector('.notification-icon');
        if (!notification || !notificationMessage) return;

        clearTimeout(notificationTimeout);
        notificationMessage.textContent = message;
        notificationIcon.className = isError ? 'fas fa-times-circle notification-icon' : 'fas fa-check-circle notification-icon';
        notification.style.backgroundColor = isError ? '#c0392b' : '#2c3e50';
        notificationIcon.style.color = isError ? '#ffffff' : '#27ae60';

        notification.classList.add('show');
        notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

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

    const renderPostItem = (post) => {
        const postDate = new Date(post.data_publicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        const imageUrl = post.imagem_url || '/assets/default-image.png';
        return `
            <div class="post-item" data-id="${post.id}">
                <img src="${imageUrl}" alt="Imagem do post" class="post-item-image" onerror="this.style.display='none'">
                <div class="post-item-info">
                    <h3>${post.titulo}</h3>
                    <p><span class="category-badge">${post.categoria || 'Geral'}</span><span class="date-info">${postDate}</span></p>
                </div>
                <div class="post-item-actions">
                    <button class="btn-icon btn-delete" title="Apagar Post"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
    };

    const fetchAndRenderPosts = async () => {
        // ... (código existente sem alterações)
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
                showNotification('Post publicado com sucesso!');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Falha ao publicar o post.');
            }
        } catch (error) {
            console.error('Erro ao publicar:', error);
            showNotification(error.message, true);
        }
    };

    // FUNÇÃO DE APAGAR ATUALIZADA
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
                    showNotification('Post apagado com sucesso.');
                } else {
                    throw new Error('Falha ao apagar o post.');
                }
            } catch (error) {
                console.error('Erro ao apagar:', error);
                showNotification(error.message, true);
            }
        }
    };

    // --- INICIALIZAÇÃO ---
    if (addPostForm) { addPostForm.addEventListener('submit', handleFormSubmit); }
    if (postsListContainer) { postsListContainer.addEventListener('click', handleDeleteClick); }
    fetchAndRenderPosts();
});