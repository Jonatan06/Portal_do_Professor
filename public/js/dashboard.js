document.addEventListener('DOMContentLoaded', () => {

    async function loadStats() {
        try {
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) throw new Error('Falha ao buscar estatísticas.');
            const stats = await response.json();

            document.getElementById('posts-count').textContent = stats.posts;
            document.getElementById('materiais-count').textContent = stats.materiais;
            document.getElementById('eventos-count').textContent = stats.eventos;
            document.getElementById('projetos-count').textContent = stats.projetos;

            document.getElementById('blog-notification').textContent = stats.posts;
            document.getElementById('materiais-notification').textContent = stats.materiais;
            document.getElementById('agenda-notification').textContent = stats.eventos;
            document.getElementById('portfolio-notification').textContent = stats.projetos;

        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }

    // Em public/js/dashboard.js

async function loadRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    // Objeto de configuração para facilitar a renderização
    const activityConfig = {
        post: { icon: 'fas fa-blog', color: 'icon-purple', text: (title) => `Novo post "${truncate(title)}" foi criado.` },
        material: { icon: 'fas fa-folder', color: 'icon-orange', text: (title) => `Novo material "${truncate(title)}" foi adicionado.` },
        evento: { icon: 'fas fa-calendar-alt', color: 'icon-blue', text: (title) => `Novo evento "${truncate(title)}" agendado.` },
        projeto: { icon: 'fas fa-briefcase', color: 'icon-green', text: (title) => `Novo projeto "${truncate(title)}" foi adicionado.` }
    };

    // Função auxiliar para cortar textos longos
    function truncate(text, length = 25) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    try {
        const response = await fetch('/api/dashboard/recent-activity');
        if (!response.ok) throw new Error('Falha ao buscar atividades.');
        const activities = await response.json();

        activityList.innerHTML = ''; // Limpa a lista antiga

        if (activities.length === 0) {
            activityList.innerHTML = '<p>Nenhuma atividade recente encontrada.</p>';
            return;
        }

        activities.forEach(activity => {
            const config = activityConfig[activity.type];
            if (!config) return; // Ignora tipos de atividade desconhecidos

            const itemHTML = `
                <div class="activity-item">
                    <div class="activity-icon-wrapper ${config.color}">
                        <i class="fas ${config.icon}"></i>
                    </div>
                    <p>${config.text(activity.title)}</p>
                </div>`;
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
                const eventDate = new Date(event.date);
                const day = eventDate.getUTCDate();
                const month = eventDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                const itemHTML = `
                    <div class="event-item">
                        <div class="event-date">
                            <span>${day}</span>
                            ${month}
                        </div>
                        <p>${event.title}</p>
                    </div>`;
                eventsList.insertAdjacentHTML('beforeend', itemHTML);
            });

        } catch(error) {
            console.error("Erro ao carregar próximos eventos:", error);
            eventsList.innerHTML = '<p style="color: red;">Erro ao carregar eventos.</p>';
        }
    }

    loadStats();
    loadRecentActivity();
    loadUpcomingEvents();


const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout(); // A função logout() vem do seu auth.js
        });
    }
});