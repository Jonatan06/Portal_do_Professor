document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA ATUALIZAR DATA E HORA ---
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');

    function updateDateTime() {
        const now = new Date();

        // Formata a data (ex: terça-feira, 15 de julho de 2025)
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('pt-BR', dateOptions);

        // Formata a hora (ex: 14:52)
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        timeElement.textContent = now.toLocaleTimeString('pt-BR', timeOptions);
    }

    // Atualiza a cada segundo
    setInterval(updateDateTime, 1000);
    // Chama a função uma vez para não esperar 1 segundo para exibir
    updateDateTime();
    // --- FIM DA LÓGICA DE DATA E HORA ---


    async function loadStats() {
        try {
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) throw new Error('Falha ao buscar estatísticas.');
            const stats = await response.json();

            document.getElementById('posts-count').textContent = stats.posts;
            document.getElementById('materiais-count').textContent = stats.materiais;
            document.getElementById('eventos-count').textContent = stats.eventos;
            document.getElementById('projetos-count').textContent = stats.projetos;

        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }

    async function loadRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        const activityConfig = {
            post: { icon: 'fa-blog', color: 'icon-purple', link: 'blog_admin.html', text: (title) => `Novo post "${truncate(title)}" foi criado.` },
            material: { icon: 'fa-folder', color: 'icon-orange', link: 'materiais.html', text: (title) => `Novo material "${truncate(title)}" foi adicionado.` },
            evento: { icon: 'fa-calendar-alt', color: 'icon-blue', link: 'agenda.html', text: (title) => `Novo evento "${truncate(title)}" agendado.` },
            projeto: { icon: 'fa-briefcase', color: 'icon-green', link: 'portfolio.html', text: (title) => `Novo projeto "${truncate(title)}" foi adicionado.` }
        };

        function truncate(text, length = 25) {
            return text.length > length ? text.substring(0, length) + '...' : text;
        }

        try {
            const response = await fetch('/api/dashboard/recent-activity');
            if (!response.ok) throw new Error('Falha ao buscar atividades.');
            const activities = await response.json();

            activityList.innerHTML = ''; 

            if (activities.length === 0) {
                activityList.innerHTML = '<p>Nenhuma atividade recente encontrada.</p>';
                return;
            }

            activities.forEach(activity => {
                const config = activityConfig[activity.type];
                if (!config) return; 

                const itemHTML = `
                    <a href="${config.link}" class="activity-item">
                        <div class="activity-icon-wrapper ${config.color}">
                            <i class="fas ${config.icon}"></i>
                        </div>
                        <p>${config.text(activity.title)}</p>
                    </a>`;
                activityList.insertAdjacentHTML('beforeend', itemHTML);
            });

        } catch (error) {
            console.error("Erro ao carregar atividade recente:", error);
            activityList.innerHTML = '<p style="color:red;">Erro ao carregar atividades.</p>';
        }
    }

    async function loadUpcomingEvents() {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) return;
        try {
            const response = await fetch('/api/dashboard/upcoming-events');
            if (!response.ok) throw new Error('Falha ao buscar eventos.');
            const events = await response.json();

            eventsList.innerHTML = '';
            if (events.length === 0) {
                eventsList.innerHTML = '<p>Nenhum evento próximo agendado.</p>';
                return;
            }

            events.forEach(event => {
                const eventDate = new Date(event.date + 'T12:00:00');
                const day = eventDate.getDate();
                const month = eventDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                
                const eventColor = event.cor || '#0d6efd';

                const formattedDate = eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                let tooltipLines = [event.title];
                tooltipLines.push(`Data: ${formattedDate}`);
                if (event.time) {
                    tooltipLines.push(`Horário: ${event.time}`);
                }
                if (event.observacao) {
                    tooltipLines.push(`Obs: ${event.observacao}`);
                }
                const tooltipContent = tooltipLines.join('\n');

                const itemHTML = `
                    <div class="event-item" 
                         data-custom-tooltip
                         data-tooltip-color="${eventColor}"
                         data-tooltip-content="${tooltipContent}">
                        <div class="event-date" style="border-left: 3px solid ${eventColor};">
                            <span>${day}</span>
                            ${month}
                        </div>
                        <p>${event.title}</p>
                    </div>`;
                eventsList.insertAdjacentHTML('beforeend', itemHTML);
            });
            
            initCustomTooltips();

        } catch(error) {
            console.error("Erro ao carregar próximos eventos:", error);
            eventsList.innerHTML = '<p style="color: red;">Erro ao carregar eventos.</p>';
        }
    }

    loadStats();
    loadRecentActivity();
    loadUpcomingEvents();

    const logoutButton = document.getElementById('logout-button');
    const confirmLogoutModal = document.getElementById('confirm-logout-modal');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const closeModalButton = confirmLogoutModal.querySelector('.modal-close-btn');

    function logout() {
        if (confirmLogoutModal) {
            confirmLogoutModal.classList.add('active');
        }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    function hideLogoutModal() {
        if (confirmLogoutModal) {
            confirmLogoutModal.classList.remove('active');
        }
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userToken');
            sessionStorage.removeItem('userToken');

            window.location.href = '/'; 
        });
    }

    // Botão "Cancelar": apenas fecha o modal
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', hideLogoutModal);
    }
    
    // Botão "X" para fechar o modal
    if(closeModalButton) {
        closeModalButton.addEventListener('click', hideLogoutModal);
    }
});