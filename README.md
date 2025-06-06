# 🎓 SIGAA Bot com Webhook GitHub Actions

Sistema automatizado para monitorar atividades acadêmicas do SIGAA via Telegram, utilizando GitHub Actions para processamento.

## 🚀 Funcionalidades

- ✅ **Monitoramento Automático**: Executa a cada 5 minutos verificando novas atividades
- ✅ **Comando Manual**: `/atividades` para buscar todas as atividades via webhook
- ✅ **Notificações Inteligentes**: Envia apenas atividades novas no modo automático
- ✅ **GitHub Actions**: Processamento na nuvem sem necessidade de servidor próprio
- ✅ Login automático no SIGAA
- ✅ Exibição organizada por disciplina
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

## 📁 Arquivos do Projeto

### Scripts Principais
- `monitor.js` - Monitoramento automático (detecta apenas novas atividades)
- `get-all-activities.js` - Busca todas as atividades (para comando manual)
- `webhook-server.js` - Servidor webhook para comandos Telegram
- `telegram-bot.js` - Bot local (alternativa ao webhook)

### Workflows GitHub Actions
- `.github/workflows/monitor-sigaa.yml` - Executa a cada 5 minutos
- `.github/workflows/get-all-activities.yml` - Executado via webhook/comando

## ⚙️ Configuração do Webhook

### 1. GitHub Token
Para o webhook funcionar, você precisa de um GitHub Personal Access Token:

1. Vá em: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione as permissões:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. Copie o token gerado

### 2. GitHub Secrets Atualizados
Configure no repositório GitHub em **Settings → Secrets and variables → Actions**:

```
SIGAA_USERNAME=seu_usuario_sigaa
SIGAA_PASSWORD=sua_senha_sigaa
TELEGRAM_BOT_TOKEN=8005667257:AAFtMKaa2fP-hDJA5Sw6dIQzoqijSIulKDg
TELEGRAM_CHAT_ID=6678734128
GITHUB_TOKEN=seu_github_personal_access_token
```

### 3. Teste do Novo Workflow
O novo workflow `get-all-activities.yml` pode ser testado:

1. Vá em: https://github.com/arthur-madureira/sigaa-assist/actions
2. Clique em "Get All Activities"
3. Clique em "Run workflow"
4. Preencha:
   - `telegram_chat_id`: 6678734128
   - `send_all`: true
5. Execute e verifique se recebe as atividades no Telegram

## 🤖 Comandos Telegram

### Modo Webhook (Recomendado)
Quando você enviar `/atividades` no Telegram:
1. 🤖 Bot webhook recebe o comando
2. 🚀 Dispara o GitHub Actions automaticamente
3. ⚙️ GitHub executa `get-all-activities.js`
4. 📱 Você recebe todas as atividades no Telegram

### Comandos Disponíveis
- `/atividades` - Busca e envia todas as atividades do SIGAA
- `/status` - Verifica se o webhook está funcionando
- `/help` - Lista de comandos disponíveis

## 🔧 Scripts NPM Atualizados

```bash
# Monitoramento automático (apenas novas atividades)
npm run monitor

# Buscar todas as atividades manualmente
npm run get-all

# Executar servidor webhook
npm run webhook

# Bot local (alternativa)
npm run bot
```

## 🌐 Deploy do Webhook (Opcional)

Se quiser usar o comando `/atividades`, você pode fazer deploy do webhook:

### Opção 1: Railway (Gratuito)
1. Crie conta em https://railway.app
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente
4. O Railway fornece uma URL automática

### Opção 2: Heroku
1. Crie conta em https://heroku.com
2. Instale Heroku CLI
3. Deploy:
```bash
git push heroku main
```

### Opção 3: Local (Para testes)
```bash
# Instalar ngrok para tunnel
npm install -g ngrok

# Em um terminal
npm run webhook

# Em outro terminal
ngrok http 3000

# Configure WEBHOOK_URL com a URL do ngrok
```

## 📊 Comparação dos Modos

| Modo | Prós | Contras | Uso |
|------|------|---------|-----|
| **GitHub Actions Automático** | ✅ Sem servidor<br>✅ Apenas novas atividades<br>✅ Executa sozinho | ❌ Não é sob demanda | Monitoramento contínuo |
| **Webhook + GitHub Actions** | ✅ Comando manual<br>✅ Todas as atividades<br>✅ Processamento na nuvem | ❌ Precisa de servidor webhook | Consultas sob demanda |
| **Bot Local** | ✅ Resposta rápida<br>✅ Sem dependências externas | ❌ Precisa estar rodando<br>❌ Consome recursos locais | Desenvolvimento/testes |

## ✅ Status Atual

- ✅ **Monitor automático funcionando** (roda a cada 5 minutos)
- ✅ **Workflow manual criado** (`get-all-activities.yml`)
- ✅ **Scripts webhook prontos** (precisam de deploy)
- ✅ **Bot local funcionando** (alternativa)
