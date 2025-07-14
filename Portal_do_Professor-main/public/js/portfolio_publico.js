document.addEventListener('DOMContentLoaded', () => {
    const portfolioContainer = document.getElementById('portfolio-container');
    const filterTabs = document.querySelector('.filter-tabs');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const API_URL = '/api/projetos';
    let allProjects = [];

    if (!portfolioContainer || !filterTabs || !searchInput || !sortSelect) return;

    const categories = {
        pesquisa: { title: 'Projetos de Pesquisa', icon: 'fa-flask' },
        ensino: { title: 'Projetos de Ensino', icon: 'fa-chalkboard-teacher' },
        extensao: { title: 'Projetos de Extensão', icon: 'fa-hands-helping' }
    };

    const createSummary = (htmlContent, maxLength = 150) => {
        if (!htmlContent) return 'Clique para ver os detalhes do projeto.';
        const plainText = htmlContent.replace(/<[^>]*>?/gm, ' ');
        const cleanText = plainText.replace(/\s+/g, ' ').trim();
        if (cleanText.length > maxLength) {
            return cleanText.substring(0, maxLength) + '...';
        }
        return cleanText;
    };

    const createProjectHTML = (data) => {
        const summary = createSummary(data.descricao);
        const statusClass = data.status === 'concluido' ? 'status-concluido' : 'status-andamento';
        const statusText = data.status === 'concluido' ? 'Concluído' : 'Em Andamento';
        const imageUrl = data.imagem_capa_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800';

        return `
            <a href="/portfolio-detalhe?id=${data.id}" class="project-card">
                <div class="project-card-image" style="background-image: url('${imageUrl}')"></div>
                <div class="project-card-content">
                    <div class="project-card-header">
                        <h3 class="project-card-title">${data.titulo}</h3>
                        <span class="project-card-status ${statusClass}">${statusText}</span>
                    </div>
                    <p class="project-card-summary">${summary}</p>
                    <div class="project-card-footer">
                        <span class="project-card-category">${data.categoria}</span>
                        <span class="project-card-period">${data.periodo}</span>
                    </div>
                </div>
            </a>
        `;
    };
    
    // Função principal que aplica todos os filtros e renderiza
    const renderFilteredProjects = () => {
        const categoryFilter = filterTabs.querySelector('.active').dataset.filter;
        const searchTerm = searchInput.value.toLowerCase();
        const sortOrder = sortSelect.value;

        // 1. Filtra por busca
        let filtered = allProjects.filter(project => 
            project.titulo.toLowerCase().includes(searchTerm)
        );

        // 2. Filtra por categoria
        if (categoryFilter !== 'todos') {
            filtered = filtered.filter(project => project.categoria === categoryFilter);
        }

        // 3. Ordena
        filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'antigos':
                    return new Date(a.data_criacao) - new Date(b.data_criacao);
                case 'az':
                    return a.titulo.localeCompare(b.titulo);
                case 'za':
                    return b.titulo.localeCompare(a.titulo);
                case 'recentes':
                default:
                    return new Date(b.data_criacao) - new Date(a.data_criacao);
            }
        });

        // 4. Agrupa por categoria para renderização
        const groupedByCategory = filtered.reduce((acc, project) => {
            const category = project.categoria;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(project);
            return acc;
        }, {});
        
        // 5. Renderiza na tela
        portfolioContainer.innerHTML = '';
        if (filtered.length === 0) {
            portfolioContainer.innerHTML = '<p>Nenhum projeto encontrado com os filtros selecionados.</p>';
            return;
        }

        Object.keys(groupedByCategory).forEach(catKey => {
            const categoryInfo = categories[catKey];
            const projectsForCategory = groupedByCategory[catKey];
            if (categoryInfo && projectsForCategory.length > 0) {
                const projectsHTML = projectsForCategory.map(createProjectHTML).join('');
                const sectionHTML = `
                    <section class="project-section">
                        <h2 class="project-section-title">
                            <i class="fas ${categoryInfo.icon}"></i>
                            ${categoryInfo.title}
                        </h2>
                        <div class="project-grid">${projectsHTML}</div>
                    </section>`;
                portfolioContainer.insertAdjacentHTML('beforeend', sectionHTML);
            }
        });
    };

    // Carga inicial dos dados
    const initialLoad = async () => {
        portfolioContainer.innerHTML = '<p>Carregando projetos...</p>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar projetos.');
            allProjects = await response.json();
            
            if (allProjects.length === 0) {
                portfolioContainer.innerHTML = '<p>Nenhum projeto publicado no momento.</p>';
            } else {
                renderFilteredProjects();
            }
        } catch (error) {
            console.error("Erro ao renderizar projetos:", error);
            portfolioContainer.innerHTML = `<p style="color: red;">Ocorreu um erro ao carregar os projetos.</p>`;
        }
    };
    
    // Adiciona os event listeners
    filterTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            filterTabs.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            renderFilteredProjects();
        }
    });

    searchInput.addEventListener('input', renderFilteredProjects);
    sortSelect.addEventListener('change', renderFilteredProjects);

    initialLoad();
});