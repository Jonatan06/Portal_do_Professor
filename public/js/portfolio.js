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
    
    // --- INICIALIZAÇÃO DAS BIBLIOTECAS ---
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

            modal.classList.remove('hidden');
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };
    
    const closeModal = () => modal.classList.add('hidden');

    // --- RENDERIZAÇÃO E LÓGICA DA API ---
    function createProjectHTML(data) {
        const statusClass = data.status === 'concluido' ? 'status-concluido' : 'status-andamento';
        const categoryText = data.categoria.charAt(0).toUpperCase() + data.categoria.slice(1);
        const statusText = `${categoryText} ${data.status === 'concluido' ? 'Concluído' : 'Em Andamento'}`;
        const tagsArray = typeof data.tags === 'string' ? data.tags.split(',').filter(tag => tag.trim() !== '') : [];
        const tagsHTML = tagsArray.map(tag => `<span>${tag.trim()}</span>`).join('');
        const linkHTML = data.link_externo ? `<a href="${data.link_externo}" target="_blank" rel="noopener noreferrer" title="Ver link externo"><i class="fa-solid fa-external-link-alt"></i></a>` : '';
        const detailLink = `<a href="/portfolio-detalhe?id=${data.id}" target="_blank" title="Ver página do projeto"><i class="fa-solid fa-eye"></i></a>`;

        const cleanDescription = (data.descricao || '').replace(/<[^>]*>?/gm, ' ');

        return `
            <article class="project-item" data-id="${data.id}">
                <div class="timeline"><div class="dot"></div></div>
                <div class="project-details">
                    <div class="project-actions">
                        ${detailLink}
                        <button class="btn-icon btn-edit" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-icon btn-delete" title="Apagar"><i class="fa-solid fa-trash"></i></button>
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
        } catch (error) {
            console.error("Erro ao renderizar projetos:", error);
            projectsContainer.innerHTML = `<p style="text-align:center; color: #dc3545;">Ocorreu um erro ao carregar os projetos. Tente novamente mais tarde.</p>`;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('project-id')?.value;
        const url = id ? `${API_URL}/${id}` : API_URL; // Define a URL correta para criar ou editar

        const formData = new FormData();
        formData.append('titulo', document.getElementById('project-title').value);
        const descricaoConteudo = tinymce.get('project-description').getContent();
        formData.append('descricao', descricaoConteudo);
        formData.append('categoria', document.getElementById('project-category').value);
        formData.append('status', document.getElementById('project-status').value);
        formData.append('tags', document.getElementById('project-tags').value);
        formData.append('periodo', document.getElementById('project-period').value);
        formData.append('link_externo', document.getElementById('project-link').value);

        pond.getFiles().forEach(fileItem => {
            formData.append('fotos', fileItem.file);
        });

        try {
            const response = await fetch(url, {
                method: 'POST', // Usamos POST tanto para criar quanto para atualizar
                body: formData,
            });

            if (response.ok) {
                closeModal();
                fetchAndRenderProjects();
            } else {
                const err = await response.json();
                alert(`Falha ao salvar projeto: ${err.message}`);
            }
        } catch (error) {
            console.error("Erro ao submeter formulário:", error);
            alert("Ocorreu um erro de comunicação ao salvar o projeto.");
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
        }
    
        if (deleteBtn) {
            const projectItem = targetElement.closest('.project-item');
            const id = projectItem.dataset.id;
            if (confirm('Tem a certeza de que quer apagar este projeto?')) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        fetchAndRenderProjects();
                    } else {
                        alert('Falha ao apagar o projeto.');
                    }
                } catch (error) { console.error(error); }
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

    // --- INICIALIZAÇÃO ---
    fetchAndRenderProjects();
});