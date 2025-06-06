require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');

// Função helper para delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configurações
const config = {
    username: process.env.SIGAA_USERNAME || 'seu_usuario_aqui',
    password: process.env.SIGAA_PASSWORD || 'sua_senha_aqui',
    headless: process.env.HEADLESS !== 'false',
    timeout: 10000,
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID
};

// Validar configurações do Telegram
if (!config.telegramToken || !config.telegramChatId) {
    console.log('❌ ERRO: Configure o token do bot e chat ID do Telegram!');
    console.log('💡 Instruções:');
    console.log('   1. Crie um bot com @BotFather no Telegram');
    console.log('   2. Copie o token recebido');
    console.log('   3. Envie uma mensagem para o bot e pegue seu chat ID');
    console.log('   4. Configure no arquivo .env');
    process.exit(1);
}

// Criar instância do bot
const bot = new TelegramBot(config.telegramToken, { polling: true });

// Função para extrair tarefas do SIGAA
async function extrairTarefasSIGAA() {
    console.log('🚀 Iniciando extração de tarefas do SIGAA...');
    
    if (config.username === 'seu_usuario_aqui' || config.password === 'sua_senha_aqui') {
        throw new Error('Configure suas credenciais do SIGAA no arquivo .env');
    }

    const browser = await puppeteer.launch({
        headless: config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(config.timeout);

    try {
        await page.setViewport({ width: 1365, height: 951 });
        await page.goto('https://autenticacao.ufrn.br/sso-server/login?service=https%3A%2F%2Fsigaa.ufrn.br%2Fsigaa%2Flogin%2Fcas');
        
        // Login
        await page.waitForSelector('#username');
        await page.type('#username', config.username);
        await page.waitForSelector('#password');
        await page.type('#password', config.password);
        
        await page.waitForSelector('button[value="Submit"]');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button[value="Submit"]')
        ]);
        
        // Aguardar redirecionamento
        await page.waitForFunction(
            () => window.location.href.includes('portais/discente/discente.jsf'),
            { timeout: 15000 }
        );
        
        // Aguardar atividades
        await page.waitForSelector('#avaliacao-portal', { timeout: 15000 });
        await page.waitForSelector('#avaliacao-portal table', { timeout: 10000 });
        await delay(2000);
        
        // Extrair dados
        const tarefas = await page.evaluate(() => {
            const portal = document.querySelector('#avaliacao-portal');
            if (!portal) return [];
            
            const table = portal.querySelector('table tbody');
            if (!table) return [];
            
            const rows = table.querySelectorAll('tr');
            const atividades = [];
            let semestreAtual = '';
            
            rows.forEach((row) => {
                const semestreCell = row.querySelector('td[colspan="5"]');
                if (semestreCell) {
                    semestreAtual = semestreCell.textContent.trim();
                    return;
                }
                
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const icone = cells[0].querySelector('img');
                    const dataTexto = cells[1].textContent.trim().replace(/\s+/g, ' ');
                    const atividadeTexto = cells[2].textContent.trim();
                    
                    const link = cells[2].querySelector('a');
                    const tituloTarefa = link ? link.textContent.trim() : null;
                    
                    const linhas = atividadeTexto.split('\n').map(l => l.trim()).filter(l => l);
                    const disciplina = linhas[0] || '';
                    const tipoAtividade = linhas.find(l => l.includes('Avaliação:') || l.includes('Tarefa:')) || '';
                    
                    if (disciplina) {
                        atividades.push({
                            semestre: semestreAtual,
                            data: dataTexto,
                            disciplina: disciplina,
                            tipo: tipoAtividade,
                            titulo: tituloTarefa,
                            temIcone: !!icone,
                            iconeTitle: icone ? icone.getAttribute('title') : null
                        });
                    }
                }
            });
            
            return atividades;
        });
        
        await browser.close();
        return tarefas;
        
    } catch (error) {
        await browser.close();
        throw error;
    }
}

// Função para formatar tarefas para o Telegram
function formatarTarefasParaTelegram(tarefas) {
    if (tarefas.length === 0) {
        return '📭 *Nenhuma atividade encontrada*\n\nVocê está em dia com suas tarefas! 🎉';
    }
    
    let mensagem = '📚 *SUAS ATIVIDADES ACADÊMICAS*\n';
    mensagem += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    let semestreAtual = '';
    tarefas.forEach((tarefa) => {
        if (tarefa.semestre !== semestreAtual) {
            semestreAtual = tarefa.semestre;
            mensagem += `🎓 *${semestreAtual}*\n`;
            mensagem += '─────────────────────────────\n';
        }
        
        let emoji = '📝';
        if (tarefa.tipo.includes('Avaliação')) emoji = '📋';
        if (tarefa.tipo.includes('Tarefa')) emoji = '✏️';
        if (tarefa.temIcone && tarefa.iconeTitle?.includes('Semana')) emoji = '⏰';
        
        mensagem += `\n${emoji} *${tarefa.disciplina}*\n`;
        mensagem += `📅 Data: ${tarefa.data}\n`;
        
        if (tarefa.tipo) {
            const tipoLimpo = tarefa.tipo.replace(/\s+/g, ' ').trim();
            mensagem += `📌 ${tipoLimpo}\n`;
        }
        
        if (tarefa.titulo) {
            const tituloLimpo = tarefa.titulo.replace(/\s+/g, ' ').trim();
            mensagem += `🎯 ${tituloLimpo}\n`;
        }
        
        if (tarefa.iconeTitle) {
            mensagem += `⚠️ ${tarefa.iconeTitle}\n`;
        }
    });
    
    mensagem += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensagem += `📊 Total: ${tarefas.length} atividade${tarefas.length > 1 ? 's' : ''}`;
    
    return mensagem;
}

// Comando para buscar atividades
bot.onText(/\/atividades/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Verificar se é o chat autorizado
    if (chatId.toString() !== config.telegramChatId) {
        bot.sendMessage(chatId, '❌ Você não tem permissão para usar este bot.');
        return;
    }
    
    const loadingMsg = await bot.sendMessage(chatId, '⏳ Buscando suas atividades no SIGAA...');
    
    try {
        const tarefas = await extrairTarefasSIGAA();
        const mensagem = formatarTarefasParaTelegram(tarefas);
        
        // Deletar mensagem de loading
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        
        // Enviar atividades
        await bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
        
    } catch (error) {
        console.error('Erro ao buscar atividades:', error);
        
        await bot.deleteMessage(chatId, loadingMsg.message_id);
        await bot.sendMessage(chatId, '❌ Erro ao buscar atividades:\n' + error.message);
    }
});

// Comando de ajuda
bot.onText(/\/start|\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    if (chatId.toString() !== config.telegramChatId) {
        bot.sendMessage(chatId, '❌ Você não tem permissão para usar este bot.');
        return;
    }
    
    const helpMessage = `
🤖 *Bot SIGAA - Suas Atividades*

Comandos disponíveis:
• /atividades - Buscar suas atividades acadêmicas
• /help - Mostrar esta ajuda

📚 Este bot consulta automaticamente o SIGAA da UFRN e retorna suas atividades organizadas por semestre.

⚡ Desenvolvido para facilitar o acompanhamento das suas tarefas acadêmicas!
    `;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Tratamento de erros do bot
bot.on('polling_error', (error) => {
    console.error('Erro de polling:', error);
});

console.log('🤖 Bot do Telegram iniciado!');
console.log('💡 Digite /atividades no chat para buscar suas tarefas do SIGAA');
console.log('🛑 Pressione Ctrl+C para parar o bot');
