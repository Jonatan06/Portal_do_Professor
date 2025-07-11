document.addEventListener('DOMContentLoaded', () => {
    const materialsContainer = document.getElementById('materials-container');
    const API_URL = '/api/materiais';

    if (!materialsContainer) return;

    const categories = {
        slides: { name: 'Slides de Aula', icon: 'fa-chalkboard-user' },
        apostilas: { name: 'Apostilas e Textos', icon: 'fa-book-open' },
        exercicios: { name: 'Exercícios e Atividades', icon: 'fa-file-lines' },
        videos: { name: 'Vídeos', icon: 'fa-video' },
        outros: { name: 'Outros', icon: 'fa-box-archive' },
    };

    const createMaterialCard = (data) => {
        const isExternalLink = data.link_externo && !data.caminho_arquivo;
        const accessLink = isExternalLink ? data.link_externo : data.caminho_arquivo;
        const downloadAttribute = !isExternalLink ? 'download' : '';
        const targetAttribute = isExternalLink ? 'target="_blank" rel="noopener noreferrer"' : '';
        const fileType = data.tipo_arquivo ? data.tipo_arquivo.split('/').pop().toUpperCase() : 'LINK';
        
        return `
            <div class="material-card" data-id="${data.id}">
                <h3>${data.titulo}</h3>
                <p>${data.descricao}</p>
                <div class="file-info">
                    <span>${fileType}</span>
                    ${data.tamanho_arquivo ? `<span>${data.tamanho_arquivo}</span>` : ''}
                </div>
                <a href="${accessLink}" ${targetAttribute} ${downloadAttribute} class="btn-download">
                    <i class="fas fa-download"></i> Acessar Material
                </a>
            </div>`;
    };

    const fetchAndRenderMaterials = async () => {
        materialsContainer.innerHTML = '<p>Carregando materiais...</p>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Não foi possível carregar os materiais.");
            const allMaterials = await response.json();

            materialsContainer.innerHTML = '';

            for (const catKey in categories) {
                const category = categories[catKey];
                const materialsForCategory = allMaterials.filter(m => m.categoria === catKey);

                if (materialsForCategory.length > 0) {
                    const gridContent = materialsForCategory.map(createMaterialCard).join('');
                    const sectionHTML = `
                        <section class="material-section">
                            <h2 class="material-section-title">
                                <i class="fa-solid ${category.icon}"></i> ${category.name}
                            </h2>
                            <div class="material-grid">${gridContent}</div>
                        </section>`;
                    materialsContainer.insertAdjacentHTML('beforeend', sectionHTML);
                }
            }

        } catch (error) {
            console.error("Erro ao renderizar materiais:", error);
            materialsContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    };

    fetchAndRenderMaterials();
});