document.addEventListener('DOMContentLoaded', () => {
    // Adiciona a proteção de login à página
    protectPage();

    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');
    const phoneInput = document.getElementById('phone');

    // --- LÓGICA PARA A MÁSCARA DE TELEFONE ---
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
            
            if (value.length > 11) {
                value = value.substring(0, 11);
            }

            if (value.length > 10) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d*)/, '($1');
            }
            
            e.target.value = value;
        });
    }


    // --- LÓGICA PARA CONFIRMAÇÃO DE ENVIO ---
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); 

            if (successMessage) {
                successMessage.style.display = 'flex';
            }

            contactForm.reset();

            setTimeout(() => {
                if (successMessage) {
                    successMessage.style.display = 'none';
                }
            }, 5000); 
        });
    }

});