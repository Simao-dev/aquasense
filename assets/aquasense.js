/* =========================================================================
   AQUASENSE — Script principal do aplicativo
   Centraliza o armazenamento local, badges, conexões MQTT e interatividades.
   ========================================================================= */

// --- Armazenamento compartilhado de eventos (localStorage) ---
var AQ_EVENTOS_KEY = "aquasense:eventos";
var AQ_LASTREAD_KEY = "aquasense:alertas_lastread";

function aqLoadEventos() {
  try {
    var v = JSON.parse(localStorage.getItem(AQ_EVENTOS_KEY));
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

function aqSaveEventos(list) {
  try {
    localStorage.setItem(AQ_EVENTOS_KEY, JSON.stringify(list.slice(0, 40)));
  } catch (e) {}
}

function aqPushEvento(ev) {
  var list = aqLoadEventos();
  list.unshift(ev);
  aqSaveEventos(list);
  aqAtualizarBadgeTabbar();
}

function aqUnreadCount() {
  var lastread = parseInt(localStorage.getItem(AQ_LASTREAD_KEY) || "0", 10);
  return aqLoadEventos().filter(function (e) {
    return e.ts > lastread;
  }).length;
}

function aqAtualizarBadgeTabbar() {
  var tab = document.querySelector('.tabbar a[href="alertas.html"]');
  if (!tab) return;
  var n = aqUnreadCount();
  var nb = tab.querySelector(".nb");
  if (n > 0) {
    if (!nb) {
      nb = document.createElement("span");
      nb.className = "nb";
      tab.insertBefore(nb, tab.firstChild);
    }
    nb.textContent = n > 9 ? "9+" : String(n);
  } else if (nb) {
    nb.remove();
  }
}

// Inicialização das telas após carregamento do DOM
document.addEventListener("DOMContentLoaded", function () {
  aqAtualizarBadgeTabbar();

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

  // --- 2. Alertas (`alertas.html`) ---
  var wrapAlertas = document.getElementById("gruposAlertas");
  if (wrapAlertas) {
    (function () {
      var ICONE_VAZAMENTO = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
      var ICONE_OFFLINE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 2l20 20"/><path d="M5 12.5a10 10 0 0 1 4-2.4"/><path d="M8.8 16.3a5 5 0 0 1 6.4 0"/><path d="M12 20h.01"/><path d="M15.5 10.6a10 10 0 0 1 3.5 1.9"/></svg>';
      var ICONE_VOLTOU = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
      var LABEL_POR_CLASSE = { ok: "Normal", low: "Leve", mid: "Moderado", high: "Crítico", off: "Indisponível" };
      var HREF_POR_TIPO = { vazamento: "ocorrencia.html", sensor: "sensores.html" };

      function iconePara(ev) {
        if (ev.classe === "off") return ICONE_OFFLINE;
        if (ev.tipo === "sensor") return ICONE_VOLTOU;
        return ICONE_VAZAMENTO;
      }
      function grupoPara(ts) {
        var d = new Date(ts); d.setHours(0, 0, 0, 0);
        var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        var ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
        if (d.getTime() === hoje.getTime()) return "hoje";
        if (d.getTime() === ontem.getTime()) return "ontem";
        return "antes";
      }
      function subPara(ts) {
        var d = new Date(ts);
        var hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        var g = grupoPara(ts);
        if (g === "hoje") return "hoje, " + hora;
        if (g === "ontem") return "ontem, " + hora;
        var dia = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2);
        return dia + ", " + hora;
      }

      var lastread = parseInt(localStorage.getItem(AQ_LASTREAD_KEY) || "0", 10);
      var TITULO_GRUPO = { hoje: "Hoje", ontem: "Ontem", antes: "Anteriores" };

      function montarAlertas() {
        var eventos = aqLoadEventos();
        wrapAlertas.innerHTML = "";
        if (eventos.length === 0) return;

        var grupos = { hoje: [], ontem: [], antes: [] };
        eventos.forEach(function (ev) { grupos[grupoPara(ev.ts)].push(ev); });

        ["hoje", "ontem", "antes"].forEach(function (g) {
          if (grupos[g].length === 0) return;
          var secHead = document.createElement("div");
          secHead.className = "sec-head"; secHead.dataset.grp = g;
          secHead.innerHTML = "<h2>" + TITULO_GRUPO[g] + "</h2>";
          var list = document.createElement("div");
          list.className = "list"; list.dataset.grp = g;
          list.innerHTML = grupos[g].map(function (ev) {
            var href = HREF_POR_TIPO[ev.tipo] || "#";
            var unread = ev.ts > lastread ? " unread" : "";
            return '<a class="row' + unread + '" href="' + href + '" data-c="' + ev.tipo + '">' +
              '<span class="ic ' + ev.classe + '">' + iconePara(ev) + '</span>' +
              '<span class="txt"><b>' + ev.texto + '</b><span>' + subPara(ev.ts) + '</span></span>' +
              '<span class="end"><span class="badge ' + ev.classe + '"><span class="dot"></span>' + LABEL_POR_CLASSE[ev.classe] + '</span>' +
              '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></span></a>';
          }).join("");
          wrapAlertas.appendChild(secHead);
          wrapAlertas.appendChild(list);
        });
      }
      montarAlertas();

      function marcarTodosLidos() {
        localStorage.setItem(AQ_LASTREAD_KEY, String(Date.now()));
        document.querySelectorAll(".row.unread").forEach(function (r) { r.classList.remove("unread"); });
        aqAtualizarBadgeTabbar();
      }

      var btnMarcarLidos = document.getElementById("btnMarcarLidos");
      if (btnMarcarLidos) {
        btnMarcarLidos.addEventListener("click", function () {
          marcarTodosLidos();
          btnMarcarLidos.textContent = "Todos lidos";
          btnMarcarLidos.disabled = true;
        });
      }

      var chipsAlertas = [].slice.call(document.querySelectorAll(".chip"));
      chipsAlertas.forEach(function (c) {
        c.addEventListener("click", function () {
          chipsAlertas.forEach(function (o) { o.setAttribute("aria-pressed", String(o === c)); });
          var f = c.dataset.f;
          document.querySelectorAll(".row[data-c]").forEach(function (r) {
            var on = f === "todos" || r.dataset.c === f;
            r.style.display = on ? "flex" : "none";
          });
          ["hoje", "ontem", "antes"].forEach(function (g) {
            var l = document.querySelector('.list[data-grp="' + g + '"]');
            var h = document.querySelector('.sec-head[data-grp="' + g + '"]');
            if (!l || !h) return;
            var vis = [].slice.call(l.querySelectorAll('.row[data-c]')).filter(function (r) { return r.style.display !== "none"; }).length;
            l.style.display = vis > 0 ? "block" : "none";
            h.style.display = vis > 0 ? "flex" : "none";
          });
        });
      });

      marcarTodosLidos();
    })();
  }

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

  // --- 4. Residência (`residencia.html`) ---
  var ndEntrada = document.querySelector('.nd[data-p="entrada"]');
  if (ndEntrada && typeof mqtt !== "undefined") {
    (function () {
      const BROKER_URL = "ws://broker.hivemq.com:8000/mqtt";
      const TOPICS = { entrada: "wokwi/agua/entrada", saida: "wokwi/agua/saida", nivel: "wokwi/agua/nivel" };
      const CLASSE_POR_NIVEL = { normal: "ok", leve: "low", moderado: "mid", critico: "high" };
      const LABEL_POR_CLASSE = { ok: "Normal", low: "Atenção leve", mid: "Fora do padrão", high: "Crítico" };

      const ndEsp32 = document.querySelector('.nd[data-p="esp32"]');
      const ndSaida = document.querySelector('.nd[data-p="saida"]');
      const ndEntradaSub = document.getElementById("ndEntradaSub");
      const ndEsp32Sub = document.getElementById("ndEsp32Sub");
      const ndSaidaSub = document.getElementById("ndSaidaSub");
      const ndEntradaVal = document.getElementById("ndEntradaVal");
      const ndEsp32Val = document.getElementById("ndEsp32Val");
      const ndSaidaVal = document.getElementById("ndSaidaVal");
      const bannerSemLeitura = document.getElementById("bannerSemLeitura");
      const bannerSemLeituraText = document.getElementById("bannerSemLeituraText");

      let ultimaEntrada = 0, ultimaSaida = 0, nivelAtual = null, ultimaMensagemEm = 0;
      const inicioPagina = Date.now();
      const LIMITE_OFFLINE_MS = 8000;

      function INFO() {
        const offline = estaOffline();
        const classe = offline ? "off" : (CLASSE_POR_NIVEL[nivelAtual] || "ok");
        return {
          entrada: ["Entrada de água", offline ? "Sem leitura no momento — aguardando o sensor ESP32 voltar a publicar dados." : "Tudo que entra na residência passa por aqui: " + ultimaEntrada.toFixed(1) + " L/min agora."],
          esp32: ["Sensor ESP32", offline ? "O sensor não responde no momento. Nenhuma leitura está sendo considerada." : "Status atual: " + LABEL_POR_CLASSE[classe] + ". Compara entrada e saída em tempo real."],
          saida: ["Saída de água", offline ? "Sem leitura no momento — aguardando o sensor ESP32 voltar a publicar dados." : "Tudo que sai da residência passa por aqui: " + ultimaSaida.toFixed(1) + " L/min agora."]
        };
      }

      function estaOffline() {
        const referencia = ultimaMensagemEm || inicioPagina;
        return Date.now() - referencia > LIMITE_OFFLINE_MS;
      }

      function atualizarNos() {
        const offline = estaOffline();
        const classe = offline ? "off" : (CLASSE_POR_NIVEL[nivelAtual] || "ok");
        [ndEntrada, ndEsp32, ndSaida].forEach(function (n) { if (n) n.className = "nd " + classe; });
        const subTxt = offline ? "sem dados" : "ao vivo";
        if (ndEntradaSub) ndEntradaSub.textContent = subTxt;
        if (ndEsp32Sub) ndEsp32Sub.textContent = offline ? "sem dados" : LABEL_POR_CLASSE[classe];
        if (ndSaidaSub) ndSaidaSub.textContent = subTxt;
        if (ndEntradaVal) ndEntradaVal.textContent = offline ? "-- L/min" : ultimaEntrada.toFixed(1) + " L/min";
        if (ndEsp32Val) ndEsp32Val.textContent = offline ? "-- L/min" : (ultimaEntrada - ultimaSaida).toFixed(1) + " L/min";
        if (ndSaidaVal) ndSaidaVal.textContent = offline ? "-- L/min" : ultimaSaida.toFixed(1) + " L/min";
        if (bannerSemLeitura) bannerSemLeitura.style.display = offline ? "flex" : "none";
        if (bannerSemLeituraText) {
          bannerSemLeituraText.textContent = ultimaMensagemEm
            ? "O sensor ESP32 não está enviando dados. A comparação entre entrada e saída fica pausada até a leitura voltar."
            : "Aguardando a primeira leitura do sensor ESP32…";
        }
        atualizarPainelSelecionado();
      }
      setInterval(atualizarNos, 2000);

      var nds = [].slice.call(document.querySelectorAll(".nd"));
      function atualizarPainelSelecionado() {
        var sel = nds.filter(function (n) { return n.getAttribute("aria-pressed") === "true"; })[0];
        var cta = document.getElementById("sel-cta");
        var selEb = document.getElementById("sel-eb");
        var selTxt = document.getElementById("sel-txt");
        if (!sel) {
          if (selEb) selEb.textContent = "Selecione um ponto";
          if (selTxt) selTxt.textContent = "Toque em Entrada, ESP32 ou Saída para ver a leitura de cada trecho ao vivo.";
          if (cta) cta.style.display = "none";
          return;
        }
        var d = INFO()[sel.dataset.p];
        if (d) {
          if (selEb) selEb.textContent = d[0];
          if (selTxt) selTxt.textContent = d[1];
          if (cta) cta.style.display = sel.dataset.p === "esp32" ? "inline-flex" : "none";
        }
      }
      nds.forEach(function (n) { n.addEventListener("click", function () {
        var on = n.getAttribute("aria-pressed") !== "true";
        nds.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        n.setAttribute("aria-pressed", String(on));
        atualizarPainelSelecionado();
      }); });

      const client = mqtt.connect(BROKER_URL, { clientId: "aquasense-residencia-" + Math.random().toString(16).slice(2) });
      client.on("connect", function () { client.subscribe(Object.values(TOPICS)); });
      client.on("message", function (topic, payload) {
        ultimaMensagemEm = Date.now();
        const texto = payload.toString().trim();
        if (topic === TOPICS.entrada) { ultimaEntrada = parseFloat(texto) || 0; atualizarNos(); }
        if (topic === TOPICS.saida) { ultimaSaida = parseFloat(texto) || 0; atualizarNos(); }
        if (topic === TOPICS.nivel) { nivelAtual = texto.toLowerCase(); atualizarNos(); }
      });

      atualizarNos();
    })();
  }

  // --- 5. Cadastro (`cadastro.html`) ---
  var step1 = document.getElementById('step1');
  var step2 = document.getElementById('step2');
  var btnNext = document.getElementById('next');
  if (step1 && step2 && btnNext) {
    btnNext.addEventListener('click', function () {
      step1.hidden = true; step2.hidden = false;
      var s2Pill = document.getElementById('s2');
      if (s2Pill) s2Pill.classList.add('on');
      var scrollEl = document.querySelector('.scroll');
      if (scrollEl) scrollEl.scrollTop = 0;
      var stepsEl = document.querySelector('.steps');
      if (stepsEl) stepsEl.setAttribute('aria-label', 'Etapa 2 de 2');
    });
    var btnBack2 = document.getElementById('back2');
    if (btnBack2) {
      btnBack2.addEventListener('click', function () {
        step2.hidden = true; step1.hidden = false;
        var s2Pill = document.getElementById('s2');
        if (s2Pill) s2Pill.classList.remove('on');
        var stepsEl = document.querySelector('.steps');
        if (stepsEl) stepsEl.setAttribute('aria-label', 'Etapa 1 de 2');
      });
    }
    var btnCreate = document.getElementById('create');
    if (btnCreate) {
      btnCreate.addEventListener('click', function () { location.href = 'inicio.html'; });
    }
  }

  // --- 6. Login (`login.html`) ---
  var formLogin = document.getElementById('f');
  var inputUser = document.getElementById('user');
  var inputPwd = document.getElementById('pwd');
  if (formLogin && inputUser && inputPwd) {
    var togglePwd = document.getElementById('toggle-pwd');
    if (togglePwd) {
      togglePwd.addEventListener('click', function () {
        var on = inputPwd.type === 'password'; inputPwd.type = on ? 'text' : 'password';
        this.setAttribute('aria-pressed', String(on));
        this.setAttribute('aria-label', on ? 'Ocultar senha' : 'Mostrar senha');
      });
    }
    function markError(el, box, bad) {
      el.classList.toggle('is-error', bad);
      if (box) box.hidden = !bad;
    }
    formLogin.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bu = !inputUser.value.trim(), bp = inputPwd.value.length < 8;
      markError(inputUser, document.getElementById('e-user'), bu);
      markError(inputPwd, document.getElementById('e-pwd'), bp);
      if (bu) { inputUser.focus(); return; }
      if (bp) { inputPwd.focus(); return; }
      location.href = 'inicio.html';
    });
    [inputUser, inputPwd].forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('is-error');
        var b = document.getElementById(el === inputUser ? 'e-user' : 'e-pwd');
        if (b) b.hidden = true;
      });
    });
  }

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

  // --- 8. Consumo (`consumo.html`) ---
  var boxConsumoChart = document.getElementById('c-chart');
  if (boxConsumoChart) {
    (function () {
      var D = {
        d: { l: 'Hoje', t: '142', c: '5% abaixo', cl: 'ok', v: [8, 6, 4, 12, 26, 31, 22, 18, 9, 4, 2, 0], x: ['0h', '4h', '8h', '12h', '16h', '20h'], k: ['142<i>L</i>', '31<i>L · 19h</i>', '0', '0<i>L</i>'], hl: [] },
        w: { l: 'Últimos 7 dias', t: '1.024', c: '8% abaixo', cl: 'ok', v: [118, 142, 131, 214, 126, 158, 135], x: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], k: ['1.024<i>L</i>', '214<i>L · Qua</i>', '2', '31<i>L</i>'], hl: { 3: 'mid', 5: 'low' } },
        m: { l: 'Últimos 30 dias', t: '3.180', c: '3% acima', cl: 'low', v: [742, 806, 689, 943], x: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'], k: ['3.180<i>L</i>', '943<i>L · Sem 4</i>', '5', '86<i>L</i>'], hl: { 3: 'mid' } }
      };
      var xb = document.getElementById('c-chart-x');
      [].forEach.call(document.querySelectorAll('.seg button'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(document.querySelectorAll('.seg button'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          var d = D[b.dataset.p], m = Math.max.apply(null, d.v);
          var cLabel = document.getElementById('c-label');
          var cTotal = document.getElementById('c-total');
          var cmp = document.getElementById('c-cmp');
          if (cLabel) cLabel.textContent = d.l;
          if (cTotal) cTotal.innerHTML = d.t + '<span class="u">L</span>';
          if (cmp) { cmp.className = 'badge ' + d.cl; cmp.innerHTML = '<span class="dot"></span>' + d.c; }
          boxConsumoChart.innerHTML = d.v.map(function (v, i) {
            var c = (d.hl && d.hl[i]) || '';
            return '<div class="b ' + c + '" style="height:' + Math.max(6, Math.round(v / m * 100)) + '%"><i style="height:100%"></i></div>';
          }).join('');
          if (xb) xb.innerHTML = d.x.map(function (s) { return '<span>' + s + '</span>'; }).join('');
          ['k1', 'k2', 'k3', 'k4'].forEach(function (id, i) {
            var el = document.getElementById(id);
            if (el) el.innerHTML = d.k[i];
          });
        });
      });
    })();
  }

  // --- 9. Detalhe da Ocorrência (`ocorrencia.html`) ---
  var btnOpenCheck = document.getElementById('open-check');
  var dlgOcorrencia = document.getElementById('dlg');
  if (btnOpenCheck && dlgOcorrencia) {
    function openDlg() { dlgOcorrencia.classList.add('is-open'); var inp = dlgOcorrencia.querySelector('input'); if (inp) inp.focus(); }
    function closeDlg() { dlgOcorrencia.classList.remove('is-open'); btnOpenCheck.focus(); }
    btnOpenCheck.addEventListener('click', openDlg);
    var dlgCancel = document.getElementById('dlg-cancel');
    if (dlgCancel) dlgCancel.addEventListener('click', closeDlg);
    var dlgOk = document.getElementById('dlg-ok');
    if (dlgOk) {
      dlgOk.addEventListener('click', function () {
        closeDlg();
        var h = document.querySelector('[data-od-id="cabecalho-ocorrencia"]');
        if (h) {
          h.style.background = 'var(--ok-bg)'; h.style.borderColor = '#A9DFC0';
          var b1 = h.querySelector('.badge'); if (b1) { b1.className = 'badge ok'; b1.lastChild.textContent = 'Resolvido'; }
          var big = h.querySelector('.big'); if (big) big.style.color = 'var(--ok-ink)';
          var bigU = h.querySelector('.big .u'); if (bigU) bigU.style.color = 'var(--ok-ink)';
          var pEl = h.querySelector('p'); if (pEl) pEl.style.color = 'var(--ok-ink)';
        }
        var st = document.querySelectorAll('.dl .badge');
        if (st.length) { var b = st[st.length - 1]; b.className = 'badge ok'; b.lastChild.textContent = 'Resolvido'; }
        btnOpenCheck.textContent = 'Ocorrência verificada';
        btnOpenCheck.disabled = true;
      });
    }
    dlgOcorrencia.addEventListener('click', function (e) { if (e.target === dlgOcorrencia) closeDlg(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dlgOcorrencia.classList.contains('is-open')) closeDlg(); });
    var btnIgnore = document.getElementById('ignore');
    if (btnIgnore) btnIgnore.addEventListener('click', function () { location.href = 'alertas.html'; });
  }

  // --- 10. Perfil (`perfil.html`) ---
  var btnLogout = document.getElementById('logout');
  if (btnLogout) {
    [].forEach.call(document.querySelectorAll('.toggle'), function (t) {
      t.addEventListener('click', function () {
        t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true'));
      });
    });
    var dlgLogout = document.getElementById('dlg');
    if (dlgLogout) {
      btnLogout.addEventListener('click', function () { dlgLogout.classList.add('is-open'); var c = document.getElementById('dlg-cancel'); if (c) c.focus(); });
      var cCancel = document.getElementById('dlg-cancel');
      if (cCancel) cCancel.addEventListener('click', function () { dlgLogout.classList.remove('is-open'); btnLogout.focus(); });
      var cOk = document.getElementById('dlg-ok');
      if (cOk) cOk.addEventListener('click', function () { location.href = 'login.html'; });
      dlgLogout.addEventListener('click', function (e) { if (e.target === dlgLogout) dlgLogout.classList.remove('is-open'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dlgLogout.classList.remove('is-open'); });
    }
  }

  // --- 11. Planos e pagamento ilustrativo (`planos.html`) ---
  var btnAssinar = document.getElementById("btnAssinar");
  if (btnAssinar) {
    (function () {
      var PLANOS = {
        mensal:    { nome: "Mensal",    preco: "R$ 30,00",  periodo: "cobrado mensalmente" },
        semestral: { nome: "Semestral", preco: "R$ 150,00", periodo: "cobrado a cada 6 meses" },
        anual:     { nome: "Anual",     preco: "R$ 250,00", periodo: "cobrado anualmente" }
      };
      var PAG = { credito: "Cartão de crédito", debito: "Cartão de débito", pix: "Pix", boleto: "Boleto" };
      var PIX = "00020126360014BR.GOV.BCB.PIX0114AQUASENSE-DEMO5204000053039865802BR5909AQUASENSE6007BRASIL6304ABCD";
      var BOLETO = "00190.00009 01234.567890 12345.678901 1 00000000025000";
      // Plano e forma de pagamento já começam escolhidos: basta conferir e assinar.
      var plano = "anual", pag = "credito";
      var $ = function (id) { return document.getElementById(id); };
      var cards = [].slice.call(document.querySelectorAll(".plan-card"));
      var opts = [].slice.call(document.querySelectorAll(".pay-opt"));
      var panel = $("payPanel");

      function marcar(lista, atual, chave) {
        lista.forEach(function (el) { el.setAttribute("aria-pressed", el.dataset[chave] === atual ? "true" : "false"); });
      }

      // QR Code ilustrativo (grade 21x21 com os 3 marcadores de canto; não é um QR válido)
      function qr() {
        var seed = 7, r = "", x, y, i, dx, dy, on, cant = [[0, 0], [14, 0], [0, 14]];
        for (y = 0; y < 21; y++) for (x = 0; x < 21; x++) {
          on = null;
          for (i = 0; i < 3; i++) {
            dx = x - cant[i][0]; dy = y - cant[i][1];
            if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) on = dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
          }
          if (on === null) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; on = ((seed >> 16) % 2) === 0; }
          if (on) r += '<rect x="' + x * 6 + '" y="' + y * 6 + '" width="6" height="6"/>';
        }
        return '<svg class="qr" viewBox="0 0 126 126" fill="#0F2A3D" role="img" aria-label="QR Code ilustrativo">' + r + '</svg>';
      }

      function copiar(codigo) {
        return '<div class="pay-code">' + codigo + '</div><button class="btn btn-outline" type="button" data-copiar="' + codigo + '" style="margin-top:10px;min-height:44px">Copiar código</button>';
      }

      function desenharPainel() {
        if (pag === "credito" || pag === "debito") {
          panel.innerHTML =
            '<div class="field"><label for="cNum">Número do cartão</label><input class="input" id="cNum" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19"></div>' +
            '<div class="field"><label for="cNome">Nome impresso no cartão</label><input class="input" id="cNome" autocomplete="cc-name" placeholder="MARIA DA SILVA"></div>' +
            '<div class="pay-row"><div class="field"><label for="cVal">Validade</label><input class="input" id="cVal" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"></div>' +
            '<div class="field"><label for="cCvv">CVV</label><input class="input" id="cCvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div></div>' +
            '<p class="pay-err" id="payErr" role="alert"></p>';
        } else if (pag === "pix") {
          panel.innerHTML = '<p class="pay-note">Escaneie o QR Code no app do seu banco ou use o Pix copia e cola.</p>' + qr() + copiar(PIX);
        } else {
          panel.innerHTML = '<p class="pay-note">O boleto é gerado ao confirmar e vence em 3 dias. Depois de pago, a compensação leva até 2 dias úteis.</p>' + copiar(BOLETO);
        }
      }

      function resumo() {
        var p = PLANOS[plano];
        $("sumPlano").textContent = p.nome + " · " + p.periodo;
        $("sumPag").textContent = PAG[pag];
        $("sumTotal").textContent = p.preco;
        btnAssinar.textContent = "Assinar plano " + p.nome + " · " + p.preco;
      }

      cards.forEach(function (c) {
        c.addEventListener("click", function () { plano = c.dataset.plano; marcar(cards, plano, "plano"); resumo(); });
      });
      opts.forEach(function (o) {
        o.addEventListener("click", function () { pag = o.dataset.pay; marcar(opts, pag, "pay"); desenharPainel(); resumo(); });
      });

      // Máscaras dos campos do cartão
      panel.addEventListener("input", function (e) {
        var t = e.target, v = t.value.replace(/\D/g, "");
        if (t.id === "cNum") t.value = v.slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
        else if (t.id === "cVal") t.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2, 4) : v;
        else if (t.id === "cCvv") t.value = v.slice(0, 4);
      });

      // Botão "Copiar código" (Pix e boleto)
      panel.addEventListener("click", function (e) {
        var b = e.target.closest("[data-copiar]");
        if (!b) return;
        try { navigator.clipboard.writeText(b.dataset.copiar); } catch (err) { /* sem permissão: segue ilustrativo */ }
        b.textContent = "Copiado!";
        setTimeout(function () { b.textContent = "Copiar código"; }, 1600);
      });

      // Validação simples dos dados do cartão (só para a demonstração)
      function validar() {
        if (pag !== "credito" && pag !== "debito") return true;
        var err = $("payErr"), msg = "";
        if ($("cNum").value.replace(/\D/g, "").length < 13) msg = "Confira o número do cartão.";
        else if ($("cNome").value.trim().length < 3) msg = "Informe o nome impresso no cartão.";
        else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test($("cVal").value)) msg = "Validade inválida. Use MM/AA.";
        else if ($("cCvv").value.length < 3) msg = "Confira o CVV.";
        err.textContent = msg;
        return !msg;
      }

      var dlgPlano = $("dlgPlano"), dlgOk = $("dlgOk");

      btnAssinar.addEventListener("click", function () {
        if (!validar()) return;
        var p = PLANOS[plano];
        $("dlgPlano-t").textContent = "Confirmar assinatura " + p.nome;
        $("dlgPlano-txt").textContent = "Você está assinando o plano " + p.nome + " por " + p.preco + " (" + p.periodo + ") com " + PAG[pag] + ". Deseja continuar?";
        dlgPlano.classList.add("is-open");
      });

      $("dlgPlano-cancel").addEventListener("click", function () { dlgPlano.classList.remove("is-open"); });

      $("dlgPlano-ok").addEventListener("click", function () {
        dlgPlano.classList.remove("is-open");
        var p = PLANOS[plano], pendente = pag === "pix" || pag === "boleto";
        $("dlgOk-t").textContent = pendente ? "Pedido criado!" : "Plano ativado!";
        $("dlgOk-txt").textContent = pendente
          ? "Assim que o pagamento via " + PAG[pag] + " for confirmado, seu plano " + p.nome + " (" + p.preco + ") será ativado."
          : "Seu plano " + p.nome + " (" + p.preco + ") está ativo. Você já tem acesso ao app, ao feedback dos sensores e a todos os recursos da plataforma.";
        dlgOk.classList.add("is-open");
      });

      $("dlgOk-fechar").addEventListener("click", function () { dlgOk.classList.remove("is-open"); });

      [dlgPlano, dlgOk].forEach(function (d) {
        d.addEventListener("click", function (e) { if (e.target === d) d.classList.remove("is-open"); });
      });

      desenharPainel();
      resumo();
    })();
  }

  // --- 12. Detalhe do Ponto (`ponto-detalhe.html`) ---
  var boxPontoDetalhe = document.getElementById('pd-chart');
  if (boxPontoDetalhe) {
    (function () {
      var D = {
        d: { l: 'Hoje', t: '28 L', c: '12% abaixo da média', v: [18, 22, 16, 28, 24, 31, 19, 26, 21, 14, 23, 28], x: ['0h', '4h', '8h', '12h', '16h', '20h'] },
        w: { l: 'Últimos 7 dias', t: '196 L', c: '4% acima da média', v: [24, 31, 27, 38, 29, 26, 21], x: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] },
        m: { l: 'Últimos 30 dias', t: '742 L', c: 'na média', v: [92, 118, 104, 131, 126, 88, 83], x: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'] }
      };
      var xb = document.getElementById('pd-chart-x');
      [].forEach.call(document.querySelectorAll('.seg button'), function (b) {
        b.addEventListener('click', function () {
          [].forEach.call(document.querySelectorAll('.seg button'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          var d = D[b.dataset.p], m = Math.max.apply(null, d.v);
          var pLabel = document.getElementById('p-label');
          var pTotal = document.getElementById('p-total');
          var pCmp = document.getElementById('p-cmp');
          if (pLabel) pLabel.textContent = d.l;
          if (pTotal) pTotal.textContent = d.t;
          if (pCmp) pCmp.textContent = d.c;
          boxPontoDetalhe.innerHTML = d.v.map(function (v) { return '<div class="b" style="height:' + Math.max(6, Math.round(v / m * 100)) + '%"><i style="height:100%"></i></div>'; }).join('');
          if (xb) xb.innerHTML = d.x.map(function (s) { return '<span>' + s + '</span>'; }).join('');
        });
      });
    })();
  }

  // --- 13. Pontos de Consumo (`pontos.html`) ---
  var emptyFilter = document.getElementById('empty-f');
  if (emptyFilter) {
    var chipsPontos = [].slice.call(document.querySelectorAll('.chip'));
    chipsPontos.forEach(function (c) {
      c.addEventListener('click', function () {
        chipsPontos.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
        var f = c.dataset.f, vis = 0;
        [].forEach.call(document.querySelectorAll('.row[data-g]'), function (r) {
          var on = (f === 'todos' || r.dataset.g === f); r.hidden = !on; if (on) vis++;
        });
        emptyFilter.hidden = vis > 0;
      });
    });
  }
});
