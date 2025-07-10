function getAlunoToken() {
    return localStorage.getItem('alunoAuthToken');
}

// Pega o objeto com os dados do aluno (para UI).
function getAlunoLogado() {
    try {
        return JSON.parse(localStorage.getItem('alunoLogado'));
    } catch (e) {
        localStorage.removeItem('alunoLogado');
        return null;
    }
}

const originalFetch = window.fetch;
window.fetch = function (url, options) {
    const token = getAlunoToken();
    const newOptions = options ? { ...options } : {};
    newOptions.headers = newOptions.headers || {};
    if (token && url.startsWith('/api/')) {
        newOptions.headers['x-auth-token'] = token;
    }
    return originalFetch(url, newOptions); 
};

document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.main-nav');
    const alunoLogado = getAlunoLogado(); // Usa a função abaixo

    if (alunoLogado && nav) {
        // Encontra o link de login do aluno para substituí-lo
        const loginLink = nav.querySelector('a[href="/login"]'); // Corrigido para /login.html
        
        if (loginLink) {
            // Remove o link de login
            loginLink.remove();

            // Cria o texto de boas-vindas
            const welcomeText = document.createElement('span');
            welcomeText.className = 'nav-welcome';
            welcomeText.textContent = `Olá, ${alunoLogado.nome.split(' ')[0]}!`; // Mostra só o primeiro nome

            // Cria o link de logout
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.textContent = 'Sair';
            logoutLink.className = 'btn-logout';
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('alunoLogado');
                localStorage.removeItem('alunoAuthToken'); // <-- CORREÇÃO APLICADA
                alert('Você foi desconectado.');
                window.location.href = '/';
            });

            // Adiciona os novos elementos ao menu
            nav.appendChild(welcomeText);
            nav.appendChild(logoutLink);
        }
    }
});