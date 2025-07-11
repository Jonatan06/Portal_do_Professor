document.addEventListener('DOMContentLoaded', () => {
    protectPage();

    let messages = [];
    let activeMessageId = null;

    // Seleção de Elementos
    const messageListBody = document.getElementById('message-list-body');
    const messageViewContainer = document.getElementById('message-view-container');
    const placeholderContainer = document.getElementById('placeholder-container');
    const subjectEl = document.getElementById('message-subject');
    const senderDetailsEl = document.getElementById('message-sender-details');
    const bodyContentEl = document.getElementById('message-body-content');
    const replyTextarea = document.getElementById('reply-textarea');
    const replyBtn = document.getElementById('reply-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const sendReplyBtn = document.getElementById('send-reply-btn');
    const searchInput = document.getElementById('search-input');
    const logoutButton = document.getElementById('logout-button-inbox');


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

        filteredMessages.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio));

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
            senderDetailsEl.innerHTML = `De: <strong>${message.remetente_nome}</strong> &lt;${message.remetente_email}&gt;`;
            bodyContentEl.innerHTML = message.corpo.replace(/\n/g, '<br>');
            
            // Atualiza a lista visualmente
            document.querySelectorAll('.message-item').forEach(el => {
                el.classList.remove('active');
                if (el.dataset.id == id) {
                    el.classList.add('active');
                    el.classList.add('read');
                    const dot = el.querySelector('.unread-dot');
                    if(dot) dot.style.display = 'none';
                }
            });

            if (wasUnread) {
                try {
                    await fetch(`/api/mensagens/${id}/read`, { method: 'PUT' });
                } catch(err) { console.error("Falha ao marcar como lida:", err); }
            }
        } else {
            activeMessageId = null;
            messageViewContainer.classList.add('hidden');
            placeholderContainer.classList.remove('hidden');
        }
    };
    
    const showConfirmationModal = (title, text) => {
        return new Promise((resolve) => {
            const confirmModal = document.getElementById('confirmation-modal');
            const mTitle = confirmModal.querySelector('.modal-title');
            const mText = confirmModal.querySelector('#modal-text');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            mTitle.textContent = title;
            mText.textContent = text;
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

    // Lógica dos Eventos
    if(logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

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
            showToast('Funcionalidade de resposta ainda não implementada.', 'info');
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (!activeMessageId) return;

        const confirmed = await showConfirmationModal('Apagar Mensagem', 'Tem certeza que deseja apagar esta mensagem permanentemente?');
        
        if (confirmed) {
            try {
                const response = await fetch(`/api/mensagens/${activeMessageId}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error("Falha ao apagar a mensagem no servidor.");
                }
                showToast("Mensagem apagada com sucesso.", 'success');
                await loadMessages();
            } catch (err) {
                showToast(err.message, 'error');
            }
        }
    });

    searchInput.addEventListener('input', renderMessageList);

    // Funções Auxiliares
    function formatTimeAgo(dateString) { return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); }
    function stringToColor(str) { let hash=0;for(let i=0;i<str.length;i++){hash=str.charCodeAt(i)+((hash<<5)-hash);}let color='#';for(let i=0;i<3;i++){let value=(hash>>(i*8))&0xFF;color+=('00'+value.toString(16)).substr(-2);}return color; }

    // Carga Inicial
    async function loadMessages() {
        try {
            const response = await fetch('/api/mensagens');
            if (!response.ok) throw new Error("Falha ao carregar mensagens.");
            messages = await response.json();
            renderMessageList();
            
            const firstMessageId = messages.length > 0 ? messages[0].id : null;
            displayMessage(firstMessageId);

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
            messageListBody.innerHTML = `<p class="empty-list error">${error.message}</p>`;
        }
    }
    
    // ATUALIZADO: Chama a inicialização dos tooltips
    loadMessages();
    initTooltips();
});