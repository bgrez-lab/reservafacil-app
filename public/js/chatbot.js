document.addEventListener('DOMContentLoaded', () => {
  const sendButton = document.getElementById('enviar');
  if (!sendButton) return;

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
  sendButton.addEventListener('click', async () => {
    const input = document.getElementById('pregunta');
    const pregunta = input.value.trim();
    if (!pregunta) return;

    const chat = document.getElementById('chat');

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

    input.value = '';
    chat.scrollTop = chat.scrollHeight;
  });
});
