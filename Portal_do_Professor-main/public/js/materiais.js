document.addEventListener('DOMContentLoaded', () => {
    protectPage();

    const API_URL = '/api/materiais';
    let allMaterials = []; // Armazena todos os materiais carregados

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
    
    // NOVA FUNÇÃO para abrir o modal para edição
    const openModalForEdit = (material) => {
        materialForm.reset();
        document.getElementById('material-id').value = material.id;
        modalTitle.textContent = 'Editar Material';

        document.getElementById('material-title').value = material.titulo;
        document.getElementById('material-description').value = material.descricao;
        document.getElementById('material-category').value = material.categoria;
        document.getElementById('material-link').value = material.link_externo || '';

        fileLabelText.textContent = material.nome_arquivo || 'Clique para escolher um novo arquivo...';
        
        if (material.imagem_capa_url) {
            coverImagePreview.src = material.imagem_capa_url;
            coverImagePreview.style.display = 'block';
        } else {
            coverImagePreview.style.display = 'none';
            coverImagePreview.src = '#';
        }

        modal.classList.remove('hidden');
    };

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
            allMaterials = await response.json(); // Salva os materiais na variável global

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
    
    function getFileIcon(mimeType) {
        if (!mimeType) return 'fa-link';
        if (mimeType.includes('pdf')) return 'fa-file-pdf';
        if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'fa-file-powerpoint';
        if (mimeType.includes('word')) return 'fa-file-word';
        if (mimeType.includes('image')) return 'fa-file-image';
        if (mimeType.includes('video')) return 'fa-file-video';
        if (mimeType.includes('zip') || mimeType.includes('archive')) return 'fa-file-archive';
        return 'fa-file-alt';
    }

    // ATUALIZADO: Adiciona o botão de editar
    function createMaterialListItem(data) {
        const isExternalLink = data.link_externo && !data.caminho_arquivo;
        const accessLink = isExternalLink ? data.link_externo : data.caminho_arquivo;
        const downloadAttribute = !isExternalLink ? 'download' : '';
        const targetAttribute = isExternalLink ? 'target="_blank" rel="noopener noreferrer"' : '';
        const iconClass = getFileIcon(data.tipo_arquivo);
        const formattedDate = new Date(data.data_upload).toLocaleDateString('pt-BR');

        return `
            <div class="material-list-item" data-id="${data.id}" data-title="${data.titulo}">
                <div class="item-icon"><i class="fas ${iconClass}"></i></div>
                <div class="item-details">
                    <strong>${data.titulo}</strong>
                    <p>${data.descricao}</p>
                </div>
                <div class="item-meta item-size">${data.tamanho_arquivo || '---'}</div>
                <div class="item-meta item-date">Adicionado em ${formattedDate}</div>
                <div class="item-actions">
                    <a href="${accessLink}" ${targetAttribute} ${downloadAttribute} class="btn-icon" data-tooltip="Acessar/Baixar"><i class="fa-solid fa-download"></i></a>
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
        fileLabelText.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Clique para escolher um arquivo...';
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

    // ATUALIZADO: para lidar com POST (criar) e PUT (editar)
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

    // ATUALIZADO: para lidar com cliques de editar e apagar
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
            
            const confirmed = await showConfirmationModal('Apagar Material', `Tem certeza que deseja apagar o material "${title}"?`);

            if (confirmed) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (!response.ok) {
                        throw new Error("Falha ao apagar o material no servidor.");
                    }
                    item.remove();
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
        fetchAndRenderMaterials(e.target.dataset.filter); // Corrigido para chamar fetchAndRenderMaterials
    });

    // --- INICIALIZAÇÃO ---
    fetchAndRenderMaterials();
});