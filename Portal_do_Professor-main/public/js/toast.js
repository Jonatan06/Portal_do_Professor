/* /public/js/toast.js */

function showToast(message, type = 'info') {
    // Garante que o container existe
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-solid fa-circle-check',
        error: 'fa-solid fa-circle-xmark',
        info: 'fa-solid fa-circle-info'
    };

    const titles = {
        success: 'Sucesso!',
        error: 'Erro!',
        info: 'Aviso'
    };

    toast.innerHTML = `
        <i class="toast-icon ${icons[type]}"></i>
        <div class="toast-content">
            <h4>${titles[type]}</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Adiciona a classe 'show' para iniciar a animação de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 100); // Pequeno delay para garantir a transição

    // Evento para fechar o toast ao clicar no 'x'
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    // Remove o toast automaticamente após 5 segundos
    setTimeout(() => {
        removeToast(toast);
    }, 5000);
}

function removeToast(toast) {
    toast.classList.remove('show');
    // Espera a animação de saída terminar antes de remover o elemento do DOM
    toast.addEventListener('transitionend', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}