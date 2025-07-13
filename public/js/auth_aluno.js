document.addEventListener('DOMContentLoaded', () => {
    // Busca os dados do aluno e o token do localStorage
    const alunoLogadoData = localStorage.getItem('alunoLogado');
    const alunoToken = localStorage.getItem('alunoAuthToken');
    
    // Seleciona o menu de navegação
    const nav = document.querySelector('.main-nav');

    // Verifica se os dados do aluno e o token existem e se a navegação foi encontrada
    if (alunoLogadoData && alunoToken && nav) {
        try {
            // 1. Adiciona a classe ao body para ocultar o botão do professor via CSS
            document.body.classList.add('aluno-logado');

            // Converte a string JSON dos dados do aluno em um objeto
            const aluno = JSON.parse(alunoLogadoData);

            // 2. Remove o botão de "Login do Aluno"
            const btnLoginAluno = nav.querySelector('a[href="/login"]');
            if (btnLoginAluno) {
                btnLoginAluno.remove();
            }

            // --- LINHA MODIFICADA ---
            // Pega o nome completo, divide pelo espaço e pega apenas o primeiro item (o primeiro nome)
            const primeiroNome = aluno.nome ? aluno.nome.split(' ')[0] : 'Aluno';

            // 3. Cria e adiciona a mensagem de boas-vindas
            const welcomeElement = document.createElement('span');
            welcomeElement.className = 'nav-welcome';
            // Usa a variável 'primeiroNome' que acabamos de criar
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
                e.preventDefault(); // Impede a navegação padrão do link
                
                // Limpa os dados de autenticação do aluno do localStorage
                localStorage.removeItem('alunoAuthToken');
                localStorage.removeItem('alunoLogado');
                
                // Recarrega a página para refletir o estado de "não logado"
                window.location.reload(); 
            });

            // Adiciona os novos elementos à barra de navegação
            nav.appendChild(welcomeElement);
            nav.appendChild(logoutLink);

        } catch (error) {
            console.error('Erro ao processar dados do aluno logado:', error);
            // Em caso de erro (ex: JSON inválido), limpa os dados para evitar problemas
            localStorage.removeItem('alunoAuthToken');
            localStorage.removeItem('alunoLogado');
        }
    }
});