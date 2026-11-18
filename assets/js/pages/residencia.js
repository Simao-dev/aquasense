/* =========================================================================
   AQUASENSE — Página: Residência
   ========================================================================= */

document.addEventListener("DOMContentLoaded", function () {
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

});
