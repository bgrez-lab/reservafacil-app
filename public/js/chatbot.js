document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('enviar');
  const contactButton = document.getElementById('contactar');
  const input = document.getElementById('pregunta');
  const chat = document.getElementById('chat');
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

  if (!sendButton || !input || !chat) return;

  async function sendMessage(pregunta) {
    const userMsg = document.createElement('div');
    userMsg.className = 'alert alert-secondary';
    userMsg.textContent = pregunta;
    chat.appendChild(userMsg);

    try {
      const res = await fetch('/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ pregunta })
      });
      const data = await res.json();

      const botMsg = document.createElement('div');
      botMsg.className = 'alert alert-info';
      botMsg.textContent = data.respuesta || 'Sin respuesta';
      chat.appendChild(botMsg);
    } catch (error) {
      const botMsg = document.createElement('div');
      botMsg.className = 'alert alert-danger';
      botMsg.textContent = 'Error al consultar el chatbot.';
      chat.appendChild(botMsg);
    }

    chat.scrollTop = chat.scrollHeight;
  }

  sendButton.addEventListener('click', () => {
    const pregunta = input.value.trim();
    if (!pregunta) return;
    sendMessage(pregunta);
    input.value = '';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendButton.click();
    }
  });

  document.querySelectorAll('.categoria-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const categoria = button.dataset.categoria;
      sendMessage(`Quiero información sobre ${categoria}`);
    });
  });

  if (contactButton) {
    contactButton.addEventListener('click', async () => {
      try {
        const res = await fetch('/chatbot/contact-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ resumen: 'Solicitud desde chatbot' })
        });
        const data = await res.json();
        const botMsg = document.createElement('div');
        botMsg.className = 'alert alert-success';
        botMsg.textContent = data.mensaje || 'Solicitud registrada.';
        chat.appendChild(botMsg);
        chat.scrollTop = chat.scrollHeight;
      } catch (error) {
        const botMsg = document.createElement('div');
        botMsg.className = 'alert alert-danger';
        botMsg.textContent = 'No se pudo registrar la solicitud.';
        chat.appendChild(botMsg);
      }
    });
  }
});
