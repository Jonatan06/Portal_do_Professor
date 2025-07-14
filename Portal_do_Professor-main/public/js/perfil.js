document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DO DOM ---
    const toggleEditButton = document.getElementById('toggleEditButton');
    const profileForm = document.getElementById('profile-form');
    const formInputs = profileForm.querySelectorAll('.profile-input');
    const profileImagePreview = document.getElementById('profile-image-preview');
    const changePictureButton = document.getElementById('change-picture-button');
    const profilePictureInput = document.getElementById('profile-picture-input');
    const socialMediaSection = document.querySelector('.social-media');
    
    // --- VARIÁVEIS DE ESTADO ---
    const API_URL = '/api/profile';
    let originalProfileData = {};

    // --- FUNÇÕES ---
    async function loadProfile() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const user = await response.json();
            originalProfileData = user;
            updateProfileFields(user);
            // Garante que o estado inicial seja de visualização
            setViewState();
        } catch (error) {
            console.error('Erro detalhado ao carregar perfil:', error);
            showToast('Não foi possível carregar os dados do perfil.', 'error');
        }
    }

    function updateProfileFields(user) {
        document.getElementById('nome').value = user.nome || '';
        document.getElementById('cargo').value = user.cargo || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('bio').value = user.biografia || '';
        
        document.getElementById('linkedin1').value = user.linkedin_url || '';
        document.getElementById('linkedin-container').dataset.url = user.linkedin_url || '';
        
        document.getElementById('github').value = user.github_url || '';
        document.getElementById('github-container').dataset.url = user.github_url || '';
        
        document.getElementById('lattes').value = user.lattes_url || '';
        document.getElementById('lattes-container').dataset.url = user.lattes_url || '';

        document.getElementById('website').value = user.website_url || '';
        document.getElementById('website-container').dataset.url = user.website_url || '';
        
        if (profileImagePreview && user.imagem_url) {
            profileImagePreview.src = user.imagem_url;
        }
    }

    // --- LÓGICA DE EDIÇÃO CORRIGIDA ---
    
    // Função para definir o MODO DE VISUALIZAÇÃO
    function setViewState() {
        profileForm.classList.remove('edit-mode');
        profileForm.classList.add('view-mode');
        formInputs.forEach(input => {
            // CORREÇÃO: Usar 'disabled' em vez de 'readOnly'
            input.disabled = true;
        });
        toggleEditButton.innerHTML = '<i class="fa-solid fa-pencil"></i> Editar Perfil';
        toggleEditButton.classList.remove('btn-success');
        toggleEditButton.classList.add('btn-primary');
    }

    // Função para definir o MODO DE EDIÇÃO
    function setEditState() {
        profileForm.classList.remove('view-mode');
        profileForm.classList.add('edit-mode');
        formInputs.forEach(input => {
            // CORREÇÃO: Usar 'disabled' em vez de 'readOnly'
            input.disabled = false;
        });
        toggleEditButton.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
        toggleEditButton.classList.remove('btn-primary');
        toggleEditButton.classList.add('btn-success');
    }

    async function saveProfile() {
        const profileData = {
            nome: document.getElementById('nome').value,
            cargo: document.getElementById('cargo').value,
            email: document.getElementById('email').value,
            biografia: document.getElementById('bio').value,
            linkedin_url: document.getElementById('linkedin1').value,
            github_url: document.getElementById('github').value,
            lattes_url: document.getElementById('lattes').value,
            website_url: document.getElementById('website').value,
        };

        try {
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (!response.ok) throw new Error('Falha ao salvar os dados.');
            
            originalProfileData = await response.json(); 
            showToast('Perfil atualizado com sucesso!', 'success');
            setViewState(); // Volta para o modo de visualização após salvar
            updateProfileFields(originalProfileData);
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            showToast('Ocorreu um erro ao salvar as alterações.', 'error');
        }
    }

    async function saveProfilePicture() {
        const file = profilePictureInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await fetch('/api/profile/picture', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha no upload da imagem.');
            }
            const updatedProfile = await response.json();
            profileImagePreview.src = updatedProfile.imagem_url;
            showToast('Foto de perfil atualizada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar foto de perfil:', error);
            showToast(`Ocorreu um erro: ${error.message}`, 'error');
        } finally {
            profilePictureInput.value = '';
        }
    }

    // --- EVENT LISTENERS ---
    if (toggleEditButton) {
        toggleEditButton.addEventListener('click', function() {
            // Se o formulário está em modo de edição, o clique salva. Senão, entra no modo de edição.
            if (profileForm.classList.contains('edit-mode')) {
                saveProfile();
            } else {
                setEditState();
            }
        });
    }

    if (changePictureButton) {
        changePictureButton.addEventListener('click', () => profilePictureInput.click());
    }

    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => profileImagePreview.src = e.target.result;
                reader.readAsDataURL(file);
                saveProfilePicture();
            }
        });
    }

    if (socialMediaSection) {
        socialMediaSection.addEventListener('click', (e) => {
            // Só redireciona se estiver no modo de visualização
            if (profileForm.classList.contains('view-mode')) {
                const container = e.target.closest('.input-with-icon');
                if (container && container.dataset.url) {
                    window.open(container.dataset.url, '_blank', 'noopener,noreferrer');
                }
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    loadProfile();
    initTooltips(); 
});