/**
 * =================================================================
 * FUNÇÃO GLOBAL
 * =================================================================
 */
function getAlunoLogado() {
    const alunoLogadoData = localStorage.getItem('alunoLogado');
    if (!alunoLogadoData) {
        return null;
    }
    try {
        return JSON.parse(alunoLogadoData);
    } catch (error) {
        console.error("Erro ao processar dados do aluno do localStorage:", error);
        localStorage.removeItem('alunoAuthToken');
        localStorage.removeItem('alunoLogado');
        return null;
    }
}

/**
 * =================================================================
 * LÓGICA DE EXECUÇÃO DA PÁGINA
 * =================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DO MODAL DE LOGOUT ---
    const modal = document.getElementById('confirm-logout-modal');
    const cancelButton = document.getElementById('cancel-logout-btn');
    const confirmButton = document.getElementById('confirm-logout-btn');
    const closeBtn = modal ? modal.querySelector('.modal-close-btn') : null;

    const openModal = () => {
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        }
    };

    const closeModal = () => {
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };

    // Evento para o botão de confirmação (que efetivamente faz o logout)
    if (confirmButton) {
        confirmButton.addEventListener('click', () => {
            localStorage.removeItem('alunoAuthToken');
            localStorage.removeItem('alunoLogado');
            // Redirecionar para a página inicial é geralmente melhor que recarregar
            window.location.href = '/'; 
        });
    }

    // Eventos para fechar o modal
    if (cancelButton) cancelButton.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    // --- LÓGICA DE AUTENTICAÇÃO DO ALUNO (SEU CÓDIGO ORIGINAL MODIFICADO) ---
    const aluno = getAlunoLogado();
    const alunoToken = localStorage.getItem('alunoAuthToken');
    const nav = document.querySelector('.main-nav');

    if (aluno && alunoToken && nav) {
        document.body.classList.add('aluno-logado');

        const btnLoginAluno = nav.querySelector('a[href="/login"]');
        if (btnLoginAluno) {
            btnLoginAluno.remove();
        }

        const primeiroNome = aluno.nome ? aluno.nome.split(' ')[0] : 'Aluno';

        const welcomeElement = document.createElement('span');
        welcomeElement.className = 'nav-welcome';
        welcomeElement.textContent = `Olá, ${primeiroNome}!`;
        welcomeElement.style.color = 'var(--cor-texto-principal)';
        
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Sair';
        logoutLink.style.marginLeft = '15px';
        logoutLink.style.cursor = 'pointer';
        logoutLink.className = 'btn-login';
        
        // MODIFICAÇÃO PRINCIPAL: O botão "Sair" agora abre o modal
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(); // <-- A mágica acontece aqui!
        });

        nav.appendChild(welcomeElement);
        nav.appendChild(logoutLink);
    }
});