document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('public-contact-form');
    const loginPrompt = document.getElementById('contact-login-prompt');

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

    // --- LÓGICA DE AUTENTICAÇÃO (Isolada nesta página) ---
    const alunoData = localStorage.getItem('alunoLogado');
    let aluno = null;
    if (alunoData) {
        try {
            aluno = JSON.parse(alunoData);
        } catch (e) {
            console.error("Erro ao ler dados do aluno:", e);
        }
    }

    if (aluno) {
        nameInput.value = aluno.nome;
        emailInput.value = aluno.email;
        nameInput.readOnly = true;
        emailInput.readOnly = true;
    }

    // Evento que verifica o e-mail quando o usuário clica fora do campo.
    if (emailInput) {
        emailInput.addEventListener('blur', async () => {
            // Só faz a verificação se o usuário NÃO estiver logado.
            if (!aluno) {
                const email = emailInput.value.trim();
                if (email) { // Só verifica se o campo não estiver vazio
                    try {
                        const response = await fetch('/api/alunos/check-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                        });
                        const data = await response.json();
                        if (data.exists) {
                            showToast('Este e-mail já pertence a uma conta. Faça o login para continuar.', 'info');
                        }
                    } catch (error) {
                        console.error('Falha ao verificar e-mail via blur:', error);
                    }
                }
            }
        });
    }

    // --- LÓGICA DE ENVIO DO FORMULÁRIO ---
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // 1. Pega o token de autenticação do aluno do localStorage
            const token = localStorage.getItem('alunoAuthToken');

            const nome = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const assunto = document.getElementById('subject').value;
            const corpo = document.getElementById('message').value;

            try {
                const response = await fetch('/api/mensagens', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-auth-token': token 
                    },
                    body: JSON.stringify({ nome, email, assunto, corpo })
                });

                const data = await response.json();

                if (!response.ok) {
                    const toastType = response.status === 409 ? 'info' : 'error';
                    showToast(data.message || "Ocorreu um erro desconhecido.", toastType);
                    return;
                }

                // Sucesso!
                showToast('Mensagem enviada com sucesso!', 'success');
                document.getElementById('subject').value = '';
                document.getElementById('message').value = '';
                // Se o usuário não estava logado, limpa nome e email também
                if(!aluno) {
                    document.getElementById('name').value = '';
                    document.getElementById('email').value = '';
                }

            } catch (error) {
                showToast(error.message, 'error');
                console.error("Erro no fetch do formulário:", error);
            }
        });
    }
});