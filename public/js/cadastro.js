document.getElementById('btn-voltar').addEventListener('click', () => {
            history.back();
        });

        const formCadastro = document.getElementById('form-cadastro');
        const errorMessage = document.getElementById('error-message');

        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('cadastro-nome').value;
            const email = document.getElementById('cadastro-email').value;
            const senha = document.getElementById('cadastro-senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;

            errorMessage.textContent = '';

            if (senha !== confirmarSenha) {
                errorMessage.textContent = 'As senhas não coincidem.';
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
                    alert('Cadastro realizado com sucesso! Agora você pode fazer login.');
                    window.location.href = '/login';
                } else {
                    errorMessage.textContent = data.message || 'Ocorreu um erro no cadastro.';
                }

            } catch (error) {
                console.error("Erro no cadastro:", error);
                errorMessage.textContent = 'Erro de conexão. Tente novamente.';
            }
        });

        // --- Lógica para Mostrar/Esconder Senha (Cadastro do Aluno) ---
        const toggleCadastroSenha = document.getElementById('toggleCadastroSenha');
        const cadastroSenhaInput = document.getElementById('cadastro-senha');

        if (toggleCadastroSenha && cadastroSenhaInput) {
            // Evento para mostrar/esconder o ícone baseado na digitação
            cadastroSenhaInput.addEventListener('input', () => {
                if (cadastroSenhaInput.value.length > 0) {
                    toggleCadastroSenha.classList.add('show-password-toggle');
                } else {
                    toggleCadastroSenha.classList.remove('show-password-toggle');
                }
            });

            // Evento para alternar a visibilidade da senha no clique
            toggleCadastroSenha.addEventListener('click', function () {
                const type = cadastroSenhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
                cadastroSenhaInput.setAttribute('type', type);
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });

            // Garante que o ícone esteja visível se o campo já tiver conteúdo ao carregar a página
            if (cadastroSenhaInput.value.length > 0) {
                toggleCadastroSenha.classList.add('show-password-toggle');
            }
        }

        const toggleConfirmarSenha = document.getElementById('toggleConfirmarSenha');
        const confirmarSenhaInput = document.getElementById('confirmar-senha');

        if (toggleConfirmarSenha && confirmarSenhaInput) {
            // Evento para mostrar/esconder o ícone baseado na digitação
            confirmarSenhaInput.addEventListener('input', () => {
                if (confirmarSenhaInput.value.length > 0) {
                    toggleConfirmarSenha.classList.add('show-password-toggle');
                } else {
                    toggleConfirmarSenha.classList.remove('show-password-toggle');
                }
            });

            // Evento para alternar a visibilidade da senha no clique
            toggleConfirmarSenha.addEventListener('click', function () {
                const type = confirmarSenhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmarSenhaInput.setAttribute('type', type);
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            });

            // Garante que o ícone esteja visível se o campo já tiver conteúdo ao carregar a página
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
                // Senha com 6+ caracteres
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

                // Bônus por símbolos e comprimento extra
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