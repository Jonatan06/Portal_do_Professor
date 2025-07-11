document.getElementById('btn-voltar').addEventListener('click', () => {
    history.back();
});

const formCadastro = document.getElementById('form-cadastro');

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('cadastro-nome').value;
    const email = document.getElementById('cadastro-email').value;
    const senha = document.getElementById('cadastro-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;

    if (senha !== confirmarSenha) {
        showToast('As senhas não coincidem.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/alunos/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, email, senha }),
        });

        const data = await response.json();

        if (data.success) {
            showToast('Cadastro realizado com sucesso! Redirecionando para o login...', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            throw new Error(data.message || 'Ocorreu um erro no cadastro.');
        }

    } catch (error) {
        console.error("Erro no cadastro:", error);
        showToast(error.message, 'error');
    }
});

// --- Lógica para Mostrar/Esconder Senha (Cadastro do Aluno) ---
const toggleCadastroSenha = document.getElementById('toggleCadastroSenha');
const cadastroSenhaInput = document.getElementById('cadastro-senha');

if (toggleCadastroSenha && cadastroSenhaInput) {
    cadastroSenhaInput.addEventListener('input', () => {
        toggleCadastroSenha.classList.toggle('show-password-toggle', cadastroSenhaInput.value.length > 0);
    });

    toggleCadastroSenha.addEventListener('click', function () {
        const type = cadastroSenhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        cadastroSenhaInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    if (cadastroSenhaInput.value.length > 0) {
        toggleCadastroSenha.classList.add('show-password-toggle');
    }
}

const toggleConfirmarSenha = document.getElementById('toggleConfirmarSenha');
const confirmarSenhaInput = document.getElementById('confirmar-senha');

if (toggleConfirmarSenha && confirmarSenhaInput) {
    confirmarSenhaInput.addEventListener('input', () => {
        toggleConfirmarSenha.classList.toggle('show-password-toggle', confirmarSenhaInput.value.length > 0);
    });

    toggleConfirmarSenha.addEventListener('click', function () {
        const type = confirmarSenhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmarSenhaInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    if (confirmarSenhaInput.value.length > 0) {
        toggleConfirmarSenha.classList.add('show-password-toggle');
    }
}

// --- Lógica para Força da Senha (Cadastro do Aluno) ---
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');

if (cadastroSenhaInput && strengthBar && strengthText) {
    cadastroSenhaInput.addEventListener('input', updatePasswordStrength);
}

function updatePasswordStrength() {
    const password = cadastroSenhaInput.value;
    let feedback = "Sua senha deve ter no mínimo 6 caracteres.";
    let barWidth = 0;
    let barClass = "";
    let textClass = "";

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password);

    if (password.length === 0) {
        feedback = "Sua senha deve ter no mínimo 6 caracteres.";
        barWidth = 0;
        barClass = "";
        textClass = "";
    } else if (password.length < 6) {
        feedback = "Muito curta. Mínimo 6 caracteres.";
        barWidth = 10;
        barClass = "strength-weak";
        textClass = "weak";
    } else {
        if (hasUppercase && hasLowercase && hasNumbers) {
            feedback = "Forte!";
            barWidth = 100;
            barClass = "strength-strong";
            textClass = "strong";
        } else if ((hasUppercase && hasLowercase) || (hasUppercase && hasNumbers) || (hasLowercase && hasNumbers)) {
            feedback = "Média. Tente misturar letras e números.";
            barWidth = 60;
            barClass = "strength-medium";
            textClass = "medium";
        } else {
            feedback = "Fraca. Adicione letras maiúsculas/minúsculas e números.";
            barWidth = 30;
            barClass = "strength-weak";
            textClass = "weak";
        }

        if (hasSymbols && password.length >= 8) {
            barWidth = Math.min(100, barWidth + 20);
            if (barClass === "strength-medium") {
                feedback = "Boa senha com símbolos!";
            } else if (barClass === "strength-strong") {
                feedback = "Excelente!";
            }
        }
    }
    
    strengthBar.style.width = `${barWidth}%`;
    strengthBar.className = `strength-bar ${barClass}`;

    strengthText.textContent = feedback;
    strengthText.className = `password-strength-text ${textClass}`;
}