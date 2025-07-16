document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    const btnVoltar = document.getElementById('btn-voltar');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            history.back();
        });
    }

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro desconhecido.');
            }

            // ==========================================================
            // ||           **INÍCIO DA CORREÇÃO PRINCIPAL** ||
            // ==========================================================

            // Salva o token E os dados do professor que vêm da API
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('professorLogado', JSON.stringify(data.professor));

            // ==========================================================
            // ||             **FIM DA CORREÇÃO PRINCIPAL** ||
            // ==========================================================

            window.location.href = '/admin/dashboard.html';

        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('senha');

    if (togglePassword && passwordInput) {
        passwordInput.addEventListener('input', () => {
            togglePassword.classList.toggle('show-password-toggle', passwordInput.value.length > 0);
        });

        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });

        if (passwordInput.value.length > 0) {
            togglePassword.classList.add('show-password-toggle');
        }
    }
});