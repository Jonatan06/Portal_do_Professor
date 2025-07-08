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

    function loadRecentActivity() {
        const activities = [
            { icon: 'fa-plus-circle', color: 'icon-green', text: 'Novo projeto "Metodologias Ativas" foi adicionado.' },
            { icon: 'fa-calendar-check', color: 'icon-blue', text: 'Novo evento "Reunião Pedagógica" agendado.' },
            { icon: 'fa-pen-alt', color: 'icon-orange', text: 'Post "O que torna a interface do Nubank..." foi criado.' },
            { icon: 'fa-user-edit', color: 'icon-purple', text: 'Seu perfil foi atualizado com sucesso.' },
        ];
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        activityList.innerHTML = '';

        activities.forEach(activity => {
            const itemHTML = `
                <div class="activity-item">
                    <div class="activity-icon-wrapper ${activity.color}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <p>${activity.text}</p>
                </div>`;
            activityList.insertAdjacentHTML('beforeend', itemHTML);
        });
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
});