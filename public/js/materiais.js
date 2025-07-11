document.addEventListener('DOMContentLoaded', () => {
    protectPage();

    const API_URL = '/api/materiais';

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

    const categories = [
        { id: 'slides', name: 'Slides de Aula', icon: 'fa-chalkboard-user' },
        { id: 'apostilas', name: 'Apostilas e Textos', icon: 'fa-book-open' },
        { id: 'exercicios', name: 'Exercícios e Atividades', icon: 'fa-file-lines' },
        { id: 'videos', name: 'Vídeos', icon: 'fa-video' },
        { id: 'outros', name: 'Outros', icon: 'fa-box-archive' },
    ];

    // --- FUNÇÕES DO MODAL ---
    const openModal = () => {
        materialForm.reset();
        fileLabelText.textContent = 'Clique para escolher um arquivo...';
        document.getElementById('material-id').value = '';
        modalTitle.textContent = 'Adicionar Novo Material';
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
    async function renderMaterials(filter = 'todos') {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Não foi possível carregar os materiais.");
            const allMaterials = await response.json();

            materialsContainer.innerHTML = ''; 

            categories.forEach(category => {
                const materialsForCategory = allMaterials.filter(m => m.categoria === category.id);
                if (filter !== 'todos' && filter !== category.id) { return; }

                const section = document.createElement('section');
                section.className = 'material-section';
                section.dataset.category = category.id;

                let gridContent = materialsForCategory.length > 0
                    ? materialsForCategory.map(createMaterialCard).join('')
                    : '<div class="empty-placeholder">Nenhum material nesta categoria.</div>';
                
                section.innerHTML = `
                    <h2><i class="fa-solid ${category.icon}"></i> ${category.name}</h2>
                    <div class="material-grid">${gridContent}</div>`;
                materialsContainer.appendChild(section);
            });

            // Inicializa os tooltips após os materiais serem renderizados
            initTooltips();

        } catch(error) {
            console.error("Erro ao renderizar materiais:", error);
            materialsContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
            showToast(error.message, 'error');
        }
    }

    function createMaterialCard(data) {
        const isExternalLink = data.link_externo && !data.caminho_arquivo;
        const accessLink = isExternalLink ? data.link_externo : data.caminho_arquivo;
        const downloadAttribute = !isExternalLink ? 'download' : '';
        const targetAttribute = isExternalLink ? 'target="_blank" rel="noopener noreferrer"' : '';
        const fileType = data.tipo_arquivo ? data.tipo_arquivo.split('/').pop().toUpperCase() : 'LINK';
        
        return `
            <article class="material-card" data-id="${data.id}" data-title="${data.titulo}">
                <div class="card-content">
                    <h3>${data.titulo}</h3>
                    <p>${data.descricao}</p>
                    <div class="file-info">
                        <span>${fileType}</span>
                        ${data.tamanho_arquivo ? `<span>${data.tamanho_arquivo}</span>` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-actions">
                        <button class="btn-icon btn-delete" data-tooltip="Apagar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <a href="${accessLink}" ${targetAttribute} ${downloadAttribute} class="btn btn-download">
                        <i class="fa-solid fa-download"></i> Baixar
                    </a>
                </div>
            </article>`;
    }

    // --- EVENT LISTENERS ---
    addMaterialBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    fileInput.addEventListener('change', () => {
        fileLabelText.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Clique para escolher um arquivo...';
    });

    materialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(materialForm);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao salvar o material.");
            }
            
            closeModal();
            renderMaterials(filterTabs.querySelector('.active').dataset.filter);
            showToast('Material salvo com sucesso!', 'success');
        } catch(error) {
            showToast(`Erro: ${error.message}`, 'error');
        }
    });

    materialsContainer.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (!deleteBtn) return;

        const card = e.target.closest('.material-card');
        const id = card.dataset.id;
        const title = card.dataset.title;
        
        const confirmed = await showConfirmationModal('Apagar Material', `Tem certeza que deseja apagar o material "${title}"?`);

        if (confirmed) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error("Falha ao apagar o material no servidor.");
                }
                card.remove();
                showToast('Material apagado com sucesso.', 'success');
            } catch (error) {
                showToast(`Erro: ${error.message}`, 'error');
            }
        }
    });

    filterTabs.addEventListener('click', e => {
        if (e.target.tagName !== 'A') return;
        e.preventDefault();
        filterTabs.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        renderMaterials(e.target.dataset.filter);
    });

    // --- INICIALIZAÇÃO ---
    renderMaterials();
});