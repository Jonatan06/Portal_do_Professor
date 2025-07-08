document.addEventListener('DOMContentLoaded', () => {
    console.log('login.js: Script carregado.');
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    
            document.getElementById('btn-voltar').addEventListener('click', () => {
            history.back();
        });

    if (!loginForm) {
        return console.error('login.js: ERRO - Formulário #login-form não encontrado no HTML.');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        console.log('login.js: Formulário submetido.');

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            console.log('login.js: A enviar requisição para o servidor...');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            console.log(`login.js: Resposta recebida do servidor com status ${response.status}`);
            const data = await response.json();

            if (!response.ok) {
                // Lança um erro com a mensagem que vem do servidor (ex: "Email ou senha inválidos.")
                throw new Error(data.message || 'Ocorreu um erro desconhecido.');
            }

            console.log('login.js: Login bem-sucedido! A redirecionar para o dashboard...');
            localStorage.setItem('authToken', data.token);
            window.location.href = '/admin/dashboard.html';

        } catch (error) {
            console.error('login.js: Ocorreu um erro na tentativa de login:', error);
            errorMessage.textContent = error.message;
        }
        
    });
});