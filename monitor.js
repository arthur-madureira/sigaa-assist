require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Função helper para delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configurações
const config = {
    username: process.env.SIGAA_USERNAME,
    password: process.env.SIGAA_PASSWORD,
    headless: process.env.HEADLESS !== 'false',
    timeout: 15000,
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID
};

// Arquivo para armazenar atividades anteriores
const ACTIVITIES_FILE = path.join(__dirname, 'last_activities.json');

// Validar configurações
if (!config.username || !config.password || !config.telegramToken || !config.telegramChatId) {
    console.log('❌ ERRO: Configure todas as variáveis de ambiente necessárias!');
    process.exit(1);
}

// Criar instância do bot (sem polling para CI/CD)
const bot = new TelegramBot(config.telegramToken);

// Função para extrair tarefas do SIGAA
async function extrairTarefasSIGAA() {
    console.log('🚀 Iniciando extração de tarefas do SIGAA...');

    const browser = await puppeteer.launch({
        headless: config.headless,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
        ]
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(config.timeout);

    try {
        await page.setViewport({ width: 1365, height: 951 });
        
        console.log('🌐 Navegando para página de login...');
        await page.goto('https://autenticacao.ufrn.br/sso-server/login?service=https%3A%2F%2Fsigaa.ufrn.br%2Fsigaa%2Flogin%2Fcas');
        
        // Login
        console.log('👤 Fazendo login...');
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
        console.log('⏳ Aguardando redirecionamento...');
        await page.waitForFunction(
            () => window.location.href.includes('portais/discente/discente.jsf'),
            { timeout: 20000 }
        );
        
        // Aguardar atividades
        console.log('📋 Extraindo atividades...');
        await page.waitForSelector('#avaliacao-portal', { timeout: 15000 });
        await page.waitForSelector('#avaliacao-portal table', { timeout: 10000 });
        await delay(3000);
        
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
                            id: `${semestreAtual}-${disciplina}-${dataTexto}-${tipoAtividade}`.replace(/\s+/g, '-'),
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
        console.log(`✅ Extraídas ${tarefas.length} atividades`);
        return tarefas;
        
    } catch (error) {
        await browser.close();
        throw error;
    }
}

// Função para carregar atividades anteriores
async function carregarAtividadesAnteriores() {
    try {
        const data = await fs.readFile(ACTIVITIES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Arquivo não existe ainda, retorna array vazio
        return [];
    }
}

// Função para salvar atividades atuais
async function salvarAtividadesAtuais(atividades) {
    await fs.writeFile(ACTIVITIES_FILE, JSON.stringify(atividades, null, 2));
}

// Função para comparar atividades e encontrar novas
function encontrarNovasAtividades(atividadesAtuais, atividadesAnteriores) {
    const idsAnteriores = new Set(atividadesAnteriores.map(a => a.id));
    return atividadesAtuais.filter(a => !idsAnteriores.has(a.id));
}

// Função para formatar atividades novas para o Telegram
function formatarAtividadesNovas(novasAtividades) {
    if (novasAtividades.length === 0) {
        return null; // Não enviar mensagem se não há atividades novas
    }
    
    let mensagem = '🚨 *NOVAS ATIVIDADES DETECTADAS!*\n';
    mensagem += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    let semestreAtual = '';
    novasAtividades.forEach((tarefa) => {
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
    mensagem += `🆕 ${novasAtividades.length} nova${novasAtividades.length > 1 ? 's' : ''} atividade${novasAtividades.length > 1 ? 's' : ''}`;
    
    return mensagem;
}

// Função principal de monitoramento
async function monitorarAtividades() {
    try {
        console.log('🔍 Iniciando monitoramento de atividades...');
        
        // Extrair atividades atuais
        const atividadesAtuais = await extrairTarefasSIGAA();
        
        // Carregar atividades anteriores
        const atividadesAnteriores = await carregarAtividadesAnteriores();
        
        // Encontrar novas atividades
        const novasAtividades = encontrarNovasAtividades(atividadesAtuais, atividadesAnteriores);
        
        console.log(`📊 Atividades atuais: ${atividadesAtuais.length}`);
        console.log(`📊 Atividades anteriores: ${atividadesAnteriores.length}`);
        console.log(`🆕 Novas atividades: ${novasAtividades.length}`);
        
        // Se há atividades novas, enviar notificação
        if (novasAtividades.length > 0) {
            const mensagem = formatarAtividadesNovas(novasAtividades);
            if (mensagem) {
                await bot.sendMessage(config.telegramChatId, mensagem, { parse_mode: 'Markdown' });
                console.log('✅ Notificação enviada para o Telegram!');
            }
        } else {
            console.log('ℹ️ Nenhuma atividade nova encontrada');
        }
        
        // Salvar atividades atuais para próxima comparação
        await salvarAtividadesAtuais(atividadesAtuais);
        
        console.log('🏁 Monitoramento concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante monitoramento:', error.message);
        
        // Enviar mensagem de erro para o Telegram
        try {
            await bot.sendMessage(
                config.telegramChatId, 
                `❌ *Erro no monitoramento SIGAA*\n\n\`${error.message}\``,
                { parse_mode: 'Markdown' }
            );
        } catch (telegramError) {
            console.error('❌ Erro ao enviar mensagem de erro:', telegramError.message);
        }
        
        process.exit(1);
    }
}

// Executar monitoramento
if (require.main === module) {
    monitorarAtividades();
}

module.exports = { monitorarAtividades, extrairTarefasSIGAA };
