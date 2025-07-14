document.addEventListener('DOMContentLoaded', () => {
    // Registra o plugin do GSAP para animações de rolagem
    gsap.registerPlugin(ScrollTrigger);

    const container = document.getElementById('project-detail-container');
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        container.innerHTML = '<h1>Erro: ID do projeto não fornecido.</h1>';
        return;
    }

    const fetchProjectDetails = async () => {
        try {
            // Usa a nova rota da API para pegar o projeto e suas mídias
            const response = await fetch(`/api/projetos/${projectId}/detalhes`);
            if (!response.ok) throw new Error('Projeto não encontrado');
            const project = await response.json();
            
            renderProject(project);
            
        } catch (error) {
            console.error('Erro ao buscar detalhes do projeto:', error);
            container.innerHTML = '<h1>Projeto não encontrado.</h1>';
        }
    };

    const renderProject = (project) => {
        document.title = `${project.titulo} - Portfólio`;

        // Gera os slides para a galeria Swiper
        let slidesHTML = '';
        if (project.midias && project.midias.length > 0) {
            slidesHTML = project.midias.map(media => `
                <div class="swiper-slide">
                    <img src="${media.caminho_arquivo}" alt="Mídia do projeto ${project.titulo}" />
                </div>
            `).join('');
        } else {
            slidesHTML = `<div class="swiper-slide no-media"><i class="fas fa-image"></i><p>Este projeto ainda não possui mídias.</p></div>`;
        }
        
        // === CORREÇÃO IMPORTANTE AQUI ===
        // Agora, injetamos o HTML da descrição diretamente, sem modificá-lo.
        const projectDescriptionHTML = project.descricao || '<p>Nenhuma descrição detalhada fornecida.</p>';

        const contentHTML = `
            <div class="project-title-header">
                <h1 class="project-title">${project.titulo}</h1>
                <div class="project-meta">
                    <span class="meta-tag">${project.categoria}</span>
                    <span class="meta-tag">${project.periodo}</span>
                    <span class="meta-tag status-${project.status}">${project.status}</span>
                </div>
            </div>

            <div class="swiper-container">
                <div class="swiper">
                    <div class="swiper-wrapper">${slidesHTML}</div>
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>
            </div>

            <div class="project-content">
                <div class="project-description">${projectDescriptionHTML}</div>
            </div>
        `;
        
        container.innerHTML = contentHTML;

        // Após o conteúdo estar na página, inicializamos as bibliotecas
        initSwiper();
        initAnimations();
        initColorThief();
    };

    const initSwiper = () => {
        new Swiper('.swiper', {
            loop: true,
            effect: 'fade', // Efeito de transição suave
            fadeEffect: {
                crossFade: true
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    };

    const initAnimations = () => {
        // Animação de entrada para o cabeçalho
        gsap.from(".project-title", { duration: 1, y: 30, opacity: 0, ease: 'power2.out' });
        gsap.from(".project-meta .meta-tag", { duration: 0.8, y: 20, opacity: 0, stagger: 0.15, delay: 0.3, ease: 'power2.out' });
        gsap.from(".swiper-container", { duration: 1.2, scale: 0.95, opacity: 0, delay: 0.5, ease: 'power3.out' });

        // --- ANIMAÇÕES DE SCROLL PARA O CONTEÚDO RICO ---

        // Animação para todos os títulos (h2, h3, etc.) dentro da descrição
        gsap.utils.toArray('.project-description h2, .project-description h3, .project-description h4').forEach(heading => {
            gsap.from(heading, {
                scrollTrigger: { trigger: heading, start: 'top 85%', toggleActions: 'play none none none' },
                duration: 0.8,
                opacity: 0,
                x: -50, // Animação "slide-in" da esquerda
                ease: 'power3.out'
            });
        });

        // Animação para todos os parágrafos e listas
        gsap.utils.toArray('.project-description p, .project-description ul, .project-description ol').forEach(elem => {
            gsap.from(elem, {
                scrollTrigger: { trigger: elem, start: 'top 90%', toggleActions: 'play none none none' },
                duration: 1,
                opacity: 0,
                y: 50, // Animação "fade-in-up"
                ease: 'power3.out'
            });
        });

        // Animação para todas as imagens inseridas no corpo do texto
        gsap.utils.toArray('.project-description img').forEach(img => {
            gsap.from(img, {
                scrollTrigger: { trigger: img, start: 'top 85%', toggleActions: 'play none none none' },
                duration: 1.2,
                opacity: 0,
                scale: 0.8, // Animação "scale-in"
                ease: 'power3.out'
            });
        });
    };

    const initColorThief = () => {
        const firstImage = document.querySelector('.swiper-slide:not(.no-media) img');
        if (!firstImage) return;

        const colorThief = new ColorThief();

        const applyColor = () => {
            const dominantColor = colorThief.getColor(firstImage);
            const [r, g, b] = dominantColor;
            
            document.documentElement.style.setProperty('--project-color-main', `rgb(${r}, ${g}, ${b})`);
            document.documentElement.style.setProperty('--project-color-light', `rgba(${r}, ${g}, ${b}, 0.1)`);
        };

        if (firstImage.complete) {
            applyColor();
        } else {
            firstImage.addEventListener('load', applyColor);
        }
    };

    fetchProjectDetails();
});