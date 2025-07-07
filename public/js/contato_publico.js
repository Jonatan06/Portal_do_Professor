document.addEventListener('DOMContentLoaded', () => {

    const contactForm = document.getElementById('public-contact-form');
    const successMessage = document.getElementById('success-message');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            console.log('Formulário enviado (simulação)');
            
            if (successMessage) {
                successMessage.classList.remove('hidden');
            }
            contactForm.reset();

            setTimeout(() => {
                if (successMessage) {
                    successMessage.classList.add('hidden');
                }
            }, 5000); 
        });
    }
});