document.addEventListener('DOMContentLoaded', () => {

    async function loadProfileData() {
        try {
            const response = await fetch('/api/profile');
            if (!response.ok) throw new Error('Falha ao buscar perfil.');
            const profile = await response.json();

            document.getElementById('profile-photo').src = profile.imagem_url || '/assets/default-avatar.png';
            document.getElementById('profile-name').textContent = profile.nome || 'Nome do Professor';
            document.getElementById('profile-title').textContent = profile.cargo || 'Cargo';
            document.getElementById('profile-bio').textContent = profile.biografia || 'Bem-vindo ao meu espaço digital.';

            const socialLinksContainer = document.getElementById('profile-social-links');
            socialLinksContainer.innerHTML = '';

            if (profile.linkedin_url) {
                socialLinksContainer.innerHTML += `<a href="${profile.linkedin_url}" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
            }
            if (profile.github_url) {
                socialLinksContainer.innerHTML += `<a href="${profile.github_url}" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>`;
            }
            if (profile.lattes_url) {
                socialLinksContainer.innerHTML += `<a href="${profile.lattes_url}" target="_blank" title="Lattes"><i class="fas fa-graduation-cap"></i></a>`;
            }
            if (profile.website_url) {
                socialLinksContainer.innerHTML += `<a href="${profile.website_url}" target="_blank" title="Website Pessoal"><i class="fas fa-globe"></i></a>`;
            }
        } catch (error) {
            console.error("Erro ao carregar dados do perfil:", error);
        }
    }
    loadProfileData();
});