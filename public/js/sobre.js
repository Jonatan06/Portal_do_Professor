document.addEventListener('DOMContentLoaded', () => {
    // Protege a página para exigir login
    protectPage();

    // --- LÓGICA PARA CARREGAR DADOS DINÂMICOS ---

    // Carrega informações do perfil (nome, foto, bio)
    async function loadProfileData() {
        try {
            const response = await fetch('/api/profile');
            if (!response.ok) throw new Error('Falha ao buscar perfil.');
            const profile = await response.json();
            
            document.getElementById('profile-photo-sobre').src = profile.imagem_url || '/uploads/images/default-avatar.png';
            document.getElementById('profile-name-sobre').textContent = profile.nome || 'Nome do Professor';
            document.getElementById('profile-title-sobre').textContent = profile.cargo || '';
            document.getElementById('profile-bio-sobre').textContent = profile.biografia || 'Bem-vindo ao meu espaço digital.';
        } catch (error) {
            console.error('Erro ao carregar dados do perfil:', error);
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

            projetos.forEach(projeto => {
                const container = sections[projeto.categoria];
                if (container) {
                    const projectHTML = `
                        <div class="info-block">
                            <h3>${projeto.titulo} (${projeto.periodo})</h3>
                            <h4>Status: ${projeto.status === 'concluido' ? 'Concluído' : 'Em Andamento'}</h4>
                            <p>${projeto.descricao}</p>
                        </div>`;
                    container.insertAdjacentHTML('beforeend', projectHTML);
                }
            });

        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
        }
    }


    // --- LÓGICA PARA SCROLL SUAVE (JÁ EXISTENTE) ---
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

    // --- INICIALIZAÇÃO ---
    loadProfileData();
    loadProjects();
});