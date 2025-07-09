document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DO DOM ---
    const toggleEditButton = document.getElementById('toggleEditButton');
    const formInputs = document.querySelectorAll('.profile-input');
    const profileImagePreview = document.getElementById('profile-image-preview');
    const changePictureButton = document.getElementById('change-picture-button');
    const profilePictureInput = document.getElementById('profile-picture-input');
    const savePictureButton = document.getElementById('save-picture-button');

    // --- VARIÁVEIS DE ESTADO ---
    let isEditMode = false;
    const API_URL = '/api/profile';
    let originalProfileData = {}; // Guarda os dados originais para cancelar a edição de texto

    // --- FUNÇÕES ---

    // Carrega os dados do perfil do servidor e preenche o formulário
    async function loadProfile() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            
            const user = await response.json();
            originalProfileData = user; // Salva os dados originais
            updateProfileFields(user);

        } catch (error) {
            console.error('Erro detalhado ao carregar perfil:', error);
            alert('Não foi possível carregar os dados do perfil. Verifique o console para mais detalhes.');
        }
    }

    // Atualiza os campos do formulário e a imagem
    function updateProfileFields(user) {
        document.getElementById('nome').value = user.nome || '';
        document.getElementById('cargo').value = user.cargo || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('bio').value = user.biografia || '';
        document.getElementById('linkedin1').value = user.linkedin_url || '';
        document.getElementById('github').value = user.github_url || '';
        document.getElementById('lattes').value = user.lattes_url || '';
        document.getElementById('website').value = user.website_url || '';
        if (profileImagePreview && user.imagem_url) {
            profileImagePreview.src = user.imagem_url;
        }
    }
    
    // Ativa ou desativa o modo de edição do formulário de texto
    function toggleEditMode() {
        isEditMode = !isEditMode;
        formInputs.forEach(input => {
            input.disabled = !isEditMode;
        });

        if (isEditMode) {
            toggleEditButton.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
            toggleEditButton.classList.remove('btn-primary');
            toggleEditButton.classList.add('btn-success');
        } else {
            // Se saiu do modo de edição sem salvar, restaura os dados originais
            updateProfileFields(originalProfileData);
            toggleEditButton.innerHTML = '<i class="fa-solid fa-pencil"></i> Editar Perfil';
            toggleEditButton.classList.remove('btn-success');
            toggleEditButton.classList.add('btn-primary');
        }
    }

    // Salva as informações de texto do perfil
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
            
            originalProfileData = await response.json(); // Atualiza os dados originais com os salvos
            alert('Perfil atualizado com sucesso!');
            toggleEditMode(); // Sai do modo de edição

        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            alert('Ocorreu um erro ao salvar as alterações.');
        }
    }

    // Salva a nova foto de perfil
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
            profileImagePreview.src = updatedProfile.imagem_url; // Atualiza a imagem na página
            alert('Foto de perfil atualizada com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar foto de perfil:', error);
            alert(`Ocorreu um erro: ${error.message}`);
        } finally {
            savePictureButton.style.display = 'none'; // Esconde o botão de salvar
            profilePictureInput.value = ''; // Limpa o input
        }
    }

    // --- EVENT LISTENERS ---

    // Botão para entrar/sair do modo de edição de texto
    if (toggleEditButton) {
        toggleEditButton.addEventListener('click', function() {
            if (isEditMode) {
                saveProfile();
            } else {
                toggleEditMode();
            }
        });
    }

    // Botão para acionar o seletor de arquivo
    if (changePictureButton) {
        changePictureButton.addEventListener('click', () => {
            profilePictureInput.click();
        });
    }

    // Quando um arquivo é selecionado
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                // Mostra a pré-visualização da imagem
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
                savePictureButton.style.display = 'block'; // Mostra o botão de salvar
            }
        });
    }

    // Botão para salvar a nova imagem
    if (savePictureButton) {
        savePictureButton.addEventListener('click', saveProfilePicture);
    }

    // --- INICIALIZAÇÃO ---
    loadProfile();
});