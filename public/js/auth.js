// Este script gerencia o token e a proteção das páginas

// Pega o token do localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Remove o token para fazer logout e redireciona para o login
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/index.html'; // Garanta que este seja o nome da sua página de login
}

// Função para proteger uma página. Deve ser chamada no início de cada script de página protegida.
function protectPage() {
    const token = getToken();
    if (!token) {
        // Se não houver token, redireciona para a página de login
        window.location.href = '/index.html'; // Garanta que este seja o nome da sua página de login
    }
}

// Esta parte é uma "mágica" que intercepta TODAS as chamadas `fetch` do seu site
// e adiciona automaticamente o token de autenticação no cabeçalho.
const originalFetch = window.fetch;
window.fetch = function (url, options) {
    const token = getToken();
    
    // Clona as opções para evitar modificar o objeto original
    const newOptions = options ? { ...options } : {};

    // Garante que o cabeçalho exista
    newOptions.headers = newOptions.headers || {};
    
    if (token) {
        // Adiciona o token ao cabeçalho
        newOptions.headers['x-auth-token'] = token;
    }

    // Chama a função fetch original com as novas opções
    return originalFetch(url, newOptions);
};