// /public/js/tooltip.js

function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(el => {
        // Previne a adição de múltiplos listeners se a função for chamada mais de uma vez
        if (el.dataset.tooltipInitialized) return;
        el.dataset.tooltipInitialized = 'true';

        let tooltipInstance = null;

        el.addEventListener('mouseenter', () => {
            const tooltipText = el.getAttribute('data-tooltip');
            if (!tooltipText) return;

            // Cria o elemento do tooltip
            tooltipInstance = document.createElement('div');
            tooltipInstance.className = 'tooltip';
            tooltipInstance.textContent = tooltipText;
            document.body.appendChild(tooltipInstance);

            // Posiciona o tooltip
            const elRect = el.getBoundingClientRect();
            const tooltipRect = tooltipInstance.getBoundingClientRect();

            let top = elRect.top + window.scrollY - tooltipRect.height - 10; // 10px de espaço
            let left = elRect.left + window.scrollX + (elRect.width / 2) - (tooltipRect.width / 2);

            // Ajusta se sair da tela
            if (left < 0) left = 5;
            if (top < 0) top = elRect.bottom + window.scrollY + 10;

            tooltipInstance.style.left = `${left}px`;
            tooltipInstance.style.top = `${top}px`;
            
            // Adiciona a classe para exibir com animação
            setTimeout(() => {
                if(tooltipInstance) tooltipInstance.classList.add('show');
            }, 10);
        });

        el.addEventListener('mouseleave', () => {
            if (tooltipInstance) {
                tooltipInstance.classList.remove('show');
                // Remove o elemento do DOM após a animação de saída
                tooltipInstance.addEventListener('transitionend', () => {
                    tooltipInstance.remove();
                    tooltipInstance = null;
                });
            }
        });
    });
}

// Inicializa os tooltips quando a página carregar
document.addEventListener('DOMContentLoaded', initTooltips);