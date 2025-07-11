document.addEventListener('DOMContentLoaded', () => {
    const portfolioContainer = document.getElementById('portfolio-container');
    const API_URL = '/api/projetos';

    if (!portfolioContainer) return;

    // Função para remover tags HTML e criar um resumo do texto
    const createSummary = (htmlContent, maxLength = 150) => {
        if (!htmlContent) return 'Clique para ver os detalhes do projeto.';
        // 1. Remove todas as tags HTML para ter um texto puro
        const plainText = htmlContent.replace(/<[^>]*>?/gm, ' ');
        // 2. Remove espaços extras e quebras de linha
        const cleanText = plainText.replace(/\s+/g, ' ').trim();
        // 3. Corta o texto no tamanho máximo e adiciona "..."
        if (cleanText.length > maxLength) {
            return cleanText.substring(0, maxLength) + '...';
        }
        return cleanText;
    };

    // Nova função para criar um "card" de projeto
    const createProjectHTML = (data) => {
        const summary = createSummary(data.descricao);
        const statusClass = data.status === 'concluido' ? 'status-concluido' : 'status-andamento';
        const statusText = data.status === 'concluido' ? 'Concluído' : 'Em Andamento';

        return `
            <a href="/portfolio-detalhe?id=${data.id}" class="project-card">
                <div class="project-card-header">
                    <h3 class="project-card-title">${data.titulo}</h3>
                    <span class="project-card-status ${statusClass}">${statusText}</span>
                </div>
                <p class="project-card-summary">${summary}</p>
                <div class="project-card-footer">
                    <span class="project-card-category">${data.categoria}</span>
                    <span class="project-card-period">${data.periodo}</span>
                </div>
            </a>
        `;
    };

    const fetchAndRenderProjects = async () => {
        portfolioContainer.innerHTML = '<p>Carregando projetos...</p>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar projetos.');
            const projetos = await response.json();

            if (projetos.length === 0) {
                portfolioContainer.innerHTML = `
                    <div class="empty-list-placeholder" style="border-style: solid; padding: 40px;">
                        <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>Nenhum projeto foi publicado no momento. Crie um no painel de administrador!</p>
                    </div>
                `;
                return;
            }

            const categories = {
                pesquisa: { title: 'Projetos de Pesquisa', icon: 'fa-flask', projects: [] },
                ensino: { title: 'Projetos de Ensino', icon: 'fa-chalkboard-teacher', projects: [] },
                extensao: { title: 'Projetos de Extensão', icon: 'fa-hands-helping', projects: [] }
            };

            projetos.forEach(p => {
                if (categories[p.categoria]) {
                    categories[p.categoria].projects.push(p);
                }
            });
            
            portfolioContainer.innerHTML = '';

            for (const catKey in categories) {
                const category = categories[catKey];
                if (category.projects.length > 0) {
                    const projectsHTML = category.projects.map(createProjectHTML).join('');
                    const sectionHTML = `
                        <section class="project-section">
                            <h2 class="project-section-title">
                                <i class="fas ${category.icon}"></i>
                                ${category.title}
                            </h2>
                            <div class="project-grid">${projectsHTML}</div>
                        </section>`;
                    portfolioContainer.insertAdjacentHTML('beforeend', sectionHTML);
                }
            }
        } catch (error) {
            console.error("Erro ao renderizar projetos:", error);
            portfolioContainer.innerHTML = `<p style="color: red;">Ocorreu um erro ao carregar os projetos.</p>`;
        }
    };

    fetchAndRenderProjects();
});