// public/js/contato_publico.js (VERSÃO CORRIGIDA)

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('public-contact-form');
    const loginPrompt = document.getElementById('contact-login-prompt');
    const successMessage = document.getElementById('success-message');

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

    // --- LÓGICA DE AUTENTICAÇÃO (NOVO) ---
    const aluno = getAlunoLogado();

    if (aluno) {
        // Aluno está logado
        loginPrompt.classList.add('hidden');
        contactForm.classList.remove('hidden');

        // Preenche os dados do aluno
        nameInput.value = aluno.nome;
        emailInput.value = aluno.email;

    } else {
        // Aluno NÃO está logado
        loginPrompt.classList.remove('hidden');
        contactForm.classList.add('hidden');
    }

    // --- LÓGICA DE ENVIO DO FORMULÁRIO ---
contactForm.addEventListener('submit', async (e) => { // Adicione 'async'
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
        if (successMessage) successMessage.classList.remove('hidden');
        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';

        setTimeout(() => {
            if (successMessage) successMessage.classList.add('hidden');
        }, 5000);

    } catch (error) {
        alert(error.message); // Mostra o erro para o usuário
    }
});
});