document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/posts';

    // --- ELEMENTOS DO DOM ---
    const addPostForm = document.getElementById('add-post-form');
    const postsListContainer = document.getElementById('posts-list-container');
    const postImageInput = document.getElementById('post-image');
    const fileNameDisplay = document.querySelector('.file-name-display');
    const formTitle = document.getElementById('form-title');
    const postIdInput = document.getElementById('post-id');
    const savePostBtn = document.getElementById('save-post-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    // --- FUNÇÕES DE UI ---
    const showConfirmationModal = (title, text) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmation-modal');
            modal.classList.remove('hidden');
            modal.querySelector('.modal-title').textContent = title;
            modal.querySelector('#modal-text').textContent = text;
            
            document.getElementById('modal-confirm-btn').onclick = () => { modal.classList.add('hidden'); resolve(true); };
            document.getElementById('modal-cancel-btn').onclick = () => { modal.classList.add('hidden'); resolve(false); };
        });
    };

    const resetForm = () => {
        addPostForm.reset();
        postIdInput.value = '';
        fileNameDisplay.textContent = 'Nenhum arquivo escolhido';
        formTitle.textContent = 'Adicionar Novo Post';
        savePostBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Post';
        cancelEditBtn.style.display = 'none';
    };

    // --- RENDERIZAÇÃO E LÓGICA DA API ---
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
                    <button class="btn-icon btn-edit" data-tooltip="Editar Post"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-icon btn-delete" data-tooltip="Apagar Post"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
    };

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
                posts.forEach(post => postsListContainer.insertAdjacentHTML('beforeend', renderPostItem(post)));
            }
            initTooltips();
        } catch (error) {
            console.error('Erro:', error);
            postsListContainer.innerHTML = '<p class="error-message">Não foi possível carregar os posts.</p>';
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(addPostForm);
        const postId = postIdInput.value;
        const isEditing = !!postId;
        
        const url = isEditing ? `${API_URL}/${postId}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            // Para PUT com FormData, o fetch funciona da mesma forma
            const response = await fetch(url, { method, body: formData });

            if (response.ok) {
                resetForm();
                fetchAndRenderPosts();
                showToast(`Post ${isEditing ? 'atualizado' : 'publicado'} com sucesso!`, 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || `Falha ao ${isEditing ? 'atualizar' : 'publicar'} o post.`);
            }
        } catch (error) {
            console.error('Erro ao enviar post:', error);
            showToast(error.message, 'error');
        }
    };
    
    const handleListClick = async (e) => {
        const target = e.target;
        const editButton = target.closest('.btn-edit');
        const deleteButton = target.closest('.btn-delete');
        
        if (editButton) {
            const postItem = editButton.closest('.post-item');
            const postId = postItem.dataset.id;
            try {
                const response = await fetch(`${API_URL}/${postId}`);
                if (!response.ok) throw new Error('Post não encontrado');
                const post = await response.json();

                // Preenche o formulário para edição
                formTitle.textContent = 'Editar Post';
                postIdInput.value = post.id;
                document.getElementById('post-title').value = post.titulo;
                document.getElementById('post-external-url').value = post.external_url || '';
                document.getElementById('post-content').value = post.conteudo || '';
                document.getElementById('post-category').value = post.categoria || '';
                fileNameDisplay.textContent = post.imagem_url ? post.imagem_url.split('/').pop() : 'Nenhum arquivo escolhido';
                
                savePostBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
                cancelEditBtn.style.display = 'inline-block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                showToast(error.message, 'error');
            }
        }

        if (deleteButton) {
            const postItem = deleteButton.closest('.post-item');
            const postId = postItem.dataset.id;
            const postTitle = postItem.querySelector('h3').textContent;
            const confirmed = await showConfirmationModal('Apagar Post', `Tem certeza que deseja apagar "${postTitle}"?`);

            if (confirmed) {
                try {
                    const response = await fetch(`${API_URL}/${postId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Falha ao apagar o post.');
                    
                    fetchAndRenderPosts();
                    showToast('Post apagado com sucesso.', 'success');
                } catch (error) {
                    showToast(error.message, 'error');
                }
            }
        }
    };

    // --- EVENT LISTENERS ---
    if (addPostForm) addPostForm.addEventListener('submit', handleFormSubmit);
    if (postsListContainer) postsListContainer.addEventListener('click', handleListClick);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetForm);
    if (postImageInput) {
        postImageInput.addEventListener('change', () => {
            fileNameDisplay.textContent = postImageInput.files.length > 0 ? postImageInput.files[0].name : 'Nenhum arquivo escolhido';
        });
    }

    // --- INICIALIZAÇÃO ---
    fetchAndRenderPosts();
});