document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/api/eventos";
  const calendarBody = document.getElementById("calendar-body");
  const monthYearDisplay = document.getElementById("month-year-display");
  const prevMonthBtn = document.getElementById("prev-month-btn");
  const nextMonthBtn = document.getElementById("next-month-btn");
  const eventsListContainer = document.getElementById("events-list-container");
  const modal = document.getElementById("event-modal");
  const closeModalBtn = modal.querySelector(".close-modal-btn");
  const addEventSidebarBtn = document.getElementById("add-event-sidebar-btn");
  const eventForm = document.getElementById("event-form");
  const modalTitle = document.getElementById("modal-title");
  const deleteEventBtn = document.getElementById("delete-event-btn");

  const eventTitleInput = document.getElementById("event-title");
  const eventObservationInput = document.getElementById("event-observation");
  const titleCharCounter = document.getElementById("title-char-counter");
  const observationCharCounter = document.getElementById(
    "observation-char-counter"
  );
  const eventDateInput = document.getElementById("event-date");
  const eventTimeInput = document.getElementById("event-time");
  const TITLE_MAX_LENGTH = 20;
  const OBSERVATION_MAX_LENGTH = 30;

  let currentDate = new Date();
  let events = [];

  function showLimitTooltip(element, message) {
    if (document.querySelector(`.limit-tooltip[data-for="${element.id}"]`))
      return;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip tooltip-bottom show limit-tooltip";
    tooltip.textContent = message;
    tooltip.dataset.for = element.id;
    document.body.appendChild(tooltip);

    const elRect = element.getBoundingClientRect();
    tooltip.style.left = `${elRect.left + window.scrollX}px`;
    tooltip.style.top = `${elRect.bottom + window.scrollY + 5}px`;

    setTimeout(() => {
      tooltip.classList.remove("show");
      tooltip.addEventListener("transitionend", () => {
        if (tooltip.parentElement) tooltip.remove();
      });
    }, 2500);
  }

  async function fetchEvents() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Falha ao carregar eventos da API.");
      events = await response.json();
      renderCalendar(currentDate);
      renderEventList(currentDate);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      showToast("Não foi possível carregar os eventos da agenda.", "error");
    }
  }

  function renderCalendar(date) {
    if (!calendarBody || !monthYearDisplay) return;

    calendarBody.innerHTML = "";
    const year = date.getFullYear();
    const month = date.getMonth();
    monthYearDisplay.textContent = `${date.toLocaleString("pt-BR", {
      month: "long",
    })} de ${year}`;
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split("T")[0];

    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarBody.insertAdjacentHTML(
        "beforeend",
        '<div class="day-cell other-month"></div>'
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split("T")[0];
      let classes = "day-cell";
      if (dateStr === todayStr) classes += " today";

      const eventsOfTheDay = events.filter(
        (e) => e.date && e.date.startsWith(dateStr)
      );
      let pinsHTML = "";
      let tooltipText = "";

      // --- LÓGICA ATUALIZADA PARA MÚLTIPLOS PINS ---
      if (eventsOfTheDay.length > 0) {
        // Pega no máximo os 3 primeiros eventos para exibir os pins
        const pinsToDisplay = eventsOfTheDay
          .slice(0, 3)
          .map(
            (event) =>
              `<i class='bx bxs-pin pin-icon' style="color: ${event.cor};"></i>`
          )
          .join("");

        pinsHTML = `<div class="pin-container">${pinsToDisplay}</div>`;

        tooltipText = eventsOfTheDay.map((e) => e.title).join(" | ");
        classes += " has-event";
      }
      // --- FIM DA LÓGICA ATUALIZADA ---

      // if (eventsOfTheDay.length > 0) {
      //     const eventCount = eventsOfTheDay.length;
      //     // Cria o HTML para a "badge" com o número de eventos
      //     pinsHTML = `<div class="event-counter">${eventCount}</div>`;

      //     // A funcionalidade de tooltip e a classe 'has-event' continuam úteis
      //     tooltipText = eventsOfTheDay.map(e => e.title).join(' | ');
      //     classes += ' has-event';
      // }

      calendarBody.insertAdjacentHTML(
        "beforeend",
        `<div class="${classes}" data-date="${dateStr}" ${
          tooltipText ? `data-tooltip="${tooltipText}"` : ""
        }>
                    ${day}${pinsHTML}
                </div>`
      );
    }

    initTooltips();
  }

  function renderEventList(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    const eventsThisMonth = events.filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date + "T12:00:00");
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });

    eventsListContainer.innerHTML = "";
    if (eventsThisMonth.length === 0) {
      eventsListContainer.innerHTML = `<div class="no-events-placeholder"><i class='bx bx-calendar-x'></i><span>Nenhum evento neste mês.</span></div>`;
      return;
    }

    eventsThisMonth.sort((a, b) => new Date(a.date) - new Date(b.date));
    eventsThisMonth.forEach((event) => {
      const eventDate = new Date(event.date + "T12:00:00");
      const day = eventDate.getDate();
      const monthShort = eventDate
        .toLocaleString("pt-BR", { month: "short" })
        .toUpperCase()
        .replace(".", "");

      const formattedDate = eventDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      let tooltipLines = [event.title];
      tooltipLines.push(`Data: ${formattedDate}`);
      if (event.time) {
        tooltipLines.push(`Horário: ${event.time}`);
      }
      if (event.observacao) {
        tooltipLines.push(`Obs: ${event.observacao}`);
      }
      const tooltipContent = tooltipLines.join("\n");

      const eventHTML = `
                <div class="event-item" 
                     data-id="${event.id}" 
                     data-title="${event.title}" 
                     style="--event-color: ${event.cor};"
                     data-custom-tooltip 
                     data-tooltip-color="${event.cor}"
                     data-tooltip-content="${tooltipContent}">
                    <div class="event-date">
                        <div class="day">${day}</div>
                        <div class="month">${monthShort}</div>
                    </div>
                    <div class="event-details">
                        <h4>${event.title}</h4>
                        <p>Tipo: ${event.type}</p>
                    </div>
                </div>`;
      eventsListContainer.insertAdjacentHTML("beforeend", eventHTML);
    });
    initCustomTooltips();
  }

  function openModal(dateStr = null, eventData = null) {
    eventForm.reset();
    deleteEventBtn.style.display = "none";

    const today = new Date().toISOString().split("T")[0];
    eventDateInput.min = today;

    if (eventData) {
      modalTitle.textContent = "Editar Evento";
      document.getElementById("event-id").value = eventData.id;
      eventTitleInput.value = eventData.title;
      const eventDate = eventData.date.split("T")[0];
      eventDateInput.value = eventDate;
      eventTimeInput.value = eventData.time || "";
      document.getElementById("event-type").value = eventData.type;
      deleteEventBtn.style.display = "block";

      eventObservationInput.value = eventData.observacao || "";
      const colorRadio = document.querySelector(
        `input[name="event_color"][value="${eventData.cor}"]`
      );
      if (colorRadio) colorRadio.checked = true;
      else
        document.querySelector(
          'input[name="event_color"][value="#0d6efd"]'
        ).checked = true;

      if (eventDate < today) eventDateInput.min = eventDate;
    } else {
      modalTitle.textContent = "Adicionar Evento";
      document.getElementById("event-id").value = "";
      eventObservationInput.value = "";
      eventTimeInput.value = "";
      document.querySelector(
        'input[name="event_color"][value="#0d6efd"]'
      ).checked = true;
      const defaultDate = dateStr && dateStr < today ? today : dateStr || today;
      eventDateInput.value = defaultDate;
    }

    titleCharCounter.textContent = `${eventTitleInput.value.length}/${TITLE_MAX_LENGTH}`;
    observationCharCounter.textContent = `${eventObservationInput.value.length}/${OBSERVATION_MAX_LENGTH}`;

    modal.classList.add("active"); // ANTES: modal.classList.remove('hidden');
  }

