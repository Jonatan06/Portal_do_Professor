// public/js/auth.js (PARA O PAINEL DO PROFESSOR)

/**
 * Pega o token de autenticação do professor do localStorage.
 */
function getToken() {
    return localStorage.getItem('authToken');
}

/**
 * Remove os dados de login do professor e redireciona para a página de login.
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('professorLogado'); // Limpa também os dados do professor
    window.location.href = '/admin/index.html'; // Redireciona para a página de login correta
}

/**
 * Protege uma página. Se não houver token, redireciona para o login.
 * Deve ser chamada no início de cada script de página protegida.
 */
function protectPage() {
    const token = getToken();
    if (!token) {
        // Usa o showToast em vez do alert nativo
        showToast("Acesso negado. Por favor, faça o login.", 'error');
        setTimeout(() => {
            window.location.href = '/admin/index.html';
        }, 1500);
    }
}

/**
 * Intercepta TODAS as chamadas `fetch` do painel de admin
 * e adiciona automaticamente o token de autenticação no cabeçalho.
 * Isso é essencial para que suas requisições à API sejam autorizadas.
 */
const originalFetch = window.fetch;
window.fetch = function (url, options) {
    const token = getToken();
    
    const newOptions = options ? { ...options } : {};
    newOptions.headers = newOptions.headers || {};
    
    // Adiciona o token ao cabeçalho para todas as requisições da API do painel
    if (token && url.startsWith('/api/')) {
        newOptions.headers['x-auth-token'] = token;
    }

    return originalFetch(url, newOptions).catch(error => {
        console.error('Fetch Error:', error);
        showToast('Erro de conexão com o servidor.', 'error');
        return Promise.reject(error);
    });
};