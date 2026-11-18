/* =========================================================================
   AQUASENSE — Página: Início (Dashboard MQTT)
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
  // --- 1. Início (Dashboard MQTT) ---
  var hero = document.getElementById("hero");
  if (hero && typeof mqtt !== "undefined") {
    (function () {
      const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
      const TOPICS = {
        entrada: "wokwi/agua/entrada",
        saida: "wokwi/agua/saida",
        nivel: "wokwi/agua/nivel",
        vazamento: "wokwi/agua/vazamento"
      };

      const ESTADOS = {
        normal:   { heroClass: "s-ok",   dot: "#4ADE80", pill: "Fluxo normal",
                    titulo: "Tudo certo por aqui",
                    desc: "Nenhuma anormalidade identificada na sua residência." },
        leve:     { heroClass: "s-low",  dot: "#FDE68A", pill: "Possível vazamento leve",
                    titulo: "Fluxo um pouco acima do padrão",
                    desc: "Pequena diferença entre a água que entra e a que sai." },
        moderado: { heroClass: "s-mid",  dot: "#FDBA74", pill: "Possível vazamento moderado",
                    titulo: "Fluxo fora do padrão",
                    desc: "Diferença perceptível entre entrada e saída de água." },
        critico:  { heroClass: "s-high", dot: "#FCA5A5", pill: "Possível vazamento crítico",
                    titulo: "Verifique sua residência",
                    desc: "Diferença grave entre entrada e saída — ação recomendada." }
      };

      const CLASSE_POR_NIVEL = { normal: "ok", leve: "low", moderado: "mid", critico: "high" };
      const LABEL_POR_CLASSE = { ok: "Normal", low: "Leve", mid: "Moderado", high: "Crítico", off: "Offline" };
      const ICONE_EVENTO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
      const ICONE_OFFLINE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 2l20 20"/><path d="M5 12.5a10 10 0 0 1 4-2.4"/><path d="M8.8 16.3a5 5 0 0 1 6.4 0"/><path d="M12 20h.01"/><path d="M15.5 10.6a10 10 0 0 1 3.5 1.9"/></svg>';
      const ICONE_PONTO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z"/></svg>';

      const heroDot = document.getElementById("heroDot");
      const heroPillText = document.getElementById("heroPillText");
      const heroTime = document.getElementById("heroTime");
      const heroTitle = document.getElementById("heroTitle");
      const heroDesc = document.getElementById("heroDesc");
      const statEntrada = document.getElementById("statEntrada");
      const statSaida = document.getElementById("statSaida");
      const statDivergencia = document.getElementById("statDivergencia");
      const bannerOffline = document.getElementById("bannerOffline");
      const bannerOfflineText = document.getElementById("bannerOfflineText");
      const resFuncionando = document.getElementById("resFuncionando");
      const resAtencao = document.getElementById("resAtencao");
      const resIndisponivel = document.getElementById("resIndisponivel");
      const pontoIcon = document.getElementById("pontoIcon");
      const pontoSub = document.getElementById("pontoSub");
      const pontoValor = document.getElementById("pontoValor");
      const listaUltimoEvento = document.getElementById("listaUltimoEvento");

      let ultimaEntrada = 0;
      let ultimaSaida = 0;
      let nivelAtual = null;
      let nivelAnterior = null;
      let offlineAnterior = null;
      const MAX_EVENTOS_HOME = 6;

      function registrarEvento(classe, texto, tipo) {
        aqPushEvento({ classe: classe, tipo: tipo || "vazamento", texto: texto, ts: Date.now() });
        renderizarEventos();
      }

      function renderizarEventos() {
        if (!listaUltimoEvento) return;
        const eventos = aqLoadEventos().slice(0, MAX_EVENTOS_HOME);
        if (eventos.length === 0) {
          listaUltimoEvento.innerHTML = '<div class="empty" style="padding:20px 8px"><p style="margin:0;font-size:12.5px;color:var(--muted)">Nenhum evento registrado nesta sessão.</p></div>';
          return;
        }
        listaUltimoEvento.innerHTML = eventos.map(ev => `
          <div class="row">
            <span class="ic ${ev.classe}">${ev.classe === "off" ? ICONE_OFFLINE : ICONE_EVENTO}</span>
            <span class="txt"><b>${ev.texto}</b><span>${new Date(ev.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></span>
            <span class="end"><span class="badge ${ev.classe}">${LABEL_POR_CLASSE[ev.classe]}</span></span>
          </div>`).join("");
      }
      renderizarEventos();

      function atualizarResumoSensor(offline) {
        if (!resFuncionando) return;
        let funcionando = 0, atencao = 0, indisponivel = 0;
        if (offline) {
          indisponivel = 1;
        } else if (nivelAtual === "normal" || nivelAtual === null) {
          funcionando = 1;
        } else {
          atencao = 1;
        }
        resFuncionando.textContent = funcionando;
        resFuncionando.style.color = funcionando ? "var(--ok-ink)" : "var(--muted)";
        resAtencao.textContent = atencao;
        resAtencao.style.color = atencao ? "var(--low-ink)" : "var(--muted)";
        resIndisponivel.textContent = indisponivel;
        resIndisponivel.style.color = indisponivel ? "var(--off-ink)" : "var(--muted)";
      }

      function atualizarPontoConsumo(offline) {
        if (!pontoIcon) return;
        const classe = offline ? "off" : (CLASSE_POR_NIVEL[nivelAtual] || "ok");
        pontoIcon.className = "ic " + classe;
        pontoIcon.innerHTML = ICONE_PONTO;
        if (offline) {
          pontoSub.textContent = ultimaMensagemEm ? "Sem dados recentes" : "Aguardando dados…";
          pontoValor.textContent = "-- L/min";
          pontoValor.className = "val is-off";
        } else {
          pontoSub.textContent = "Atualizado agora";
          pontoValor.textContent = (ultimaEntrada - ultimaSaida).toFixed(1) + " L/min";
          pontoValor.className = "val " + classe;
        }
      }

      const LIMITE_OFFLINE_MS = 8000;
      const inicioPagina = Date.now();
      let ultimaMensagemEm = 0;

      function verificarOffline() {
        const referencia = ultimaMensagemEm || inicioPagina;
        const semDados = Date.now() - referencia > LIMITE_OFFLINE_MS;

        if (bannerOfflineText && bannerOffline) {
          if (semDados) {
            const segundos = Math.round((Date.now() - referencia) / 1000);
            bannerOfflineText.textContent = ultimaMensagemEm
              ? `Nenhuma leitura recebida do ESP32 há ${segundos}s.`
              : `Aguardando a primeira leitura do ESP32 (${segundos}s)…`;
            bannerOffline.style.display = "flex";
          } else {
            bannerOffline.style.display = "none";
          }
        }

        if (ultimaMensagemEm) {
          if (offlineAnterior === false && semDados === true) {
            registrarEvento("off", "Sensor ESP32 ficou indisponível", "sensor");
          } else if (offlineAnterior === true && semDados === false) {
            registrarEvento(CLASSE_POR_NIVEL[nivelAtual] || "ok", "Sensor ESP32 voltou a enviar dados", "sensor");
          }
          offlineAnterior = semDados;
        }

        atualizarResumoSensor(semDados);
        atualizarPontoConsumo(semDados);
      }
      setInterval(verificarOffline, 2000);

      function aplicarEstado(nivel) {
        const info = ESTADOS[nivel] || ESTADOS.normal;
        if (hero) hero.className = "hero " + info.heroClass;
        if (heroDot) heroDot.style.background = info.dot;
        if (heroPillText) heroPillText.textContent = info.pill;
        if (heroTitle) heroTitle.textContent = info.titulo;
        if (heroDesc) heroDesc.textContent = info.desc;

        nivelAtual = nivel;

        if (nivelAnterior !== null && nivelAnterior !== nivel) {
          const classe = CLASSE_POR_NIVEL[nivel] || "ok";
          registrarEvento(classe, "Status mudou para: " + (ESTADOS[nivel] || ESTADOS.normal).pill, "vazamento");
        }
        nivelAnterior = nivel;

        atualizarResumoSensor(false);
        atualizarPontoConsumo(false);
      }

      function atualizarStats() {
        if (statEntrada) statEntrada.textContent = ultimaEntrada.toFixed(1) + " L/min";
        if (statSaida) statSaida.textContent = ultimaSaida.toFixed(1) + " L/min";
        if (statDivergencia) statDivergencia.textContent = (ultimaEntrada - ultimaSaida).toFixed(1) + " L/min";
        atualizarPontoConsumo(false);
      }

      const client = mqtt.connect(BROKER_URL, {
        clientId: "aquasense-inicio-" + Math.random().toString(16).slice(2)
      });

      client.on("connect", () => {
        if (heroTime) heroTime.textContent = "ao vivo";
        client.subscribe(Object.values(TOPICS));
      });

      client.on("reconnect", () => { if (heroTime) heroTime.textContent = "reconectando…"; });
      client.on("close", () => { if (heroTime) heroTime.textContent = "desconectado"; });

      client.on("message", (topic, payload) => {
        const texto = payload.toString().trim();
        ultimaMensagemEm = Date.now();

        if (topic === TOPICS.entrada) {
          ultimaEntrada = parseFloat(texto) || 0;
          atualizarStats();
        }
        if (topic === TOPICS.saida) {
          ultimaSaida = parseFloat(texto) || 0;
          atualizarStats();
        }
        if (topic === TOPICS.nivel) {
          aplicarEstado(texto.toLowerCase());
        }
      });
    })();
  }

});
