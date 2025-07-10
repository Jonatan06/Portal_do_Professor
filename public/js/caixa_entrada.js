document.addEventListener('DOMContentLoaded', () => {

     protectPage(); // Protege a página com auth.js do professor

    let messages = [];
    let activeMessageId = null;

    // Seleção de Elementos do DOM
    const messageListBody = document.getElementById('message-list-body');
    const messageViewContainer = document.getElementById('message-view-container');
    const placeholderContainer = document.getElementById('placeholder-container');
    const subjectEl = document.getElementById('message-subject');
    const senderDetailsEl = document.getElementById('message-sender-details');
    const bodyContentEl = document.getElementById('message-body-content');
    const notificationCountEl = document.getElementById('notification-count');
    const replyTextarea = document.getElementById('reply-textarea');
    const replyBtn = document.getElementById('reply-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const sendReplyBtn = document.getElementById('send-reply-btn');
    const searchInput = document.getElementById('search-input');

    // Funções de Renderização
    const renderMessageList = () => {
        messageListBody.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();

        const filteredMessages = messages.filter(msg => 
            msg.remetente_nome.toLowerCase().includes(searchTerm) ||
            msg.assunto.toLowerCase().includes(searchTerm)
        );

        if (filteredMessages.length === 0) {
            messageListBody.innerHTML = '<p class="empty-list">Nenhuma mensagem encontrada.</p>';
            return;
        }

        filteredMessages.forEach(msg => {
            const item = document.createElement('div');
            item.className = `message-item ${msg.lida ? 'read' : ''} ${msg.id === activeMessageId ? 'active' : ''}`;
            item.dataset.id = msg.id;
            const timeAgo = formatTimeAgo(msg.data_envio);

            item.innerHTML = `
                <div class="message-sender">
                    <div class="sender-avatar" style="background-color: ${stringToColor(msg.remetente_nome)};">${msg.remetente_nome.charAt(0)}</div>
                    <div class="sender-info">
                        <strong>${msg.remetente_nome}</strong>
                        <p>${msg.assunto}</p>
                    </div>
                </div>
                <div class="message-meta">
                    <span class="message-time">${timeAgo}</span>
                    ${!msg.lida ? '<span class="unread-dot"></span>' : ''}
                </div>
            `;
            messageListBody.appendChild(item);
        });
    };
    
    const displayMessage = async (id) => {
        const message = messages.find(msg => msg.id === id);
        if (message) {
            activeMessageId = id;
            const wasUnread = !message.lida;
            message.lida = true;

            placeholderContainer.classList.add('hidden');
            messageViewContainer.classList.remove('hidden');

            subjectEl.textContent = message.assunto;
            senderDetailsEl.innerHTML = `De: <strong>${message.remetente_nome}</strong> <${message.remetente_email}>`;
            bodyContentEl.innerHTML = message.corpo.replace(/\n/g, '<br>');
            
            if (wasUnread) {
                renderMessageList();
                try {
                    await fetch(`/api/mensagens/${id}/read`, { method: 'PUT' });
                } catch(err) { console.error("Falha ao marcar como lida:", err); }
            } else {
                // Apenas atualiza a classe 'active' sem re-renderizar tudo
                document.querySelectorAll('.message-item').forEach(el => el.classList.remove('active'));
                document.querySelector(`.message-item[data-id="${id}"]`)?.classList.add('active');
            }
        } else {
            activeMessageId = null;
            messageViewContainer.classList.add('hidden');
            placeholderContainer.classList.remove('hidden');
        }
    };
    
    const updateNotificationCount = () => {
        const unreadCount = messages.filter(msg => !msg.read).length;
        notificationCountEl.textContent = unreadCount;
        notificationCountEl.style.display = unreadCount > 0 ? 'flex' : 'none';
    };

    // Lógica dos Eventos
    messageListBody.addEventListener('click', (e) => {
        const messageItem = e.target.closest('.message-item');
        if (messageItem) {
            const id = parseInt(messageItem.dataset.id);
            displayMessage(id);
        }
    });
    
    replyBtn.addEventListener('click', () => {
        replyTextarea.focus();
    });

    sendReplyBtn.addEventListener('click', () => {
        if (replyTextarea.value.trim() !== '') {
            alert('Resposta enviada! (Simulação)');
            replyTextarea.value = '';
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (!activeMessageId) return;
        if (confirm('Tem certeza que deseja apagar esta mensagem?')) {
            try {
                await fetch(`/api/mensagens/${activeMessageId}`, { method: 'DELETE' });
                await loadMessages(); // Recarrega a lista do servidor
            } catch (err) {
                alert("Erro ao apagar a mensagem.");
            }
        }
    });

    searchInput.addEventListener('input', renderMessageList);

    // --- Funções Auxiliares (Novas) ---
    function formatTimeAgo(dateString) { /* Adicione uma função para formatar a data, ex: "há 2 horas" */ return new Date(dateString).toLocaleDateString('pt-BR'); }
    function stringToColor(str) { /* Adicione uma função para gerar cor a partir do nome */ let hash=0;for(let i=0;i<str.length;i++){hash=str.charCodeAt(i)+((hash<<5)-hash);}let color='#';for(let i=0;i<3;i++){let value=(hash>>(i*8))&0xFF;color+=('00'+value.toString(16)).substr(-2);}return color; }

    // --- Carga Inicial ---
    async function loadMessages() {
        try {
            const response = await fetch('/api/mensagens');
            if (!response.ok) throw new Error("Falha ao carregar mensagens.");
            messages = await response.json();
            renderMessageList();
            displayMessage(messages.length > 0 ? messages[0].id : null);
        } catch (error) {
            console.error(error);
            messageListBody.innerHTML = `<p class="empty-list error">${error.message}</p>`;
        }
    }
    loadMessages();
});