//   const showConfirmationModal = (title, text) => {
//     return new Promise((resolve) => {
//       const confirmModal = document.getElementById("confirmation-modal");
//       const modalTitle = confirmModal.querySelector(".modal-title");
//       const modalText = confirmModal.querySelector("#modal-text");
//       const confirmBtn = document.getElementById("modal-confirm-btn");
//       const cancelBtn = document.getElementById("modal-cancel-btn");

//       modalTitle.textContent = title;
//       modalText.textContent = text;
//       confirmModal.classList.remove("hidden");

//       const handleConfirm = () => {
//         confirmModal.classList.add("hidden");
//         resolve(true);
//       };
//       const handleCancel = () => {
//         confirmModal.classList.add("hidden");
//         resolve(false);
//       };

//       confirmBtn.onclick = handleConfirm;
//       cancelBtn.onclick = handleCancel;
//     });
//   };

const showConfirmationModal = (title, text) => {
    return new Promise((resolve) => {
      const confirmModal = document.getElementById("confirmation-modal");
      const modalTitle = confirmModal.querySelector(".modal-title");
      const modalText = confirmModal.querySelector("#modal-text");
      const confirmBtn = document.getElementById("modal-confirm-btn");
      const cancelBtn = document.getElementById("modal-cancel-btn");

      // Define o conteúdo do modal
      modalTitle.textContent = title;
      modalText.textContent = text;
      
      // Mostra o modal adicionando a classe 'active'
      confirmModal.classList.add("active");

      // Funções para lidar com os cliques
      const handleConfirm = () => {
        confirmModal.classList.remove("active");
        resolve(true);
      };
      const handleCancel = () => {
        confirmModal.classList.remove("active");
        resolve(false);
      };

      // Adiciona os eventos aos botões
      confirmBtn.onclick = handleConfirm;
      cancelBtn.onclick = handleCancel;
    });
  };    

  const closeModal = () => modal.classList.remove("active"); // ANTES: modal.classList.add('hidden');

  async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("event-id").value;

    const eventData = {
      title: eventTitleInput.value,
      date: eventDateInput.value,
      time: eventTimeInput.value,
      type: document.getElementById("event-type").value,
      observacao: eventObservationInput.value.trim(),
      cor: document.querySelector('input[name="event_color"]:checked').value,
    };
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (response.ok) {
        closeModal();
        fetchEvents();
        showToast(
          `Evento ${id ? "atualizado" : "salvo"} com sucesso!`,
          "success"
        );
      } else {
        const error = await response.json();
        throw new Error(
          error.message || `Falha ao ${id ? "atualizar" : "salvar"} evento.`
        );
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function handleDeleteEvent() {
    const id = document.getElementById("event-id").value;
    if (!id) return;

    const eventTitle = eventTitleInput.value;
    const confirmed = await showConfirmationModal(
      "Apagar Evento",
      `Tem certeza que deseja apagar o evento "${eventTitle}"?`
    );

    if (confirmed) {
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (response.ok) {
          closeModal();
          fetchEvents();
          showToast("Evento apagado com sucesso.", "success");
        } else {
          throw new Error("Falha ao apagar o evento.");
        }
      } catch (error) {
        showToast(error.message, "error");
      }
    }
  }

  // --- EVENT LISTENERS ---
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
    renderEventList(currentDate);
  });
  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
    renderEventList(currentDate);
  });
  calendarBody.addEventListener("click", (e) => {
    const cell = e.target.closest(".day-cell");
    if (cell && !cell.classList.contains("other-month"))
      openModal(cell.dataset.date);
  });
  eventsListContainer.addEventListener("click", (e) => {
    const item = e.target.closest(".event-item");
    if (item)
      openModal(
        null,
        events.find((ev) => ev.id == item.dataset.id)
      );
  });
  addEventSidebarBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  eventForm.addEventListener("submit", handleFormSubmit);
  deleteEventBtn.addEventListener("click", handleDeleteEvent);

  eventTitleInput.addEventListener("input", () => {
    const len = eventTitleInput.value.length;
    titleCharCounter.textContent = `${len}/${TITLE_MAX_LENGTH}`;
    if (len >= TITLE_MAX_LENGTH) {
      showLimitTooltip(
        eventTitleInput,
        `Limite de ${TITLE_MAX_LENGTH} caracteres atingido.`
      );
    }
  });

  eventObservationInput.addEventListener("input", () => {
    const len = eventObservationInput.value.length;
    observationCharCounter.textContent = `${len}/${OBSERVATION_MAX_LENGTH}`;
    if (len >= OBSERVATION_MAX_LENGTH) {
      showLimitTooltip(
        eventObservationInput,
        `Limite de ${OBSERVATION_MAX_LENGTH} caracteres atingido.`
      );
    }
  });

  // --- NOVO: Adiciona evento de clique para abrir os seletores de data/hora ---
  eventDateInput.addEventListener("click", () => {
    try {
      eventDateInput.showPicker();
    } catch (e) {
      console.error("Navegador não suporta showPicker() para data.", e);
    }
  });

  eventTimeInput.addEventListener("click", () => {
    try {
      eventTimeInput.showPicker();
    } catch (e) {
      console.error("Navegador não suporta showPicker() para hora.", e);
    }
  });
  // --- FIM DO NOVO CÓDIGO ---

  fetchEvents();
});
