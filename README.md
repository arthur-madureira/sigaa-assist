# SIGAA Automation + Telegram Bot

Automação para extrair atividades acadêmicas do SIGAA da UFRN com integração ao Telegram.

## 🚀 Funcionalidades

- ✅ Login automático no SIGAA
- ✅ Extração de atividades acadêmicas
- ✅ Exibição organizada por semestre
- ✅ Bot do Telegram para consultas remotas
- ✅ Identificação de atividades urgentes

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm
- Chrome/Chromium instalado no sistema

## 🛠️ Instalação

1. **Clone ou baixe o projeto**
```bash
cd /home/madureira/sigaa-automation
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure suas credenciais**
```bash
cp .env.example .env
nano .env
```

Edite o arquivo `.env` com suas informações:
```env
# Credenciais do SIGAA
SIGAA_USERNAME=seu_usuario_sigaa
SIGAA_PASSWORD=sua_senha_sigaa

# Configurações do navegador
HEADLESS=true

# Configurações do Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=seu_token_do_bot
TELEGRAM_CHAT_ID=seu_chat_id
```

## 🎯 Uso Básico

### Executar script local
```bash
# Modo headless (sem interface gráfica)
npm start

# Modo visível (para debug)
npm run start:visible
```

## 🤖 Configuração do Bot do Telegram

### 1. Criar um Bot no Telegram

1. Abra o Telegram e procure por `@BotFather`
2. Digite `/newbot` e siga as instruções
3. Escolha um nome e username para seu bot
4. Copie o **token** fornecido

### 2. Obter seu Chat ID

1. Envie uma mensagem para seu bot no Telegram
2. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
3. Procure pelo campo `"chat":{"id":` e copie o número

### 3. Configurar o Bot

Edite o arquivo `.env` e adicione:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### 4. Executar o Bot

```bash
# Iniciar bot
npm run bot

# Bot em modo desenvolvimento (visível)
npm run bot:dev
```

## 📱 Comandos do Bot

- `/start` ou `/help` - Mostrar ajuda
- `/atividades` - Buscar suas atividades do SIGAA

## 🔧 Scripts Disponíveis

- `npm start` - Executa o script uma vez
- `npm run start:visible` - Executa com interface gráfica
- `npm run bot` - Inicia o bot do Telegram
- `npm run bot:dev` - Bot em modo desenvolvimento

## 📊 Tipos de Atividade Identificados

- 📋 **Avaliações** - Provas e testes
- ✏️ **Tarefas** - Trabalhos e laboratórios
- ⏰ **Atividades Urgentes** - Com prazo próximo

## 🛡️ Segurança

- ✅ Credenciais em variáveis de ambiente
- ✅ Bot restrito ao seu chat ID
- ✅ Arquivo `.env` ignorado pelo Git

## 🐛 Solução de Problemas

### Erro de dependências do Chrome
```bash
sudo apt update
sudo apt install -y libnss3 libatk-bridge2.0-0t64 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2t64 fonts-liberation libappindicator3-1 libgtk-3-0t64
```

### Bot não responde
1. Verifique se o token está correto
2. Confirme se o chat ID está correto
3. Teste enviar `/start` para o bot

### Erro de login
1. Verifique suas credenciais no arquivo `.env`
2. Teste login manual no SIGAA
3. Execute com `npm run start:visible` para debug

## 📝 Logs

O script exibe logs detalhados durante a execução:
- 🚀 Iniciando automação
- 👤 Preenchendo credenciais
- ✅ Login realizado
- 📋 Extraindo atividades
- 📊 Resultados encontrados
