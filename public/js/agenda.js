document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api/eventos';
    const calendarBody = document.getElementById('calendar-body');
    const monthYearDisplay = document.getElementById('month-year-display');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const eventsListContainer = document.getElementById('events-list-container');
    const modal = document.getElementById('event-modal');
    const closeModalBtn = modal.querySelector('.close-modal-btn');
    const addEventSidebarBtn = document.getElementById('add-event-sidebar-btn');
    const eventForm = document.getElementById('event-form');
    const modalTitle = document.getElementById('modal-title');
    const deleteEventBtn = document.getElementById('delete-event-btn');

    let currentDate = new Date();
    let events = [];

    async function fetchEvents() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Falha ao carregar eventos da API.');
            events = await response.json();
            renderCalendar(currentDate);
            renderEventList(currentDate);
        } catch (error) {
            console.error("Erro ao buscar eventos:", error);
            showToast("Não foi possível carregar os eventos da agenda.", 'error');
        }
    }

    // ATUALIZADO: Adiciona data-tooltip e chama initTooltips()
    function renderCalendar(date) {
        if (!calendarBody || !monthYearDisplay) return;

        calendarBody.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        monthYearDisplay.textContent = `${date.toLocaleString('pt-BR', { month: 'long' })} de ${year}`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = new Date().toISOString().split('T')[0];

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarBody.insertAdjacentHTML('beforeend', '<div class="day-cell other-month"></div>');
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(year, month, day).toISOString().split('T')[0];
            let classes = "day-cell";
            if (dateStr === todayStr) classes += " today";

            const eventsOfTheDay = events.filter(e => e.date && e.date.startsWith(dateStr));
            let pinsHTML = '';
            let tooltipText = '';

            if (eventsOfTheDay.length > 0) {
                pinsHTML = `<i class='bx bxs-pin pin-icon ${eventsOfTheDay[0].type}'></i>`;
                tooltipText = eventsOfTheDay.map(e => e.title).join(', '); // Junta títulos se houver mais de um
                classes += ' has-event'; // Adiciona classe para estilização se necessário
            }
            
            calendarBody.insertAdjacentHTML('beforeend', 
                `<div class="${classes}" data-date="${dateStr}" ${tooltipText ? `data-tooltip="${tooltipText}"` : ''}>
                    ${day}${pinsHTML}
                </div>`
            );
        }
        
        // Inicializa os tooltips após o calendário ser renderizado
        initTooltips();
    }

    function renderEventList(date) {
        const month = date.getMonth();
        const year = date.getFullYear();
        const eventsThisMonth = events.filter(e => {
            if (!e.date) return false;
            const eventDate = new Date(e.date);
            return eventDate.getUTCMonth() === month && eventDate.getUTCFullYear() === year;
        });

        eventsListContainer.innerHTML = '';
        if (eventsThisMonth.length === 0) {
            eventsListContainer.innerHTML = `<div class="no-events-placeholder"><i class='bx bx-calendar-x'></i><span>Nenhum evento neste mês.</span></div>`;
            return;
        }

        eventsThisMonth.sort((a, b) => new Date(a.date) - new Date(b.date));
        eventsThisMonth.forEach(event => {
            const eventDate = new Date(event.date);
            const day = eventDate.getUTCDate();
            const monthShort = eventDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
            const eventHTML = `<div class="event-item" data-id="${event.id}" data-title="${event.title}"><div class="event-date"><div class="day">${day}</div><div class="month">${monthShort}</div></div><div class="event-details"><h4>${event.title}</h4><p>Tipo: ${event.type}</p></div></div>`;
            eventsListContainer.insertAdjacentHTML('beforeend', eventHTML);
        });
    }
    
    function openModal(dateStr = null, eventData = null) {
        eventForm.reset();
        deleteEventBtn.style.display = 'none';
        
        const eventDateInput = document.getElementById('event-date');
        const today = new Date().toISOString().split('T')[0];
        eventDateInput.min = today;

        if (eventData) {
            modalTitle.textContent = "Editar Evento";
            document.getElementById('event-id').value = eventData.id;
            document.getElementById('event-title').value = eventData.title;
            const eventDate = eventData.date.split('T')[0];
            eventDateInput.value = eventDate;
            document.getElementById('event-type').value = eventData.type;
            deleteEventBtn.style.display = 'block';
            
            if (eventDate < today) {
                eventDateInput.min = eventDate;
            }
        } else {
            modalTitle.textContent = "Adicionar Evento";
            document.getElementById('event-id').value = '';
            const defaultDate = (dateStr && dateStr < today) ? today : (dateStr || today);
            eventDateInput.value = defaultDate;
        }
        modal.classList.remove('hidden');
    }
    
    const showConfirmationModal = (title, text) => {
        return new Promise((resolve) => {
            const confirmModal = document.getElementById('confirmation-modal');
            const modalTitle = confirmModal.querySelector('.modal-title');
            const modalText = confirmModal.querySelector('#modal-text');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            modalTitle.textContent = title;
            modalText.textContent = text;
            confirmModal.classList.remove('hidden');

            const handleConfirm = () => {
                confirmModal.classList.add('hidden');
                resolve(true);
            };
            const handleCancel = () => {
                confirmModal.classList.add('hidden');
                resolve(false);
            };

            confirmBtn.onclick = handleConfirm;
            cancelBtn.onclick = handleCancel;
        });
    };

    const closeModal = () => modal.classList.add('hidden');

    async function handleFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('event-id').value;
        const eventData = { 
            id: id || undefined,
            title: document.getElementById('event-title').value, 
            date: document.getElementById('event-date').value, 
            type: document.getElementById('event-type').value 
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;

        try {
            const response = await fetch(url, { 
                method: method, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(eventData) 
            });
            if (response.ok) {
                closeModal();
                fetchEvents();
                showToast(`Evento ${id ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || `Falha ao ${id ? 'atualizar' : 'salvar'} evento.`);
            }
        } catch (error) { 
            showToast(error.message, 'error');
        }
    }
    
    async function handleDeleteEvent() {
        const id = document.getElementById('event-id').value;
        if (!id) return;
        
        const eventTitle = document.getElementById('event-title').value;
        const confirmed = await showConfirmationModal('Apagar Evento', `Tem certeza que deseja apagar o evento "${eventTitle}"?`);

        if (confirmed) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    closeModal();
                    fetchEvents();
                    showToast("Evento apagado com sucesso.", 'success');
                } else {
                    throw new Error("Falha ao apagar o evento.");
                }
            } catch (error) { 
                showToast(error.message, 'error');
            }
        }
    }

    // --- EVENT LISTENERS ---
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); renderEventList(currentDate); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); renderEventList(currentDate); });
    calendarBody.addEventListener('click', (e) => { const cell = e.target.closest('.day-cell'); if (cell && !cell.classList.contains('other-month')) openModal(cell.dataset.date); });
    eventsListContainer.addEventListener('click', (e) => { const item = e.target.closest('.event-item'); if (item) openModal(null, events.find(ev => ev.id == item.dataset.id)); });
    addEventSidebarBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    eventForm.addEventListener('submit', handleFormSubmit);
    deleteEventBtn.addEventListener('click', handleDeleteEvent);

    fetchEvents();
});