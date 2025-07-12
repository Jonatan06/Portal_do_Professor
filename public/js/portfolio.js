document.addEventListener('DOMContentLoaded', () => {
    protectPage(); // Garante que o professor esteja logado
    const API_URL = '/api/projetos';

    // --- ELEMENTOS DO DOM ---
    const addProjectBtn = document.querySelector('.btn-add-project');
    const modal = document.getElementById('project-modal');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const projectForm = document.getElementById('project-form');
    const modalTitle = document.getElementById('modal-title');
    const projectsContainer = document.getElementById('project-sections-container');
    
    const coverImageInput = document.getElementById('project-cover-image');
    const coverImagePreview = document.getElementById('cover-image-preview');

    FilePond.registerPlugin(FilePondPluginImagePreview);
    const inputElement = document.querySelector('#project-photos');
    const pond = FilePond.create(inputElement, {
        labelIdle: `Arraste e solte as fotos ou <span class="filepond--label-action">Procure</span>`,
        allowMultiple: true,
        acceptedFileTypes: ['image/*'],
        storeAsFile: true,
    });

    tinymce.init({
        selector: 'textarea#project-description',
        plugins: 'lists link image media table code help wordcount',
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image media | code',
        height: 350,
        menubar: false,
    });

    // --- FUNÇÕES DO MODAL ---
    const openModalForAdd = () => {
        projectForm.reset();
        pond.removeFiles();
        tinymce.get('project-description').setContent('');
        modalTitle.textContent = 'Adicionar Novo Projeto';
        coverImagePreview.style.display = 'none';
        coverImagePreview.src = '#';

        const existingIdField = document.getElementById('project-id');
        if (existingIdField) existingIdField.remove();
        modal.classList.remove('hidden');
    };

    const openModalForEdit = async (project) => {
        projectForm.reset();
        pond.removeFiles();
        modalTitle.textContent = 'Editar Projeto';

        try {
            const response = await fetch(`${API_URL}/${project.id}/detalhes`);
            if (!response.ok) throw new Error('Não foi possível carregar os detalhes do projeto para edição.');
            const projectDetails = await response.json();

            const existingIdField = document.getElementById('project-id');
            if (existingIdField) existingIdField.remove();

            const idField = document.createElement('input');
            idField.type = 'hidden';
            idField.id = 'project-id';
            idField.name = 'id';
            idField.value = projectDetails.id;
            projectForm.prepend(idField);

            document.getElementById('project-title').value = projectDetails.titulo;
            document.getElementById('project-category').value = projectDetails.categoria;
            document.getElementById('project-status').value = projectDetails.status;
            document.getElementById('project-tags').value = projectDetails.tags || '';
            document.getElementById('project-period').value = projectDetails.periodo;
            document.getElementById('project-link').value = projectDetails.link_externo || '';
            tinymce.get('project-description').setContent(projectDetails.descricao || '');

            if (projectDetails.imagem_capa_url) {
                coverImagePreview.src = projectDetails.imagem_capa_url;
                coverImagePreview.style.display = 'block';
            } else {
                coverImagePreview.style.display = 'none';
                coverImagePreview.src = '#';
            }

            modal.classList.remove('hidden');
        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        }
    };
    
    const closeModal = () => modal.classList.add('hidden');

    const showConfirmationModal = (title, text) => {
        return new Promise((resolve) => {
            const confirmModal = document.getElementById('confirmation-modal');
            const modalTitle = confirmModal.querySelector('.modal-title');
            const modalText = confirmModal.querySelector('#modal-text');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            modalTitle.textContent = title;
            modalText.textContent = text;
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

    // --- RENDERIZAÇÃO E LÓGICA DA API ---
    // ATUALIZADO: Nova estrutura HTML para o card
    function createProjectHTML(data) {
        const statusClass = data.status === 'concluido' ? 'status-concluido' : 'status-andamento';
        const categoryText = data.categoria.charAt(0).toUpperCase() + data.categoria.slice(1);
        const statusText = `${categoryText} ${data.status === 'concluido' ? 'Concluído' : 'Em Andamento'}`;
        const tagsArray = typeof data.tags === 'string' ? data.tags.split(',').filter(tag => tag.trim() !== '') : [];
        const tagsHTML = tagsArray.map(tag => `<span>${tag.trim()}</span>`).join('');
        const linkHTML = data.link_externo ? `<a href="${data.link_externo}" target="_blank" rel="noopener noreferrer" data-tooltip="Ver link externo"><i class="fa-solid fa-external-link-alt"></i></a>` : '';
        const detailLink = `<a href="/portfolio-detalhe?id=${data.id}" target="_blank" data-tooltip="Ver página do projeto"><i class="fa-solid fa-eye"></i></a>`;
        const cleanDescription = (data.descricao || '').replace(/<[^>]*>?/gm, ' ');
        
        const imageUrl = data.imagem_capa_url || '/uploads/images/default-image.png';

        return `
            <article class="project-item" data-id="${data.id}" data-title="${data.titulo}">
                <img src="${imageUrl}" alt="Capa do projeto ${data.titulo}" class="project-item-cover-image">
                <div class="project-details">
                    <div class="project-actions">
                        ${detailLink}
                        <button class="btn-icon btn-edit" data-tooltip="Editar"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-icon btn-delete" data-tooltip="Apagar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <h3>${data.titulo}</h3>
                    <p>${cleanDescription.substring(0, 150)}...</p>
                    <div class="tags">${tagsHTML}</div>
                    <div class="meta-info">
                        <span><i class="fa-solid fa-calendar-alt"></i> ${data.periodo}</span>
                        ${linkHTML}
                    </div>
                </div>
            </article>`;
    }
    
    async function fetchAndRenderProjects() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar projetos.');
            const projetos = await response.json();
            projectsContainer.innerHTML = '';
            const categories = { pesquisa: { title: 'Projetos de Pesquisa', icon: 'fa-flask', projects: [] }, ensino: { title: 'Projetos de Ensino', icon: 'fa-chalkboard-teacher', projects: [] }, extensao: { title: 'Projetos de Extensão', icon: 'fa-hands-helping', projects: [] } };
            projetos.forEach(p => { if (categories[p.categoria]) { categories[p.categoria].projects.push(p); } });
            for (const catKey in categories) {
                const category = categories[catKey];
                const sectionHTML = `<section class="project-section" id="${catKey}"><h2><i class="fa-solid ${category.icon}"></i> ${category.title}</h2><div class="project-list">${category.projects.length > 0 ? category.projects.map(createProjectHTML).join('') : '<p class="empty-list-placeholder">Nenhum projeto nesta categoria ainda.</p>'}</div></section>`;
                projectsContainer.insertAdjacentHTML('beforeend', sectionHTML);
            }
            initTooltips();
        } catch (error) {
            console.error("Erro ao renderizar projetos:", error);
            showToast(error.message, 'error');
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('project-id')?.value;
        const url = id ? `${API_URL}/${id}` : API_URL;
        const isEditing = !!id;

        const formData = new FormData();
        formData.append('titulo', document.getElementById('project-title').value);
        formData.append('descricao', tinymce.get('project-description').getContent());
        formData.append('categoria', document.getElementById('project-category').value);
        formData.append('status', document.getElementById('project-status').value);
        formData.append('tags', document.getElementById('project-tags').value);
        formData.append('periodo', document.getElementById('project-period').value);
        formData.append('link_externo', document.getElementById('project-link').value);

        if (coverImageInput.files[0]) {
            formData.append('imagem_capa', coverImageInput.files[0]);
        }

        pond.getFiles().forEach(fileItem => {
            formData.append('fotos', fileItem.file);
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                closeModal();
                fetchAndRenderProjects();
                showToast(`Projeto ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            } else {
                const err = await response.json();
                throw new Error(err.message || 'Falha ao salvar projeto');
            }
        } catch (error) {
            console.error("Erro ao submeter formulário:", error);
            showToast(error.message, 'error');
        }
    }
    
    async function handleContainerClick(e) {
        const targetElement = e.target;
        const editBtn = targetElement.closest('.btn-edit');
        const deleteBtn = targetElement.closest('.btn-delete');
    
        if (editBtn) {
            const projectItem = targetElement.closest('.project-item');
            const project = { id: projectItem.dataset.id };
            openModalForEdit(project);
            return;
        }
    
        if (deleteBtn) {
            const projectItem = targetElement.closest('.project-item');
            const id = projectItem.dataset.id;
            const title = projectItem.dataset.title;

            const confirmed = await showConfirmationModal('Apagar Projeto', `Tem certeza de que quer apagar o projeto "${title}"?`);

            if (confirmed) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        fetchAndRenderProjects();
                        showToast('Projeto apagado com sucesso.', 'success');
                    } else {
                        const err = await response.json();
                        throw new Error(err.message || 'Falha ao apagar o projeto.');
                    }
                } catch (error) { 
                    console.error(error);
                    showToast(error.message, 'error');
                }
            }
        }
    }

    // --- EVENT LISTENERS ---
    addProjectBtn.addEventListener('click', openModalForAdd);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    projectForm.addEventListener('submit', handleFormSubmit);
    projectsContainer.addEventListener('click', handleContainerClick);

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

    // --- INICIALIZAÇÃO ---
    fetchAndRenderProjects();
});