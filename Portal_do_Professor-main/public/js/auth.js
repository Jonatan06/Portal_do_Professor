// public/js/auth.js (PARA O PAINEL DO PROFESSOR)

// Pega o token do localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Remove o token para fazer logout e redireciona para o login do admin
function logout() {
    localStorage.removeItem('authToken');
    // IMPORTANTE: Mude 'index.html' para a sua página de login do PROFESSOR se for diferente
    window.location.href = '/admin/login.html'; 
}

// Função para proteger uma página. Deve ser chamada no início de cada script de página protegida.
function protectPage() {
    const token = getToken();
    if (!token) {
        // Se não houver token, redireciona para a página de login do professor
        alert("Acesso negado. Por favor, faça o login.");
        window.location.href = '/admin/login.html'; // Mude se o nome da sua página for outro
    }
}

// Esta parte intercepta TODAS as chamadas `fetch` do seu painel de admin
// e adiciona automaticamente o token de autenticação no cabeçalho.
// Isso é essencial para que suas requisições à API sejam autorizadas.
const originalFetch = window.fetch;
window.fetch = function (url, options) {
    const token = getToken();
    
    const newOptions = options ? { ...options } : {};
    newOptions.headers = newOptions.headers || {};
    
    // Adiciona o token ao cabeçalho para todas as requisições da API
    if (token && url.startsWith('/api/')) {
        newOptions.headers['x-auth-token'] = token; // Ou 'Authorization': `Bearer ${token}`
    }

    return originalFetch(url, newOptions);
};