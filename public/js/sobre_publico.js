document.addEventListener('DOMContentLoaded', () => {

    function formatUrl(url) {
        if (!url) return '#'; 
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url; 
        }
        return `https://${url}`;
    }

    async function loadProfileData() {
        try {
            const response = await fetch('/api/public-profile'); 
            if (!response.ok) throw new Error('Falha ao buscar perfil.');
            const profile = await response.json();

            document.getElementById('profile-photo').src = profile.imagem_url || '/uploads/images/default-avatar.png';
            document.getElementById('profile-name').textContent = profile.nome || 'Nome do Professor';
            document.getElementById('profile-title').textContent = profile.cargo || 'Cargo';
            document.getElementById('profile-bio').textContent = profile.biografia || 'Bem-vindo ao meu espaço digital.';

            const socialLinksContainer = document.getElementById('profile-social-links');
            socialLinksContainer.innerHTML = '';

            if (profile.linkedin_url) {
                socialLinksContainer.innerHTML += `<a href="${formatUrl(profile.linkedin_url)}" target="_blank" data-tooltip="LinkedIn"><i class="fab fa-linkedin"></i></a>`;
            }
            if (profile.github_url) {
                socialLinksContainer.innerHTML += `<a href="${formatUrl(profile.github_url)}" target="_blank" data-tooltip="GitHub"><i class="fab fa-github"></i></a>`;
            }
            if (profile.instagram_url) {
                socialLinksContainer.innerHTML += `<a href="${formatUrl(profile.instagram_url)}" target="_blank" data-tooltip="Instagram"><i class="fab fa-instagram"></i></a>`;
            }
            if (profile.website_url) {
                socialLinksContainer.innerHTML += `<a href="${formatUrl(profile.website_url)}" target="_blank" data-tooltip="Website Pessoal"><i class="fas fa-globe"></i></a>`;
            }

            if (profile.custom_links && profile.custom_links.length > 0) {
                profile.custom_links.forEach(link => {
                    socialLinksContainer.innerHTML += `<a href="${formatUrl(link.url)}" target="_blank" data-tooltip="${link.label}"><i class="fas fa-link"></i></a>`;
                });
            }

            // --- CORREÇÃO ADICIONADA AQUI ---
            // Esta linha ativa os tooltips para os ícones que acabamos de criar.
            if (typeof initTooltips === 'function') {
                initTooltips();
            }
            // --- FIM DA CORREÇÃO ---

        } catch (error) {
            console.error("Erro ao carregar dados do perfil:", error);
        }
    }
    
    loadProfileData();
});