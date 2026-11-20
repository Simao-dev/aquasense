💧 AquaSense — Monitoramento Hídrico Inteligente e Detecção de Anomalias (IoT)

O AquaSense é uma solução de Internet das Coisas (IoT) de baixo custo desenvolvida no âmbito da disciplina de Projeto Integrador: Cidades Inteligentes e IoT (Cursos de Sistemas de Informação / Análise e Desenvolvimento de Sistemas). O projeto visa monitorar o consumo residencial de água em tempo real, identificar vazamentos ocultos por meio de balanço hídrico e promover o uso consciente da água.

🎯 Alinhamento com os Objetivos de Desenvolvimento Sustentável (ODS)

ODS 6 (Água Potável e Saneamento): Aumentar a eficiência no uso da água, reduzir perdas hídricas e evitar danos estruturais por vazamentos.

ODS 12 (Consumo e Produção Responsáveis): Promover a conscientização sobre o consumo sustentável de recursos naturais através da visibilidade de dados em tempo real.

⚙️ Arquitetura Física e Funcionamento do Protótipo

O protótipo físico opera com base no princípio de balanço hídrico diferencial (comparação entre o volume de água que entra e o volume que sai de um trecho da tubulação):

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


Como funciona a lógica de detecção:

Conexão Central (Microcontrolador): O Arduino é conectado diretamente ao computador (via cabo USB/Serial) para alimentação e transmissão de dados de telemetria para a aplicação.

Infraestrutura Cabeada (Keystones & Ethernet): Os sensores de fluxo de água são conectados utilizando cabos Ethernet, que se encaixam em módulos Keystone (RJ45) interligados às portas de leitura do Arduino. Essa abordagem garante modularidade, organização e facilidade de manutenção física.

Regra de Divergência:

Sensor de Entrada: Mede o fluxo principal de água que abastece o sistema/residência.

Sensor de Saída: Mede o fluxo nos pontos de consumo/saída.

Detecção de Anomalia: Caso o fluxo de saída seja menor que o de entrada (considerando a margem de tolerância de calibração), o sistema identifica uma divergência hídrica (perda no percurso), caracterizando um possível vazamento ou anomalia, e dispara um alerta imediato no aplicativo AquaSense.

📂 Estrutura do Repositório

A interface web do aplicativo foi desenvolvida em HTML5, CSS3 e JavaScript puro, estruturada nas seguintes telas e módulos:

AQUASENSE/
├── assets/
│   ├── aquasense.css          # Folha de estilos global e componentes visuais
│   └── aquasense.js           # Lógica de interface, simulações e tratamento de dados
├── img/                       # Identidade visual, logotipos, diagramas e assets gráficos
├── index.html                 # Ponto de entrada / Redirecionamento inicial
├── splash.html                # Tela de carregamento (Splash Screen)
├── login.html                 # Autenticação de usuário
├── cadastro.html              # Criação de conta e vínculo residencial
├── inicio.html                # Dashboard principal (visão geral do consumo)
├── inicio-estados.html        # Variações de estado do dashboard (Normal, Alerta, Crítico)
├── consumo.html               # Histórico detalhado e gráficos de consumo hídrico
├── sensores.html              # Status e leitura em tempo real dos sensores (Entrada/Saída)
├── pontos.html                # Mapeamento de pontos de monitoramento na residência
├── ponto-detalhe.html         # Detalhamento individual de um ponto monitorado
├── alertas.html               # Central de notificações de divergência e vazamentos
├── ocorrencia.html            # Registro e acompanhamento de anomalias detectadas
├── residencia.html            # Configurações do imóvel e parâmetros de calibração
├── planos.html                # Planos de assinatura e funcionalidades (Modelo de Negócio)
├── perfil.html                # Configurações de conta do usuário
├── chat.html                  # Canal de suporte e assistente virtual
├── design-system.html         # Guia de estilos, tipografia e paleta de cores
├── figma-handoff.html         # Documentação visual de componentes de UI
├── user-flow.html             # Fluxograma de navegação do usuário
├── DESIGN-HANDOFF.md          # Especificações técnicas de design
├── DESIGN-MANIFEST.json       # Manifesto de tokens e ativos visuais
├── LICENSE                    # Licença do projeto
└── README.md                  # Documentação principal do repositório


🚀 Como Executar o Projeto

1. Hardware (Protótipo Físico)

Conecte os cabos Ethernet dos Sensores de Entrada e Saída nos respectivos módulos Keystone ligados ao Arduino.

Conecte o Arduino a uma porta USB do computador.

Certifique-se de que o firmware de leitura dos pulsos de fluxo esteja carregado na placa e transmitindo os dados pela porta Serial.

2. Aplicação Web (Dashboard AquaSense)

Como o front-end é construído com tecnologias web nativas (HTML/CSS/JS), não há necessidade de instalação de dependências pesadas:

Clone este repositório:

git clone <url-do-seu-repositorio>


Acesse a pasta AQUASENSE e abra o arquivo index.html ou inicio.html diretamente no navegador (ou utilize uma extensão como o Live Server no VS Code para melhor experiência).

🛠️ Tecnologias Utilizadas

Hardware & IoT: Arduino, Sensores de Fluxo de Água, Conectores Keystone RJ45, Cabos Ethernet.

Front-end: HTML5, CSS3, JavaScript.

Design & Prototipação: Figma, Design System próprio.

Gestão Ágil: Metodologia Scrum (Product Backlog, Sprints, Dailies e Kanban).

📄 Licença

Consulte o arquivo LICENSE para mais detalhes sobre os termos de uso deste projeto.