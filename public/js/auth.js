// public/js/auth.js (VERSÃO FINAL E ROBUSTA)

/**
 * Pega o token de autenticação do professor do localStorage.
 */
function getToken() {
    return localStorage.getItem('authToken');
}

/**
 * Protege uma página. Se não houver token, redireciona para o login.
 */
function protectPage() {
    if (!getToken()) {
        // A função showToast deve existir no seu /js/toast.js
        if (typeof showToast === 'function') {
            showToast("Acesso negado. Por favor, faça o login.", 'error');
        }
        setTimeout(() => {
            window.location.href = '/admin/index.html';
        }, 1500);
    }
}

/**
 * Intercepta TODAS as chamadas `fetch` para adicionar o token de autenticação.
 */
const originalFetch = window.fetch;
window.fetch = function (url, options) {
    const token = getToken();
    const newOptions = { ...options };
    newOptions.headers = newOptions.headers || {};
    if (token && url.startsWith('/api/')) {
        newOptions.headers['x-auth-token'] = token;
    }
    return originalFetch(url, newOptions).catch(error => {
        console.error('Fetch Error:', error);
        if (typeof showToast === 'function') {
            showToast('Erro de conexão com o servidor.', 'error');
        }
        return Promise.reject(error);
    });
};


/**
 * LÓGICA DO MODAL DE LOGOUT E INICIALIZAÇÃO DA PÁGINA
 * Roda depois que todo o HTML da página foi carregado.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Encontra os elementos essenciais na página atual.
    const logoutButton = document.getElementById('logout-button');
    const logoutModal = document.getElementById('confirm-logout-modal');

    // 2. VERIFICAÇÃO DE SEGURANÇA: Só continua se o botão e o modal existirem.
    if (logoutButton && logoutModal) {

        const closeModalBtn = logoutModal.querySelector('.modal-close-btn');
        const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
        const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

        // LÓGICA PARA MOSTRAR O MODAL
        logoutButton.addEventListener('click', (event) => {
            // **A CORREÇÃO CRÍTICA ESTÁ AQUI**
            // Impede a ação padrão (como navegar para '#')
            event.preventDefault(); 
            // Impede que outros scripts que escutam este mesmo clique sejam acionados.
            event.stopPropagation(); 

            logoutModal.classList.remove('hidden');
        });

        // LÓGICA PARA ESCONDER O MODAL
        const hideModal = () => {
            logoutModal.classList.add('hidden');
        };

        closeModalBtn.addEventListener('click', hideModal);
        cancelLogoutBtn.addEventListener('click', hideModal);

        // LÓGICA DE CONFIRMAÇÃO DO LOGOUT
        // A ação de sair só existe aqui dentro.
        confirmLogoutBtn.addEventListener('click', () => {
            console.log("Logout confirmado. Redirecionando...");
            
            // Lógica de logout
            localStorage.removeItem('authToken');
            localStorage.removeItem('professorLogado');
            window.location.href = '/admin/index.html';
        });
    }
});