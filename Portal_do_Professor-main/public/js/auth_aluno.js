/**
 * =================================================================
 * FUNÇÃO GLOBAL - Deve ficar fora do 'DOMContentLoaded'
 * =================================================================
 * Esta função busca os dados do aluno logado a partir do localStorage.
 * Por estar no escopo global, ela fica acessível para outros scripts,
 * como 'contato_publico.js' e 'post_detalhe.js'.
 */
function getAlunoLogado() {
    const alunoLogadoData = localStorage.getItem('alunoLogado');
    if (!alunoLogadoData) {
        return null;
    }
    try {
        // Tenta converter a string guardada em um objeto JSON
        return JSON.parse(alunoLogadoData);
    } catch (error) {
        console.error("Erro ao processar dados do aluno do localStorage:", error);
        // Se os dados estiverem corrompidos, limpa o localStorage para evitar erros futuros
        localStorage.removeItem('alunoAuthToken');
        localStorage.removeItem('alunoLogado');
        return null;
    }
}


/**
 * =================================================================
 * LÓGICA DE EXECUÇÃO DA PÁGINA - Fica dentro do 'DOMContentLoaded'
 * =================================================================
 * Este código só roda depois que o HTML da página foi completamente carregado.
 * Ele é responsável por manipular o cabeçalho (mostrar nome, botão de sair, etc.).
 */
document.addEventListener('DOMContentLoaded', () => {
    // Usa a função global que definimos acima para obter os dados do aluno
    const aluno = getAlunoLogado();
    const alunoToken = localStorage.getItem('alunoAuthToken');
    
    // Seleciona o menu de navegação
    const nav = document.querySelector('.main-nav');

    // Verifica se os dados do aluno e o token existem e se a navegação foi encontrada
    if (aluno && alunoToken && nav) {
        // 1. Adiciona a classe ao body para ocultar o botão do professor via CSS
        document.body.classList.add('aluno-logado');

        // 2. Remove o botão de "Login do Aluno"
        const btnLoginAluno = nav.querySelector('a[href="/login"]');
        if (btnLoginAluno) {
            btnLoginAluno.remove();
        }

        // Pega o primeiro nome do aluno
        const primeiroNome = aluno.nome ? aluno.nome.split(' ')[0] : 'Aluno';

        // 3. Cria e adiciona a mensagem de boas-vindas
        const welcomeElement = document.createElement('span');
        welcomeElement.className = 'nav-welcome';
        welcomeElement.textContent = `Olá, ${primeiroNome}!`;
        welcomeElement.style.color = 'var(--cor-texto-principal)';
        
        // 4. Cria e adiciona o link de "Sair"
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Sair';
        logoutLink.style.marginLeft = '15px';
        logoutLink.style.cursor = 'pointer';
        logoutLink.className = 'btn-login'; // Usa o mesmo estilo dos outros botões
        
        // Adiciona o evento de clique para o logout
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Limpa os dados de autenticação do aluno do localStorage
            localStorage.removeItem('alunoAuthToken');
            localStorage.removeItem('alunoLogado');
            
            // Recarrega a página para refletir o estado de "não logado"
            window.location.reload(); 
        });

        // Adiciona os novos elementos à barra de navegação
        nav.appendChild(welcomeElement);
        nav.appendChild(logoutLink);
    }
});