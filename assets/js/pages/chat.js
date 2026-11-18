/* =========================================================================
   AQUASENSE — Página: Chat de Suporte
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 7. Chat de suporte (`chat.html`) ---
  var chatScroll = document.getElementById("chatScroll");
  var chatInput = document.getElementById("chatInput");
  var chatSend = document.getElementById("chatSend");
  if (chatScroll && chatInput && chatSend) {
    function horaAgora() { return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
    var horaInicial = document.getElementById("horaInicial");
    if (horaInicial) horaInicial.textContent = horaAgora();

    function rolarParaFim() { chatScroll.scrollTop = chatScroll.scrollHeight; }

    function adicionarBolha(texto, tipo) {
      var row = document.createElement("div");
      row.className = "bubble-row " + tipo;
      var bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = texto;
      var time = document.createElement("span");
      time.className = "bubble-time";
      time.textContent = horaAgora();
      row.appendChild(bubble);
      row.appendChild(time);
      chatScroll.appendChild(row);
      rolarParaFim();
    }

    function mostrarDigitando() {
      var row = document.createElement("div");
      row.className = "bubble-row in";
      row.id = "digitando";
      var bubble = document.createElement("div");
      bubble.className = "bubble chat-typing";
      bubble.innerHTML = "<i></i><i></i><i></i>";
      row.appendChild(bubble);
      chatScroll.appendChild(row);
      rolarParaFim();
    }
    function removerDigitando() {
      var d = document.getElementById("digitando");
      if (d) d.remove();
    }

    var RESPOSTAS = {
      planos: "Temos os planos Mensal (R$ 30), Semestral (R$ 150) e Anual (R$ 250) — todos dão acesso ao app completo e ao feedback dos sensores. Quer que eu te leve até a aba Planos?",
      sensor: "Poxa, sinto muito! Confira se o ESP32 está ligado e conectado à energia e ao Wi-Fi. Você também pode acompanhar o status ao vivo na aba Sensores. Se continuar indisponível, registro um chamado para nossa equipe técnica.",
      alerta: "Entendo a preocupação. Vá até a aba Alertas para ver o histórico completo do evento, com data, hora e nível do fluxo no momento. Posso te ajudar a interpretar o que apareceu lá.",
      cancelar: "Você pode trocar ou cancelar seu plano a qualquer momento em Perfil → Conta. Se preferir, posso encaminhar sua solicitação de cancelamento para a equipe agora mesmo.",
      padrao: [
        "Entendi! Já registrei sua mensagem por aqui. Nossa equipe responde em até algumas horas.",
        "Consegue me dar mais um detalhe sobre o que está acontecendo?",
        "Anotado. Enquanto isso, dá uma olhada nas abas Início e Sensores — muita coisa já aparece por lá em tempo real.",
        "Obrigado por avisar! Isso já foi encaminhado para a nossa equipe de suporte."
      ]
    };
    var contadorPadrao = 0;

    function gerarResposta(texto) {
      var t = texto.toLowerCase();
      if (t.indexOf("plano") > -1 || (t.indexOf("assinatura") > -1 && t.indexOf("cancelar") === -1)) return RESPOSTAS.planos;
      if (t.indexOf("cancelar") > -1) return RESPOSTAS.cancelar;
      if (t.indexOf("sensor") > -1 || t.indexOf("esp32") > -1 || t.indexOf("indispon") > -1) return RESPOSTAS.sensor;
      if (t.indexOf("alerta") > -1 || t.indexOf("vazamento") > -1) return RESPOSTAS.alerta;
      var r = RESPOSTAS.padrao[contadorPadrao % RESPOSTAS.padrao.length];
      contadorPadrao++;
      return r;
    }

    function enviarMensagem(texto) {
      texto = texto.trim();
      if (!texto) return;
      adicionarBolha(texto, "out");
      chatInput.value = "";
      chatSend.disabled = true;
      mostrarDigitando();
      setTimeout(function () {
        removerDigitando();
        adicionarBolha(gerarResposta(texto), "in");
      }, 900 + Math.random() * 500);
    }

    chatInput.addEventListener("input", function () { chatSend.disabled = chatInput.value.trim() === ""; });
    chatInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); enviarMensagem(chatInput.value); } });
    chatSend.addEventListener("click", function () { enviarMensagem(chatInput.value); });

    [].forEach.call(document.querySelectorAll(".chat-quick button"), function (b) {
      b.addEventListener("click", function () { enviarMensagem(b.dataset.msg); });
    });
  }

});
