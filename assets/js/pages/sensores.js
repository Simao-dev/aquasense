/* =========================================================================
   AQUASENSE — Página: Sensores
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 3. Sensores (`sensores.html`) ---
  var diagTimeline = document.getElementById("diagTimeline");
  if (diagTimeline && typeof mqtt !== "undefined") {
    (function () {
      const BROKER_URL = "ws://broker.hivemq.com:8000/mqtt";
      const TOPICS = { entrada: "wokwi/agua/entrada", saida: "wokwi/agua/saida", nivel: "wokwi/agua/nivel" };
      const CLASSE_POR_NIVEL = { normal: "ok", leve: "low", moderado: "mid", critico: "high" };
      const LABEL_POR_CLASSE = { ok: "Normal", low: "Leve", mid: "Moderado", high: "Crítico", off: "Indisponível" };
      const ICONE_PONTO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z"/></svg>';
      const ICONE_OFFLINE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 12h16"/><path d="M8 3v3"/><path d="M16 3v3"/></svg>';

      const syncAt = document.getElementById("sync-at");
      const bannerIndisponivel = document.getElementById("bannerIndisponivel");
      const resFuncionando = document.getElementById("resFuncionando");
      const resAtencao = document.getElementById("resAtencao");
      const resIndisponivel = document.getElementById("resIndisponivel");
      const sensorIcon = document.getElementById("sensorIcon");
      const sensorSub = document.getElementById("sensorSub");
      const sensorBadge = document.getElementById("sensorBadge");
      const sensorBadgeText = document.getElementById("sensorBadgeText");

      let nivelAtual = null;
      let nivelAnterior = null;
      let offlineAnterior = null;
      let ultimaMensagemEm = 0;
      const inicioPagina = Date.now();
      const LIMITE_OFFLINE_MS = 8000;

      function registrarEvento(classe, texto, tipo) {
        aqPushEvento({ classe: classe, tipo: tipo || "sensor", texto: texto, ts: Date.now() });
        renderizarDiagnostico();
      }

      function renderizarDiagnostico() {
        const eventos = aqLoadEventos().slice(0, 6);
        if (eventos.length === 0) {
          diagTimeline.innerHTML = '<div class="ev ok"><b>Aguardando eventos do sensor</b><span>Nenhum evento registrado ainda</span></div>';
          return;
        }
        diagTimeline.innerHTML = eventos.map(ev => `
          <div class="ev ${ev.classe}">
            <b>${ev.texto}</b>
            <span>${new Date(ev.ts).toLocaleDateString("pt-BR")} · ${new Date(ev.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>`).join("");
      }
      renderizarDiagnostico();

      function atualizarSensorRow(offline) {
        const classe = offline ? "off" : (CLASSE_POR_NIVEL[nivelAtual] || "ok");
        if (sensorIcon) {
          sensorIcon.className = "ic " + classe;
          sensorIcon.innerHTML = offline ? ICONE_OFFLINE : ICONE_PONTO;
        }
        if (sensorBadge) sensorBadge.className = "badge " + classe;
        if (sensorBadgeText) sensorBadgeText.textContent = offline ? "Indisponível" : (nivelAtual === "normal" || nivelAtual === null ? "Funcionando" : "Atenção");
        if (sensorSub) {
          sensorSub.textContent = offline
            ? (ultimaMensagemEm ? "Sem dados recentes" : "Aguardando dados…")
            : "Atualizado agora · " + LABEL_POR_CLASSE[classe];
        }

        let funcionando = 0, atencao = 0, indisponivel = 0;
        if (offline) { indisponivel = 1; }
        else if (nivelAtual === "normal" || nivelAtual === null) { funcionando = 1; }
        else { atencao = 1; }

        if (resFuncionando) { resFuncionando.textContent = funcionando; resFuncionando.style.color = funcionando ? "var(--ok-ink)" : "var(--muted)"; }
        if (resAtencao) { resAtencao.textContent = atencao; resAtencao.style.color = atencao ? "var(--low-ink)" : "var(--muted)"; }
        if (resIndisponivel) { resIndisponivel.textContent = indisponivel; resIndisponivel.style.color = indisponivel ? "var(--off-ink)" : "var(--muted)"; }

        if (bannerIndisponivel) bannerIndisponivel.style.display = offline ? "flex" : "none";
      }

      function verificarOffline() {
        const referencia = ultimaMensagemEm || inicioPagina;
        const semDados = Date.now() - referencia > LIMITE_OFFLINE_MS;
        if (ultimaMensagemEm) {
          if (offlineAnterior === false && semDados === true) {
            registrarEvento("off", "Sensor ESP32 ficou indisponível", "sensor");
          } else if (offlineAnterior === true && semDados === false) {
            registrarEvento(CLASSE_POR_NIVEL[nivelAtual] || "ok", "Sensor ESP32 voltou a enviar dados", "sensor");
          }
          offlineAnterior = semDados;
        }
        atualizarSensorRow(semDados);
      }
      setInterval(verificarOffline, 2000);

      const client = mqtt.connect(BROKER_URL, { clientId: "aquasense-sensores-" + Math.random().toString(16).slice(2) });
      client.on("connect", () => { if (syncAt) syncAt.textContent = "ao vivo"; client.subscribe(Object.values(TOPICS)); });
      client.on("reconnect", () => { if (syncAt) syncAt.textContent = "reconectando…"; });
      client.on("close", () => { if (syncAt) syncAt.textContent = "desconectado"; });
      client.on("message", (topic, payload) => {
        ultimaMensagemEm = Date.now();
        if (topic === TOPICS.nivel) {
          const nivel = payload.toString().trim().toLowerCase();
          nivelAtual = nivel;
          if (nivelAnterior !== null && nivelAnterior !== nivel) {
            registrarEvento(CLASSE_POR_NIVEL[nivel] || "ok", "Status mudou para: " + LABEL_POR_CLASSE[CLASSE_POR_NIVEL[nivel] || "ok"], "vazamento");
          }
          nivelAnterior = nivel;
          atualizarSensorRow(false);
        }
      });

      var btnSync = document.getElementById("sync");
      if (btnSync) {
        btnSync.addEventListener("click", function () {
          if (syncAt) syncAt.textContent = "sincronizando…";
          btnSync.disabled = true;
          setTimeout(function () { verificarOffline(); if (syncAt) syncAt.textContent = client.connected ? "ao vivo" : "desconectado"; btnSync.disabled = false; }, 700);
        });
      }
    })();
  }

});
