document.addEventListener('DOMContentLoaded', () => {
    // Protege a página para exigir login
    protectPage();

    // --- ELEMENTOS DO DOM ---
    const editButton = document.getElementById('edit-sobre-btn');
    const formacaoView = document.getElementById('formacao-view');
    const formacaoEdit = document.querySelector('#formacao .edit-content');
    const interessesView = document.getElementById('interesses-view');
    const interessesEdit = document.querySelector('#interesses .edit-content');

    let isEditMode = false;
    let originalSobreData = {};

    // --- INICIALIZAÇÃO DO EDITOR DE TEXTO ---
    tinymce.init({
        selector: '#formacao-editor, #interesses-editor',
        plugins: 'lists link code',
        toolbar: 'undo redo | bold italic | bullist numlist | link | code',
        height: 250,
        menubar: false,
    });

    // --- FUNÇÕES ---

    // Lógica para alternar entre modo de edição e visualização
    const toggleEditMode = () => {
        isEditMode = !isEditMode;

        if (isEditMode) {
            // Entrando no modo de edição
            formacaoView.style.display = 'none';
            formacaoEdit.style.display = 'block';
            tinymce.get('formacao-editor').setContent(originalSobreData.formacao || '');

            interessesView.style.display = 'none';
            interessesEdit.style.display = 'block';
            tinymce.get('interesses-editor').setContent(originalSobreData.interesses || '');

            editButton.innerHTML = `<i class="fa-solid fa-save"></i> Salvar Alterações`;
            editButton.classList.add('btn-success');

        } else {
            // Saindo do modo de edição
            formacaoView.style.display = 'block';
            formacaoEdit.style.display = 'none';

            interessesView.style.display = 'block';
            interessesEdit.style.display = 'none';

            editButton.innerHTML = `<i class="fas fa-pencil-alt"></i> Editar Sobre`;
            editButton.classList.remove('btn-success');
        }
    };

    // Lógica para salvar os dados
    const saveSobreContent = async () => {
        const dataToSave = {
            formacao: tinymce.get('formacao-editor').getContent(),
            interesses: tinymce.get('interesses-editor').getContent()
        };

        try {
            const response = await fetch('/api/sobre', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                throw new Error('Falha ao salvar o conteúdo.');
            }
            
            showToast('Conteúdo salvo com sucesso!', 'success');
            await loadSobreData(); // Recarrega os dados para a visualização
            toggleEditMode(); // Volta para o modo de visualização

        } catch (error) {
            console.error("Erro ao salvar:", error);
            showToast(error.message, 'error');
        }
    };


    // Carrega informações do perfil (nome, foto, bio)
    async function loadProfileData() {
        try {
            const response = await fetch('/api/profile');
            if (!response.ok) throw new Error('Falha ao buscar perfil.');
            const profile = await response.json();
            
            document.getElementById('profile-photo-sobre').src = profile.imagem_url || '/uploads/images/default-avatar.png';
            document.getElementById('profile-name-sobre').textContent = profile.nome || 'Nome do Professor';
            document.getElementById('profile-title-sobre').textContent = profile.cargo || '';
            document.getElementById('profile-bio-sobre').innerHTML = profile.biografia || 'Bem-vindo ao meu espaço digital.';
        } catch (error) {
            console.error('Erro ao carregar dados do perfil:', error);
        }
    }

    // Carrega o conteúdo das seções "Formação" e "Interesses"
    async function loadSobreData() {
        try {
            const response = await fetch('/api/sobre');
            if (!response.ok) throw new Error('Falha ao carregar conteúdo da página Sobre.');
            const data = await response.json();
            
            originalSobreData = data; // Armazena os dados originais

            formacaoView.innerHTML = data.formacao || '<p>Nenhuma informação de formação cadastrada.</p>';
            interessesView.innerHTML = data.interesses || '<p>Nenhuma área de interesse cadastrada.</p>';
        } catch (error) {
            console.error(error);
            formacaoView.innerHTML = `<p style="color:red;">${error.message}</p>`;
            interessesView.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    }

    // Carrega os projetos e os distribui nas seções corretas
    async function loadProjects() {
        try {
            const response = await fetch('/api/projetos');
            if (!response.ok) throw new Error('Falha ao buscar projetos.');
            const projetos = await response.json();

            const sections = {
                pesquisa: document.getElementById('pesquisa'),
                ensino: document.getElementById('ensino'),
                extensao: document.getElementById('extensao'),
            };
            
            // Limpa o conteúdo anterior antes de adicionar o novo
            Object.values(sections).forEach(section => {
                // Remove todos os filhos exceto o H2
                while(section.children.length > 1) {
                    section.removeChild(section.lastChild);
                }
            });

            projetos.forEach(projeto => {
                const container = sections[projeto.categoria];
                if (container) {
                    // --- ALTERAÇÃO APLICADA AQUI ---
                    // Remove a exibição do status e da descrição
                    const projectHTML = `
                        <div class="info-block">
                            <h3>${projeto.titulo} (${projeto.periodo})</h3>
                        </div>`;
                    container.insertAdjacentHTML('beforeend', projectHTML);
                }
            });

        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
        }
    }


    // --- LÓGICA PARA SCROLL SUAVE ---
    const navLinks = document.querySelectorAll('.profile-nav-summary a');
    const scrollContainer = document.querySelector('.main-content-wrapper');

    if (navLinks.length > 0 && scrollContainer) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const headerOffset = 30; 
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + scrollContainer.scrollTop - headerOffset;

                    scrollContainer.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // --- EVENT LISTENER PARA O BOTÃO EDITAR/SALVAR ---
    editButton.addEventListener('click', () => {
        if (isEditMode) {
            saveSobreContent();
        } else {
            toggleEditMode();
        }
    });


    // --- INICIALIZAÇÃO ---
    loadProfileData();
    loadSobreData();
    loadProjects();
});