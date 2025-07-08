// public/js/auth.js (VERSÃO CORRIGIDA E LIMPA)

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
                alert('Você foi desconectado.');
                window.location.href = '/'; // Volta para a home
            });

            // Adiciona os novos elementos ao menu
            nav.appendChild(welcomeText);
            nav.appendChild(logoutLink);
        }
    }
});

function getAlunoLogado() {
    try {
        return JSON.parse(localStorage.getItem('alunoLogado'));
    } catch (e) {
        // Se houver erro ao parsear, remove o item inválido
        localStorage.removeItem('alunoLogado');
        return null;
    }
}