document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('public-contact-form');
    const loginPrompt = document.getElementById('contact-login-prompt');

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

    // --- LÓGICA DE AUTENTICAÇÃO ---
    const aluno = getAlunoLogado();

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
            
            const assunto = document.getElementById('subject').value;
            const corpo = document.getElementById('message').value;

            try {
                const response = await fetch('/api/mensagens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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