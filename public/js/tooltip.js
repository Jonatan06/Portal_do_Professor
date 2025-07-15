// /public/js/tooltip.js

function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(el => {
        // Se o tooltip já foi inicializado para este elemento, não faz nada
        if (el.dataset.tooltipInitialized) return;
        el.dataset.tooltipInitialized = 'true';

        let tooltipInstance = null;

        el.addEventListener('mouseenter', () => {
            const tooltipText = el.getAttribute('data-tooltip');
            if (!tooltipText) return;

            tooltipInstance = document.createElement('div');
            tooltipInstance.className = 'tooltip';
            tooltipInstance.textContent = tooltipText;
            document.body.appendChild(tooltipInstance);

            const elRect = el.getBoundingClientRect();
            const tooltipRect = tooltipInstance.getBoundingClientRect();

            // Posiciona o tooltip acima do elemento
            let top = elRect.top + window.scrollY - tooltipRect.height - 10;
            let left = elRect.left + window.scrollX + (elRect.width / 2) - (tooltipRect.width / 2);

            // Garante que não saia da tela
            if (left < 5) left = 5;
            if (top < 5) top = elRect.bottom + window.scrollY + 10;
            if ((left + tooltipRect.width) > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - 5;
            }

            tooltipInstance.style.left = `${left}px`;
            tooltipInstance.style.top = `${top}px`;
            
            // Adiciona a classe para mostrar o tooltip com um pequeno delay
            setTimeout(() => {
                if(tooltipInstance) tooltipInstance.classList.add('show');
            }, 10);
        });

        el.addEventListener('mouseleave', () => {
            if (tooltipInstance) {
                tooltipInstance.classList.remove('show');
                // Espera a animação de saída terminar antes de remover o elemento
                tooltipInstance.addEventListener('transitionend', () => {
                    if (tooltipInstance && tooltipInstance.parentElement) {
                        tooltipInstance.remove();
                    }
                    tooltipInstance = null;
                });
            }
        });
    });
}

// Garante que a função de tooltips do painel de admin continue funcionando
function initCustomTooltips() {
    document.querySelectorAll('[data-custom-tooltip]').forEach(el => {
        if (el.dataset.customTooltipInitialized) return;
        el.dataset.customTooltipInitialized = 'true';

        let tooltipInstance = null;

        const showTooltip = () => {
            const content = el.getAttribute('data-tooltip-content');
            const color = el.getAttribute('data-tooltip-color');
            if (!content || !content.trim()) return;

            tooltipInstance = document.createElement('div');
            tooltipInstance.className = 'tooltip custom-tooltip';
            
            const lines = content.split('\n');
            const title = lines.shift(); 
            const bodyContent = lines.map(line => `<p>${line}</p>`).join('');

            tooltipInstance.innerHTML = `
                <div class="custom-tooltip-header" style="background-color: ${color};"></div>
                <div class="custom-tooltip-body">
                    <h4>${title}</h4>
                    ${bodyContent}
                </div>
            `;
            
            document.body.appendChild(tooltipInstance);

            const elRect = el.getBoundingClientRect();
            const tooltipRect = tooltipInstance.getBoundingClientRect();
            
            let top = elRect.top + window.scrollY + (elRect.height / 2) - (tooltipRect.height / 2);
            let left = elRect.right + window.scrollX + 10;
            
            if (left + tooltipRect.width > window.innerWidth) {
               left = elRect.left + window.scrollX - tooltipRect.width - 10;
            }
            
            tooltipInstance.style.left = `${left}px`;
            tooltipInstance.style.top = `${top}px`;

            setTimeout(() => {
                if(tooltipInstance) tooltipInstance.classList.add('show');
            }, 10);
        };

        const hideTooltip = () => {
            if (tooltipInstance) {
                tooltipInstance.classList.remove('show');
                tooltipInstance.addEventListener('transitionend', () => {
                     if (tooltipInstance && tooltipInstance.parentElement) {
                        tooltipInstance.remove();
                    }
                    tooltipInstance = null;
                });
            }
        };
        
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
    });
}


// Executa a função na carga inicial da página
document.addEventListener('DOMContentLoaded', initTooltips);