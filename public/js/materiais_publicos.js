document.addEventListener('DOMContentLoaded', () => {
    const materialsContainer = document.getElementById('materials-container');
    const filterTabs = document.querySelector('.filter-tabs');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const API_URL = '/api/materiais';
    let allMaterials = [];

    if (!materialsContainer || !filterTabs || !searchInput || !sortSelect) return;

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
        const imageUrl = data.imagem_capa_url || 'https://images.unsplash.com/photo-1543286386-71314a49692f?w=800';
        const publicationDate = new Date(data.data_upload).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        // --- CORREÇÃO APLICADA AQUI ---
        const description = data.descricao || '';
        const summary = description.length > 120 ? description.substring(0, 120) + '...' : description;
        // --- FIM DA CORREÇÃO ---

        return `
            <div class="material-card" data-id="${data.id}">
                <div class="material-card-image" style="background-image: url('${imageUrl}')"></div>
                <div class="material-card-content">
                    <h3>${data.titulo}</h3>
                    <p>${summary}</p>
                    <div class="file-info">
                        <span>${fileType}</span>
                        ${data.tamanho_arquivo ? `<span>${data.tamanho_arquivo}</span>` : ''}
                    </div>
                    <div class="card-footer">
                        <span><i class="fas fa-calendar-alt"></i> ${publicationDate}</span>
                    </div>
                    <a href="${accessLink}" ${targetAttribute} ${downloadAttribute} class="btn-download">
                        <i class="fas fa-download"></i> Acessar Material
                    </a>
                </div>
            </div>`;
    };

    const renderFilteredMaterials = () => {
        const categoryFilter = filterTabs.querySelector('.active').dataset.filter;
        const searchTerm = searchInput.value.toLowerCase();
        const sortOrder = sortSelect.value;

        let filtered = allMaterials.filter(material => 
            material.titulo.toLowerCase().includes(searchTerm)
        );

        if (categoryFilter !== 'todos') {
            filtered = filtered.filter(material => material.categoria === categoryFilter);
        }
        
        filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'antigos':
                    return new Date(a.data_upload) - new Date(b.data_upload);
                case 'az':
                    return a.titulo.localeCompare(b.titulo);
                case 'za':
                    return b.titulo.localeCompare(a.titulo);
                case 'recentes':
                default:
                    return new Date(b.data_upload) - new Date(a.data_upload);
            }
        });

        const groupedByCategory = filtered.reduce((acc, material) => {
            const category = material.categoria;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(material);
            return acc;
        }, {});
        
        materialsContainer.innerHTML = '';
        if (filtered.length === 0) {
            materialsContainer.innerHTML = '<p>Nenhum material encontrado com os filtros selecionados.</p>';
            return;
        }

        Object.keys(categories).forEach(catKey => {
            if (groupedByCategory[catKey] && groupedByCategory[catKey].length > 0) {
                const categoryInfo = categories[catKey];
                const gridContent = groupedByCategory[catKey].map(createMaterialCard).join('');
                const sectionHTML = `
                    <section class="material-section">
                        <h2 class="material-section-title">
                            <i class="fa-solid ${categoryInfo.icon}"></i> ${categoryInfo.name}
                        </h2>
                        <div class="material-grid">${gridContent}</div>
                    </section>`;
                materialsContainer.insertAdjacentHTML('beforeend', sectionHTML);
            }
        });
    };

    const initialLoad = async () => {
        materialsContainer.innerHTML = '<p>Carregando materiais...</p>';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Não foi possível carregar os materiais.");
            allMaterials = await response.json();

            if (allMaterials.length === 0) {
                materialsContainer.innerHTML = '<p>Nenhum material publicado no momento.</p>';
            } else {
                renderFilteredMaterials();
            }
        } catch (error) {
            console.error("Erro ao renderizar materiais:", error);
            materialsContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
        }
    };

    filterTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            filterTabs.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            renderFilteredMaterials();
        }
    });

    searchInput.addEventListener('input', renderFilteredMaterials);
    sortSelect.addEventListener('change', renderFilteredMaterials);

    initialLoad();
});