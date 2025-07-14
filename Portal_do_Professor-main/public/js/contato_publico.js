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
        // Aluno está logado: mostra o formulário e preenche os dados
        loginPrompt.classList.add('hidden');
        contactForm.classList.remove('hidden');
        nameInput.value = aluno.nome;
        emailInput.value = aluno.email;
    } else {
        // Aluno NÃO está logado: mostra o aviso para fazer login
        loginPrompt.classList.remove('hidden');
        contactForm.classList.add('hidden');
    }

    // --- LÓGICA DE ENVIO DO FORMULÁRIO ---
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // 1. Pega o token de autenticação do aluno do localStorage
            const token = localStorage.getItem('alunoAuthToken');

            // Validação extra para garantir que o token existe
            if (!token) {
                showToast("Sua sessão expirou. Por favor, faça login novamente.", 'error');
                return;
            }

            const assunto = document.getElementById('subject').value;
            const corpo = document.getElementById('message').value;

            try {
                const response = await fetch('/api/mensagens', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        // 2. Adiciona o token do ALUNO ao cabeçalho da requisição
                        'x-auth-token': token 
                    },
                    body: JSON.stringify({ assunto, corpo })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Erro ao enviar a mensagem.");
                }

                // Sucesso!
                showToast('Mensagem enviada com sucesso!', 'success');
                document.getElementById('subject').value = '';
                document.getElementById('message').value = '';

            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
});