/**
 * =================================================================
 * FUNÇÃO GLOBAL
 * =================================================================
 */
function getAlunoLogado() {
    const alunoLogadoData = localStorage.getItem('alunoLogado');
    if (!alunoLogadoData) {
        return null;
    }
    try {
        return JSON.parse(alunoLogadoData);
    } catch (error) {
        console.error("Erro ao processar dados do aluno do localStorage:", error);
        localStorage.removeItem('alunoAuthToken');
        localStorage.removeItem('alunoLogado');
        return null;
    }
}

async function uploadAlunoProfilePicture(file) {
    const token = localStorage.getItem('alunoAuthToken');
    if (!token) {
        showToast('Sua sessão expirou. Faça login novamente.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('alunoProfilePicture', file);

    try {
        const response = await fetch('/api/alunos/profile/picture', {
            method: 'POST',
            headers: {
                'x-auth-token': token
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Falha ao enviar a imagem.');
        }

        const avatarImg = document.getElementById('aluno-avatar-img');
        if (avatarImg) {
            avatarImg.src = `${data.imagem_url}?v=${new Date().getTime()}`;
        }

        const aluno = getAlunoLogado();
        if (aluno) {
            aluno.imagem_url = data.imagem_url;
            localStorage.setItem('alunoLogado', JSON.stringify(aluno));
        }

        showToast('Foto de perfil atualizada com sucesso!', 'success');

    } catch (error) {
        console.error("Erro no upload da foto:", error);
        showToast(error.message, 'error');
    }
}


/**
 * =================================================================
 * LÓGICA DE EXECUÇÃO DA PÁGINA
 * =================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DO MODAL DE LOGOUT ---
    const modal = document.getElementById('confirm-logout-modal');
    const cancelButton = document.getElementById('cancel-logout-btn');
    const confirmButton = document.getElementById('confirm-logout-btn');
    const closeBtn = modal ? modal.querySelector('.modal-close-btn') : null;

    const openModal = () => {
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        }
    };

    const closeModal = () => {
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };

    if (confirmButton) {
        confirmButton.addEventListener('click', () => {
            localStorage.removeItem('alunoAuthToken');
            localStorage.removeItem('alunoLogado');
            window.location.href = '/';
        });
    }

    if (cancelButton) cancelButton.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });


    // --- LÓGICA DE AUTENTICAÇÃO DO ALUNO ---
    const aluno = getAlunoLogado();
    const alunoToken = localStorage.getItem('alunoAuthToken');
    const userActionsContainer = document.querySelector('.nav-user-actions');
    let isProfileOptionsVisible = false; // Controla a visibilidade das opções

    if (aluno && alunoToken && userActionsContainer) {
        document.body.classList.add('aluno-logado');
        userActionsContainer.innerHTML = '';

        const primeiroNome = aluno.nome ? aluno.nome.split(' ')[0] : 'Aluno';
        const avatarSrc = aluno.imagem_url ? `${aluno.imagem_url}?v=${new Date().getTime()}` : '/uploads/images/default-avatar.png';

        const profileAreaHTML = `
            <div class="aluno-profile-area" id="aluno-profile-trigger">
                <img src="${avatarSrc}" alt="Avatar de ${primeiroNome}" class="aluno-avatar" id="aluno-avatar-img">
                <span class="nav-welcome">${primeiroNome}</span>
                <div id="profile-options" class="profile-options">
                    <i class="fas fa-camera"></i> Alterar Foto
                </div>
            </div>
            <a href="#" id="aluno-logout-btn" class="btn-login">Sair</a>
            <input type="file" id="aluno-profile-picture-input" accept="image/*" style="display: none;">
        `;

        userActionsContainer.insertAdjacentHTML('beforeend', profileAreaHTML);

        const profileTrigger = document.getElementById('aluno-profile-trigger');
        const profileOptions = document.getElementById('profile-options');
        const pictureInput = document.getElementById('aluno-profile-picture-input');
        const logoutBtn = document.getElementById('aluno-logout-btn');

        const toggleProfileOptions = () => {
            isProfileOptionsVisible = !isProfileOptionsVisible;
            if (profileOptions) {
                profileOptions.classList.toggle('active', isProfileOptionsVisible);
            }
        };

        const hideProfileOptionsOutsideClick = (event) => {
            if (profileOptions && !profileOptions.contains(event.target) && !profileTrigger.contains(event.target) && isProfileOptionsVisible) {
                toggleProfileOptions();
            }
        };

        if (profileTrigger) {
            profileTrigger.addEventListener('click', toggleProfileOptions);
        }

        if (profileOptions) {
            profileOptions.addEventListener('click', () => pictureInput.click());
        }

        if (pictureInput) {
            pictureInput.addEventListener('change', (event) => {
                const file = event.target.files ? event.target.files?.[0] : null;
                if (file) {
                    uploadAlunoProfilePicture(file);
                    toggleProfileOptions(); // Esconde as opções após a seleção
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        }

        document.addEventListener('click', hideProfileOptionsOutsideClick);
    }
});