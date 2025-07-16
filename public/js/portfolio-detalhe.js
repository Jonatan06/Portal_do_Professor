document.addEventListener('DOMContentLoaded', () => {
    // Registra o plugin do GSAP para animações de rolagem, se ele não tiver sido registrado
    if (window.gsap) {
        gsap.registerPlugin(ScrollTrigger);
    }

    const container = document.getElementById('project-detail-container');
    const projectId = new URLSearchParams(window.location.search).get('id');

    if (!container) {
        console.error('Container do projeto não encontrado!');
        return;
    }

    if (!projectId) {
        container.innerHTML = '<h1>Erro: ID do projeto não fornecido.</h1>';
        return;
    }

    const fetchProjectDetails = async () => {
        try {
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

        // >>> INÍCIO DA CORREÇÃO PARA A IMAGEM DE CAPA <<<
        const allSlides = [];

        // 1. Adiciona a imagem de capa como o primeiro slide, se ela existir.
        if (project.imagem_capa_url) {
            allSlides.push({
                caminho_arquivo: project.imagem_capa_url,
                alt_text: `Capa do projeto ${project.titulo}`
            });
        }

        // 2. Adiciona as outras mídias da galeria.
        if (project.midias && project.midias.length > 0) {
            project.midias.forEach(media => {
                allSlides.push({
                    caminho_arquivo: media.caminho_arquivo,
                    alt_text: `Mídia do projeto ${project.titulo}`
                });
            });
        }
        
        let slidesHTML = '';
        if (allSlides.length > 0) {
            slidesHTML = allSlides.map(slide => `
                <div class="swiper-slide">
                    <img src="${slide.caminho_arquivo}" alt="${slide.alt_text}" />
                </div>
            `).join('');
        } else {
            slidesHTML = `<div class="swiper-slide no-media"><i class="fas fa-image"></i><p>Este projeto ainda não possui mídias.</p></div>`;
        }
        // >>> FIM DA CORREÇÃO <<<
        
        const projectDescriptionHTML = project.descricao || '<p>Nenhuma descrição detalhada fornecida.</p>';

        const contentHTML = `
            <div class="project-title-header">
                <h1 class="project-title">${project.titulo}</h1>
                <div class="project-meta">
                    <span class="meta-tag">${project.categoria}</span>
                    <span class="meta-tag">${project.periodo}</span>
                    <span class="meta-tag status-${project.status === 'concluido' ? 'concluido' : 'andamento'}">${project.status}</span>
                </div>
            </div>

            <div class="swiper-container">
                <div class="swiper-wrapper">${slidesHTML}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>

            <div class="project-content">
                <div class="project-description">${projectDescriptionHTML}</div>
            </div>
        `;
        
        container.innerHTML = contentHTML;

        initSwiper(allSlides.length > 1);
        initAnimations();
        const mainImage = allSlides.length > 0 ? allSlides[0].caminho_arquivo : null;
        if(mainImage) initColorThief(mainImage);
    };

    const initSwiper = (loopingEnabled) => {
        new Swiper('.swiper-container', {
            loop: loopingEnabled,
            effect: 'fade',
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
        gsap.from(".project-title", { duration: 1, y: 30, opacity: 0, ease: 'power2.out' });
        gsap.from(".project-meta .meta-tag", { duration: 0.8, y: 20, opacity: 0, stagger: 0.15, delay: 0.3, ease: 'power2.out' });
        gsap.from(".swiper-container", { duration: 1.2, scale: 0.95, opacity: 0, delay: 0.5, ease: 'power3.out' });

        gsap.utils.toArray('.project-description h2, .project-description h3, .project-description h4').forEach(heading => {
            gsap.from(heading, {
                scrollTrigger: { trigger: heading, start: 'top 85%', toggleActions: 'play none none none' },
                duration: 0.8,
                opacity: 0,
                x: -50,
                ease: 'power3.out'
            });
        });

        gsap.utils.toArray('.project-description p, .project-description ul, .project-description ol').forEach(elem => {
            gsap.from(elem, {
                scrollTrigger: { trigger: elem, start: 'top 90%', toggleActions: 'play none none none' },
                duration: 1,
                opacity: 0,
                y: 50,
                ease: 'power3.out'
            });
        });

        gsap.utils.toArray('.project-description img').forEach(img => {
            gsap.from(img, {
                scrollTrigger: { trigger: img, start: 'top 85%', toggleActions: 'play none none none' },
                duration: 1.2,
                opacity: 0,
                scale: 0.8,
                ease: 'power3.out'
            });
        });
    };

    const initColorThief = (imageUrl) => {
        const firstImage = new Image();
        firstImage.crossOrigin = "Anonymous";
        firstImage.src = imageUrl;

        const colorThief = new ColorThief();

        const applyColor = () => {
            try {
                const dominantColor = colorThief.getColor(firstImage);
                const [r, g, b] = dominantColor;
                
                document.documentElement.style.setProperty('--project-color-main', `rgb(${r}, ${g}, ${b})`);
                document.documentElement.style.setProperty('--project-color-light', `rgba(${r}, ${g}, ${b}, 0.1)`);
            } catch(e) {
                console.error("Erro ao extrair cores:", e);
            }
        };

        if (firstImage.complete) {
            applyColor();
        } else {
            firstImage.addEventListener('load', applyColor);
        }
    };

    fetchProjectDetails();
});