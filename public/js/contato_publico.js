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
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        console.log('Formulário enviado (simulação)');
        
        // Simulação de envio bem-sucedido
        if (successMessage) {
            successMessage.classList.remove('hidden');
        }
        // Limpa apenas os campos que o usuário preencheu
        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';

        setTimeout(() => {
            if (successMessage) {
                successMessage.classList.add('hidden');
            }
        }, 5000); 
    });
});