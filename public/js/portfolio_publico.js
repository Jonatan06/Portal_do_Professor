document.addEventListener('DOMContentLoaded', () => {
    const portfolioContainer = document.getElementById('portfolio-container');
    const API_URL = '/api/projetos';

    if (!portfolioContainer) return;

    const categories = {
        pesquisa: { title: 'Projetos de Pesquisa', icon: 'fa-flask', projects: [] },
        ensino: { title: 'Projetos de Ensino', icon: 'fa-chalkboard-teacher', projects: [] },
        extensao: { title: 'Projetos de Extensão', icon: 'fa-hands-helping', projects: [] }
    };

    const createProjectHTML = (data) => {
        const statusClass = data.status === 'concluido' ? 'status-concluido' : 'status-andamento';
        const statusText = data.status === 'concluido' ? 'Concluído' : 'Em Andamento';
        const tagsArray = data.tags ? data.tags.split(',').filter(tag => tag.trim() !== '') : [];
        const tagsHTML = tagsArray.map(tag => `<span>${tag.trim()}</span>`).join('');
        const linkHTML = data.link_externo ? `<div class="project-link"><a href="${data.link_externo}" target="_blank" rel="noopener noreferrer">Ver Mais</a></div>` : '';

        return `
            <div class="project-item">
                <div class="project-header">
                    <h3 class="project-title">${data.titulo}</h3>
                    <span class="project-status ${statusClass}">${statusText}</span>
                </div>
                <p class="project-description">${data.descricao}</p>
                <div class="project-footer">
                    <div class="project-tags">${tagsHTML}</div>
                    ${linkHTML}
                </div>
            </div>`;
    };

    const fetchAndRenderProjects = async () => {
        portfolioContainer.innerHTML = '<p>Carregando projetos...</p>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar projetos.');
            const projetos = await response.json();

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
                            <div class="project-list">${projectsHTML}</div>
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