document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS DO DOM ---
    const toggleEditButton = document.getElementById('toggleEditButton');
    const profileForm = document.getElementById('profile-form');
    const profileImagePreview = document.getElementById('profile-image-preview');
    const changePictureButton = document.getElementById('change-picture-button');
    const profilePictureInput = document.getElementById('profile-picture-input');
    
    const bioTextarea = document.getElementById('bio');
    const bioCharCounter = document.getElementById('bio-char-counter');

    const customLinksContainer = document.getElementById('custom-links-container');
    const addLinkBtn = document.getElementById('add-link-btn');
    const MAX_LINKS = 3;

    // --- VARIÁVEIS DE ESTADO ---
    const API_URL = '/api/profile';

    // --- FUNÇÕES ---
    async function loadProfile() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            const user = await response.json();
            updateProfileFields(user);
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
        
        const bioContent = user.biografia || '';
        bioTextarea.value = bioContent;
        bioCharCounter.textContent = `${bioContent.length}/50`;
        
        document.getElementById('linkedin_url').value = user.linkedin_url || '';
        document.getElementById('github_url').value = user.github_url || '';
        document.getElementById('instagram_url').value = user.instagram_url || '';
        document.getElementById('website_url').value = user.website_url || '';
        
        if (profileImagePreview && user.imagem_url) {
            profileImagePreview.src = user.imagem_url;
        }

        renderCustomLinks(user.custom_links || []);
    }

    function setViewState() {
        profileForm.classList.remove('edit-mode');
        profileForm.classList.add('view-mode');
        
        profileForm.querySelectorAll('.profile-input, .btn-remove-link').forEach(el => {
            el.disabled = true;
        });
        
        toggleEditButton.innerHTML = '<i class="fa-solid fa-pencil"></i> Editar Perfil';
        toggleEditButton.classList.remove('btn-success');
        addLinkBtn.style.display = 'none';
    }

    function setEditState() {
        profileForm.classList.remove('view-mode');
        profileForm.classList.add('edit-mode');
        
        profileForm.querySelectorAll('.profile-input, .btn-remove-link').forEach(el => {
            el.disabled = false;
        });

        toggleEditButton.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
        toggleEditButton.classList.add('btn-success');
        updateAddLinkButtonVisibility();
    }
    
    async function saveProfile() {
        const profileData = {
            nome: document.getElementById('nome').value,
            cargo: document.getElementById('cargo').value,
            email: document.getElementById('email').value,
            biografia: document.getElementById('bio').value,
            linkedin_url: document.getElementById('linkedin_url').value,
            github_url: document.getElementById('github_url').value,
            instagram_url: document.getElementById('instagram_url').value,
            website_url: document.getElementById('website_url').value,
        };

        const customLinks = [];
        const linkRows = customLinksContainer.querySelectorAll('.custom-link-row');
        linkRows.forEach(row => {
            const label = row.querySelector('input[name="custom_label"]').value.trim();
            const url = row.querySelector('input[name="custom_url"]').value.trim();
            if (label && url) {
                customLinks.push({ label, url });
            }
        });

        const fullProfileData = { ...profileData, custom_links: customLinks };

        try {
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fullProfileData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ 
                    message: `O servidor respondeu com um erro ${response.status}, mas sem detalhes.` 
                }));
                throw new Error(errorData.message);
            }
            
            const updatedProfile = await response.json(); 
            showToast('Perfil atualizado com sucesso!', 'success');
            updateProfileFields(updatedProfile);
            setViewState();
        } catch (error) {
            console.error('Erro detalhado ao salvar perfil:', error);
            showToast(`Ocorreu um erro ao salvar: ${error.message}`, 'error');
        }
    }

    function createCustomLinkRow(link = { label: '', url: '' }, isEditable = false) {
        const row = document.createElement('div');
        row.className = 'custom-link-row';
        const disabledAttr = isEditable ? '' : 'disabled';
        
        row.innerHTML = `
            <div class="form-group">
                <label>Nome do Link</label>
                <input type="text" name="custom_label" class="profile-input" placeholder="Ex: Portfólio" value="${link.label}" ${disabledAttr}>
            </div>
            <div class="form-group">
                <label>URL</label>
                <input type="url" name="custom_url" class="profile-input" placeholder="https://" value="${link.url}" ${disabledAttr}>
            </div>
            <button type="button" class="btn-remove-link" data-tooltip="Remover Link" ${disabledAttr}><i class="fas fa-trash"></i></button>
        `;
        customLinksContainer.appendChild(row);

        // --- LÓGICA ATUALIZADA AQUI ---
        row.querySelector('.btn-remove-link').addEventListener('click', () => {
            row.remove();
            // Ao remover uma linha, o botão "Adicionar" deve reaparecer se estivermos em modo de edição
            updateAddLinkButtonVisibility();
        });
        
        initTooltips();
        return row;
    }
    
    function renderCustomLinks(links) {
        customLinksContainer.innerHTML = '';
        if (links) {
            const isEditable = profileForm.classList.contains('edit-mode');
            links.forEach(link => createCustomLinkRow(link, isEditable));
        }
    }

    // --- FUNÇÃO DE VISIBILIDADE ATUALIZADA ---
    function updateAddLinkButtonVisibility() {
        const currentLinks = customLinksContainer.querySelectorAll('.custom-link-row').length;
        // O botão só aparece se estiver em modo de edição E houver espaço para mais links
        if (currentLinks < MAX_LINKS && profileForm.classList.contains('edit-mode')) {
            addLinkBtn.style.display = 'block';
        } else {
            addLinkBtn.style.display = 'none';
        }
    }

    // --- EVENT LISTENERS ---
    toggleEditButton.addEventListener('click', function() {
        if (profileForm.classList.contains('edit-mode')) {
            saveProfile();
        } else {
            setEditState();
        }
    });

    addLinkBtn.addEventListener('click', () => {
        if (customLinksContainer.querySelectorAll('.custom-link-row').length < MAX_LINKS) {
            const newRow = createCustomLinkRow({ label: '', url: '' }, true);
            newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newRow.querySelector('input[name="custom_label"]').focus();
        }
        // Após adicionar, o botão é escondido até que o formulário seja salvo
        updateAddLinkButtonVisibility();
    });
    
    changePictureButton.addEventListener('click', () => profilePictureInput.click());
    profilePictureInput.addEventListener('change', saveProfilePicture);

    async function saveProfilePicture() {
        const file = profilePictureInput.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('profilePicture', file);
        try {
            const response = await fetch('/api/profile/picture', { method: 'POST', body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha no upload da imagem.');
            }
            const updatedProfile = await response.json();
            profileImagePreview.src = updatedProfile.imagem_url;
            showToast('Foto de perfil atualizada com sucesso!', 'success');
        } catch (error) {
            showToast(`Ocorreu um erro: ${error.message}`, 'error');
        } finally {
            profilePictureInput.value = '';
        }
    }

    if (bioTextarea) {
        bioTextarea.addEventListener('input', () => {
            bioCharCounter.textContent = `${bioTextarea.value.length}/50`;
        });
    }

    // --- INICIALIZAÇÃO ---
    loadProfile();
});