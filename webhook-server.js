require('dotenv').config();
const express = require('express');
const { Octokit } = require('@octokit/rest');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());

// Configurações
const config = {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO || 'arthur-madureira/sigaa-assist',
    port: process.env.PORT || 3000,
    webhookUrl: process.env.WEBHOOK_URL
};

// Validar configurações
if (!config.telegramToken || !config.githubToken) {
    console.error('❌ Configure TELEGRAM_BOT_TOKEN e GITHUB_TOKEN nas variáveis de ambiente');
    process.exit(1);
}

const bot = new TelegramBot(config.telegramToken);
const octokit = new Octokit({ auth: config.githubToken });

console.log('🚀 Iniciando webhook server...');

// Endpoint para webhook do Telegram
app.post('/webhook/telegram', async (req, res) => {
    try {
        const update = req.body;
        
        if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;
            const text = message.text;
            
            console.log(`📨 Mensagem recebida: ${text} (Chat: ${chatId})`);
            
            // Verificar se é o chat autorizado
            if (chatId.toString() !== config.telegramChatId) {
                await bot.sendMessage(chatId, '❌ Você não tem permissão para usar este bot.');
                return res.status(200).send('OK');
            }
            
            // Processar comandos
            if (text === '/start' || text === '/help') {
                const helpMessage = `🤖 *Bot SIGAA - Webhook Version*\n\n` +
                    `📋 Comandos disponíveis:\n` +
                    `• /atividades - Buscar todas as atividades do SIGAA\n` +
                    `• /status - Status do sistema\n` +
                    `• /help - Esta ajuda\n\n` +
                    `⚡ As atividades são buscadas via GitHub Actions!`;
                
                await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
                
            } else if (text === '/status') {
                const statusMessage = `✅ *Sistema Online*\n\n` +
                    `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n` +
                    `🤖 Webhook funcionando\n` +
                    `🐙 GitHub Actions disponível`;
                
                await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
                
            } else if (text === '/atividades') {
                // Enviar mensagem de processamento
                await bot.sendMessage(chatId, '🔄 Disparando busca de atividades...\n⏳ Aguarde alguns segundos...');
                
                try {
                    // Disparar workflow do GitHub Actions
                    const [owner, repo] = config.githubRepo.split('/');
                    
                    const response = await octokit.rest.actions.createWorkflowDispatch({
                        owner,
                        repo,
                        workflow_id: 'get-all-activities.yml',
                        ref: 'main',
                        inputs: {
                            telegram_chat_id: chatId.toString(),
                            send_all: 'true'
                        }
                    });
                    
                    console.log('✅ Workflow disparado com sucesso');
                    
                    await bot.sendMessage(chatId, 
                        '🚀 Workflow disparado!\n' +
                        '📱 As atividades serão enviadas em breve...\n' +
                        '⏱️ Tempo estimado: 1-2 minutos'
                    );
                    
                } catch (error) {
                    console.error('❌ Erro ao disparar workflow:', error);
                    
                    let errorMessage = '❌ Erro ao disparar busca de atividades.';
                    
                    if (error.status === 404) {
                        errorMessage += '\n🔍 Workflow não encontrado no repositório.';
                    } else if (error.status === 401) {
                        errorMessage += '\n🔐 Erro de autenticação com GitHub.';
                    } else {
                        errorMessage += `\n⚠️ ${error.message}`;
                    }
                    
                    await bot.sendMessage(chatId, errorMessage);
                }
                
            } else if (text && text.startsWith('/')) {
                await bot.sendMessage(chatId, 
                    '❓ Comando não reconhecido.\n' +
                    'Digite /help para ver os comandos disponíveis.'
                );
            }
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).send('Error');
    }
});

// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Configurar webhook do Telegram
async function setupTelegramWebhook() {
    try {
        if (config.webhookUrl) {
            const webhookUrl = `${config.webhookUrl}/webhook/telegram`;
            await bot.setWebHook(webhookUrl);
            console.log(`🔗 Webhook configurado: ${webhookUrl}`);
        } else {
            console.log('⚠️ WEBHOOK_URL não configurada. Execute localmente ou configure para produção.');
        }
    } catch (error) {
        console.error('❌ Erro ao configurar webhook:', error);
    }
}

// Iniciar servidor
app.listen(config.port, () => {
    console.log(`🌐 Servidor webhook rodando na porta ${config.port}`);
    
    if (config.webhookUrl) {
        setupTelegramWebhook();
    } else {
        console.log('💡 Para usar em produção, configure WEBHOOK_URL');
        console.log('💡 Exemplo: WEBHOOK_URL=https://seu-dominio.com');
    }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
    console.error('❌ Erro não tratado:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exceção não capturada:', error);
    process.exit(1);
});
