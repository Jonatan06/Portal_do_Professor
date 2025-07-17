// // public/js/auth.js (PARA O PAINEL DO PROFESSOR)

// /**
//  * Pega o token de autenticação do professor do localStorage.
//  */
// function getToken() {
//     return localStorage.getItem('authToken');
// }

// /**
//  * Remove os dados de login do professor e redireciona para a página de login.
//  */
// function logout() {
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('professorLogado'); // Limpa também os dados do professor
//     window.location.href = '/admin/index.html'; // Redireciona para a página de login correta
// }

// /**
//  * Protege uma página. Se não houver token, redireciona para o login.
//  * Deve ser chamada no início de cada script de página protegida.
//  */
// function protectPage() {
//     const token = getToken();
//     if (!token) {
//         // Usa o showToast em vez do alert nativo
//         showToast("Acesso negado. Por favor, faça o login.", 'error');
//         setTimeout(() => {
//             window.location.href = '/admin/index.html';
//         }, 1500);
//     }
// }

// /**
//  * Intercepta TODAS as chamadas `fetch` do painel de admin
//  * e adiciona automaticamente o token de autenticação no cabeçalho.
//  * Isso é essencial para que suas requisições à API sejam autorizadas.
//  */
// const originalFetch = window.fetch;
// window.fetch = function (url, options) {
//     const token = getToken();
    
//     const newOptions = options ? { ...options } : {};
//     newOptions.headers = newOptions.headers || {};
    
//     // Adiciona o token ao cabeçalho para todas as requisições da API do painel
//     if (token && url.startsWith('/api/')) {
//         newOptions.headers['x-auth-token'] = token;
//     }

//     return originalFetch(url, newOptions).catch(error => {
//         console.error('Fetch Error:', error);
//         showToast('Erro de conexão com o servidor.', 'error');
//         return Promise.reject(error);
//     });
// };

function getToken() {
    return localStorage.getItem('authToken');
}

/**
 * Remove os dados de login do professor e redireciona para a página de login.
 * Esta função agora é chamada pelo modal de confirmação.
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('professorLogado'); // Limpa também os dados do professor
    window.location.href = '/admin/index.html'; // Redireciona para a página de login correta
}

/**
 * Protege uma página. Se não houver token, redireciona para o login.
 */
function protectPage() {
    const token = getToken();
    if (!token) {
        showToast("Acesso negado. Por favor, faça o login.", 'error');
        setTimeout(() => {
            window.location.href = '/admin/index.html';
        }, 1500);
    }
}

/**
 * Intercepta TODAS as chamadas `fetch` do painel de admin
 * e adiciona automaticamente o token de autenticação no cabeçalho.
 */
const originalFetch = window.fetch;
window.fetch = function (url, options) {
    const token = getToken();
    
    const newOptions = options ? { ...options } : {};
    newOptions.headers = newOptions.headers || {};
    
    if (token && url.startsWith('/api/')) {
        newOptions.headers['x-auth-token'] = token;
    }

    return originalFetch(url, newOptions).catch(error => {
        console.error('Fetch Error:', error);
        showToast('Erro de conexão com o servidor.', 'error');
        return Promise.reject(error);
    });
};

/**
 * =================================================================
 * LÓGICA DO MODAL DE LOGOUT (NOVA LÓGICA)
 * =================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // Procura o botão de logout em qualquer página do painel
    const logoutButton = document.getElementById('logout-button');
    
    // Procura os elementos do modal que adicionamos no HTML
    const modal = document.getElementById('confirm-logout-modal');
    const cancelButton = document.getElementById('cancel-logout-btn');
    const confirmButton = document.getElementById('confirm-logout-btn');
    const closeBtn = modal ? modal.querySelector('.modal-close-btn') : null;

    // Se não encontrar o modal na página, não faz nada.
    if (!modal || !logoutButton) {
        return;
    }

    // Função para abrir o modal com animação
    const openModal = () => {
        modal.classList.add('active');
    };

    // Função para fechar o modal com animação
    const closeModal = () => {
        modal.classList.remove('active');
    };

    // Adiciona o evento de clique ao botão principal de "Sair"
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault(); // Impede o link de navegar
        openModal();        // Abre o modal de confirmação
    });

    // Eventos dos botões do modal
    if (confirmButton) {
        // Se clicar em "Sim, Sair", chama a função de logout
        confirmButton.addEventListener('click', logout);
    }

    if (cancelButton) cancelButton.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    // Fecha o modal se o usuário clicar fora da caixa de diálogo
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
});