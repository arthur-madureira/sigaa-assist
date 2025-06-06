# 🤖 Guia Rápido: Configuração do Bot Telegram

## Passo 1: Criar o Bot

1. Abra o Telegram e procure por **@BotFather**
2. Digite `/newbot`
3. Escolha um **nome** para o bot (ex: "Minhas Atividades SIGAA")
4. Escolha um **username** terminado em "bot" (ex: "minhas_atividades_sigaa_bot")
5. **Copie o token** que aparece (formato: `123456789:ABCdefGHIjklMNOpqrs`)

## Passo 2: Obter seu Chat ID

### Método 1 (mais fácil):
1. Envie `/start` para seu bot no Telegram
2. Acesse no navegador: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
3. Procure por `"chat":{"id":` e copie o número

### Método 2 (alternativo):
1. Procure por **@userinfobot** no Telegram
2. Envie `/start` para ele
3. Ele mostrará seu Chat ID

## Passo 3: Configurar o .env

Edite o arquivo `.env`:
```env
SIGAA_USERNAME=seu_usuario_sigaa
SIGAA_PASSWORD=sua_senha_sigaa
HEADLESS=true

TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## Passo 4: Testar

```bash
# Iniciar o bot
npm run bot

# Se aparecer "🤖 Bot do Telegram iniciado!", está funcionando!
```

## Passo 5: Usar

No Telegram, envie para seu bot:
- `/start` - Para ver a ajuda
- `/atividades` - Para buscar suas atividades do SIGAA

## 🔧 Exemplo Completo

**Token do bot:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
**Chat ID:** `987654321`

**Arquivo .env:**
```env
SIGAA_USERNAME=joao.silva
SIGAA_PASSWORD=minhasenha123
HEADLESS=true
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

## ✅ Teste de Funcionamento

1. Execute: `npm run bot`
2. No Telegram, envie `/start` para o bot
3. Envie `/atividades` 
4. O bot deve responder com suas atividades do SIGAA!

## 🛠️ Comandos Úteis

- `npm run bot` - Bot em produção (headless)
- `npm run bot:dev` - Bot com navegador visível (para debug)
- `Ctrl+C` - Parar o bot

## 📱 Mensagem de Exemplo

Quando funcionar, você receberá algo assim:

```
📚 SUAS ATIVIDADES ACADÊMICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎓 2025.1
─────────────────────────────

📋 PROBABILIDADE
📅 Data: 30/05/2025
📌 Avaliação: 2ª Avaliação

✏️ BANCO DE DADOS
📅 Data: 31/05/2025 12:00
📌 Tarefa:
🎯 Laboratório 2 (2,5 na U2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total: 5 atividades
```
