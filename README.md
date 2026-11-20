# 💧 AquaSense — Monitoramento Hídrico Inteligente com IoT

O **AquaSense** é uma solução de Internet das Coisas (IoT) de baixo custo desenvolvida para monitorar o consumo residencial de água em tempo real, identificar anomalias (como vazamentos) por meio da análise de divergência de fluxo e promover o uso consciente dos recursos hídricos.

Projeto desenvolvido no âmbito da disciplina de **Projeto Integrador: Cidades Inteligentes e IoT** (Cursos de Sistemas de Informação / Análise e Desenvolvimento de Sistemas).

---

## 🎯 Objetivos e Alinhamento com as ODS

* **Monitoramento em Tempo Real:** Medição contínua da passagem de água nos pontos de entrada e saída da rede hidráulica.
* **Detecção de Anomalias:** Identificação automática de perdas hídricas e vazamentos ocultos.
* **Sustentabilidade (ONU):**
  * **ODS 6 (Água Potável e Saneamento):** Redução do desperdício e aumento da eficiência no uso da água.
  * **ODS 12 (Consumo e Produção Responsáveis):** Conscientização do cidadão sobre o impacto do consumo diário.

---

## ⚙️ Arquitetura do Protótipo Físico

O sistema físico opera através da comparação diferencial entre dois pontos de medição hidráulica:

```text
[Sensores de Fluxo (Entrada / Saída)] 
        │
        ▼ (Cabos Ethernet)
[Módulos Keystone] 
        │
        ▼
[Microcontrolador Arduino] 
        │
        ▼ (Conexão Serial / USB)
[Computador / Aplicação Web AquaSense]