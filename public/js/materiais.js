document.addEventListener('DOMContentLoaded', () => {
    protectPage();

    const API_URL = '/api/materiais';
    let allMaterials = [];

    // --- SELEÇÃO DE ELEMENTOS ---
    const addMaterialBtn = document.querySelector('.btn-add-material');
    const modal = document.getElementById('material-modal');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    const cancelBtn = modal.querySelector('#cancel-btn');
    const materialForm = document.getElementById('material-form');
    const modalTitle = document.getElementById('modal-title');
    const materialsContainer = document.querySelector('.materials-container');
    const filterTabs = document.querySelector('.filter-tabs');
    const fileInput = document.getElementById('material-file');
    const fileLabelText = document.querySelector('.file-label-text');

    const coverImageInput = document.getElementById('material-cover-image');
    const coverImagePreview = document.getElementById('cover-image-preview');

    const categories = [
        { id: 'slides', name: 'Slides de Aula', icon: 'fa-chalkboard-user' },
        { id: 'apostilas', name: 'Apostilas e Textos', icon: 'fa-book-open' },
        { id: 'exercicios', name: 'Exercícios e Atividades', icon: 'fa-file-lines' },
        { id: 'videos', name: 'Vídeos', icon: 'fa-video' },
        { id: 'outros', name: 'Outros', icon: 'fa-box-archive' },
    ];

    // --- FUNÇÕES DO MODAL ---
    const openModalForAdd = () => {
        materialForm.reset();
        fileLabelText.textContent = 'Clique para escolher um arquivo...';
        coverImagePreview.style.display = 'none';
        coverImagePreview.src = '#';
        document.getElementById('material-id').value = '';
        modalTitle.textContent = 'Adicionar Novo Material';
        modal.classList.remove('hidden');
    };
    
    // >>> INÍCIO DA FUNÇÃO DE EDIÇÃO ATIVADA <<<
    const openModalForEdit = (material) => {
        // Limpa o formulário e o ID
        materialForm.reset();
        const existingIdField = document.getElementById('material-id');
        if (existingIdField) existingIdField.value = '';

        // Preenche os campos com os dados do material
        modalTitle.textContent = 'Editar Material';
        document.getElementById('material-id').value = material.id;
        document.getElementById('material-title').value = material.titulo;
        document.getElementById('material-description').value = material.descricao || '';
        document.getElementById('material-category').value = material.categoria;
        document.getElementById('material-link').value = material.link_externo || '';

        // Mostra a pré-visualização da imagem de capa, se existir
        if (material.imagem_capa_url) {
            coverImagePreview.src = material.imagem_capa_url;
            coverImagePreview.style.display = 'block';
        } else {
            coverImagePreview.style.display = 'none';
        }
        
        // Informa sobre os arquivos existentes (sem permitir edição direta deles)
        const fileCount = material.arquivos ? material.arquivos.length : 0;
        if (fileCount > 0) {
            fileLabelText.textContent = `${fileCount} arquivo(s) existente(s). Envie novos para substituí-los.`;
        } else {
            fileLabelText.textContent = 'Clique para escolher novos arquivos...';
        }

        // Abre o modal
        modal.classList.remove('hidden');
    };
    // >>> FIM DA FUNÇÃO DE EDIÇÃO ATIVADA <<<

    const closeModal = () => modal.classList.add('hidden');

    const showConfirmationModal = (title, text) => {
        return new Promise((resolve) => {
            const confirmModal = document.getElementById('confirmation-modal');
            const mTitle = confirmModal.querySelector('.modal-title');
            const mText = confirmModal.querySelector('#modal-text');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            mTitle.textContent = title;
            mText.textContent = text;
            confirmModal.classList.remove('hidden');

            const handleConfirm = () => {
                confirmModal.classList.add('hidden');
                resolve(true);
            };
            const handleCancel = () => {
                confirmModal.classList.add('hidden');
                resolve(false);
            };

            confirmBtn.onclick = handleConfirm;
            cancelBtn.onclick = handleCancel;
        });
    };

    // --- RENDERIZAÇÃO ---
    async function fetchAndRenderMaterials(filter = 'todos') {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Não foi possível carregar os materiais.");
            allMaterials = await response.json(); 

            materialsContainer.innerHTML = ''; 

            categories.forEach(category => {
                const materialsForCategory = allMaterials.filter(m => m.categoria === category.id);
                if (filter !== 'todos' && filter !== category.id) { return; }

                const section = document.createElement('section');
                section.className = 'material-section';
                section.dataset.category = category.id;

                let listContent = materialsForCategory.length > 0
                    ? materialsForCategory.map(createMaterialListItem).join('')
                    : '<div class="empty-placeholder">Nenhum material nesta categoria.</div>';
                
                section.innerHTML = `
                    <h2><i class="fa-solid ${category.icon}"></i> ${category.name}</h2>
                    <div class="material-list">${listContent}</div>`;
                materialsContainer.appendChild(section);
            });

            initTooltips();

        } catch(error) {
            console.error("Erro ao renderizar materiais:", error);
            materialsContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
            showToast(error.message, 'error');
        }
    }
    
    function createMaterialListItem(data) {
        const hasFiles = data.arquivos && data.arquivos.length > 0;
        const hasLink = !!data.link_externo;
        
        let iconClass = 'fa-file-alt'; // Ícone padrão
        if (hasLink && !hasFiles) iconClass = 'fa-link';
        if (hasFiles) iconClass = 'fa-folder';

        const formattedDate = new Date(data.data_upload).toLocaleDateString('pt-BR');
        const summary = (data.descricao || '').length > 100 ? (data.descricao || '').substring(0, 100) + '...' : (data.descricao || '');

        const fileCountText = hasFiles ? `${data.arquivos.length} arquivo(s)` : (hasLink ? 'Link Externo' : '---');

        return `
            <div class="material-list-item" data-id="${data.id}" data-title="${data.titulo}">
                <div class="item-icon"><i class="fas ${iconClass}"></i></div>
                <div class="item-details">
                    <strong>${data.titulo}</strong>
                    <p>${summary}</p>
                </div>
                <div class="item-meta item-size">${fileCountText}</div>
                <div class="item-meta item-date">Adicionado em ${formattedDate}</div>
                <div class="item-actions">
                    <button class="btn-icon btn-edit" data-tooltip="Editar"><i class="fa-solid fa-pencil-alt"></i></button>
                    <button class="btn-icon btn-delete" data-tooltip="Apagar"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    }

    // --- EVENT LISTENERS ---
    addMaterialBtn.addEventListener('click', openModalForAdd);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    fileInput.addEventListener('change', () => {
        const numFiles = fileInput.files.length;
        if (numFiles > 0) {
            fileLabelText.textContent = `${numFiles} arquivo(s) selecionado(s)`;
        } else {
            fileLabelText.textContent = 'Clique para escolher um arquivo...';
        }
    });

    coverImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                coverImagePreview.src = event.target.result;
                coverImagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // >>> INÍCIO DA LÓGICA DE SUBMISSÃO ATUALIZADA <<<
    materialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(materialForm);
        const id = document.getElementById('material-id').value;
        const isEditing = !!id;
    
        const url = isEditing ? `${API_URL}/${id}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';
    
        try {
            const response = await fetch(url, {
                method: method,
                body: formData
                // O token de autenticação já é adicionado pelo script auth.js
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao salvar o material.");
            }
            
            closeModal();
            fetchAndRenderMaterials(filterTabs.querySelector('.active').dataset.filter);
            showToast(`Material ${isEditing ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
    
        } catch(error) {
            showToast(`Erro: ${error.message}`, 'error');
        }
    });
    // >>> FIM DA LÓGICA DE SUBMISSÃO ATUALIZADA <<<

    materialsContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit');
        const deleteBtn = e.target.closest('.btn-delete');

        if (editBtn) {
            const item = editBtn.closest('.material-list-item');
            const id = parseInt(item.dataset.id);
            const materialToEdit = allMaterials.find(m => m.id === id);
            if (materialToEdit) {
                openModalForEdit(materialToEdit);
            }
        }
        
        if (deleteBtn) {
            const item = deleteBtn.closest('.material-list-item');
            const id = item.dataset.id;
            const title = item.dataset.title;
            
            const confirmed = await showConfirmationModal('Apagar Material', `Tem certeza que deseja apagar o material "${title}"? Esta ação não pode ser desfeita.`);

            if (confirmed) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (!response.ok) {
                        throw new Error("Falha ao apagar o material no servidor.");
                    }
                    await fetchAndRenderMaterials(filterTabs.querySelector('.active').dataset.filter);
                    showToast('Material apagado com sucesso.', 'success');
                } catch (error) {
                    showToast(`Erro: ${error.message}`, 'error');
                }
            }
        }
    });

    filterTabs.addEventListener('click', e => {
        if (e.target.tagName !== 'A') return;
        e.preventDefault();
        filterTabs.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        fetchAndRenderMaterials(e.target.dataset.filter);
    });

    // --- INICIALIZAÇÃO ---
    fetchAndRenderMaterials();
});