document.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
    const loginForm = document.getElementById('login-form');
    
    document.getElementById('btn-voltar').addEventListener('click', () => {
        history.back();
    });

    if (!loginForm) {
        return;
=======
    console.log('login.js: Script carregado.');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    
            document.getElementById('btn-voltar').addEventListener('click', () => {
            history.back();
        });

    if (!loginForm) {
        return console.error('login.js: ERRO - Formulário #login-form não encontrado no HTML.');
>>>>>>> d0e4a8b664ad6bbef5d8022befabca3e29fbb11a
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
<<<<<<< HEAD
=======
        errorMessage.textContent = '';
        console.log('login.js: Formulário submetido.');
>>>>>>> d0e4a8b664ad6bbef5d8022befabca3e29fbb11a

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
<<<<<<< HEAD
=======
            console.log('login.js: A enviar requisição para o servidor...');
>>>>>>> d0e4a8b664ad6bbef5d8022befabca3e29fbb11a
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

<<<<<<< HEAD
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro desconhecido.');
            }

=======
            console.log(`login.js: Resposta recebida do servidor com status ${response.status}`);
            const data = await response.json();

            if (!response.ok) {
                // Lança um erro com a mensagem que vem do servidor (ex: "Email ou senha inválidos.")
                throw new Error(data.message || 'Ocorreu um erro desconhecido.');
            }

            console.log('login.js: Login bem-sucedido! A redirecionar para o dashboard...');
>>>>>>> d0e4a8b664ad6bbef5d8022befabca3e29fbb11a
            localStorage.setItem('authToken', data.token);
            window.location.href = '/admin/dashboard.html';

        } catch (error) {
<<<<<<< HEAD
            // SUBSTITUÍDO: alert(error.message) por showToast
            showToast(error.message, 'error');
        }
    });

=======
            console.error('login.js: Ocorreu um erro na tentativa de login:', error);
            errorMessage.textContent = error.message;
        }
        
    });

    // --- Lógica para Mostrar/Esconder Senha (Login do Professor) ---
>>>>>>> d0e4a8b664ad6bbef5d8022befabca3e29fbb11a
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('senha');

    if (togglePassword && passwordInput) {
<<<<<<< HEAD
        passwordInput.addEventListener('input', () => {
            togglePassword.classList.toggle('show-password-toggle', passwordInput.value.length > 0);
        });

=======
        // Evento para mostrar/esconder o ícone baseado na digitação
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length > 0) {
                togglePassword.classList.add('show-password-toggle');
            } else {
                togglePassword.classList.remove('show-password-toggle');
            }
        });

        // Evento para alternar a visibilidade da senha no clique
>>>>>>> d0e4a8b664ad6bbef5d8022befabca3e29fbb11a
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });

<<<<<<< HEAD
=======
        // Garante que o ícone esteja visível se o campo já tiver conteúdo ao carregar a página
>>>>>>> d0e4a8b664ad6bbef5d8022befabca3e29fbb11a
        if (passwordInput.value.length > 0) {
            togglePassword.classList.add('show-password-toggle');
        }
    }
});