require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

// Função helper para delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configurações
const config = {
    username: process.env.SIGAA_USERNAME,
    password: process.env.SIGAA_PASSWORD,
    headless: process.env.HEADLESS !== 'false',
    timeout: 30000,
    telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    sendAll: process.env.SEND_ALL === 'true'
};

console.log('🚀 Iniciando busca de atividades do SIGAA...');
console.log('📋 Modo:', config.sendAll ? 'TODAS as atividades' : 'Apenas novas atividades');

// Função para enviar mensagem no Telegram
async function enviarMensagemTelegram(mensagem) {
    try {
        const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;
        await axios.post(url, {
            chat_id: config.telegramChatId,
            text: mensagem,
            parse_mode: 'Markdown'
        });
        console.log('✅ Mensagem enviada para o Telegram');
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem para o Telegram:', error.response?.data || error.message);
    }
}

// Função para extrair tarefas do SIGAA
async function extrairTarefasSIGAA() {
    console.log('🌐 Navegando para página de login...');
    
    if (!config.username || !config.password) {
        throw new Error('Configure suas credenciais do SIGAA nas variáveis de ambiente');
    }

    const browser = await puppeteer.launch({
        headless: config.headless,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(config.timeout);

    try {
        await page.setViewport({ width: 1365, height: 951 });
        await page.goto('https://autenticacao.ufrn.br/sso-server/login?service=https%3A%2F%2Fsigaa.ufrn.br%2Fsigaa%2Flogin%2Fcas', {
            waitUntil: 'networkidle2'
        });

        console.log('👤 Fazendo login...');
        await page.waitForSelector('#username', { timeout: 10000 });
        await page.type('#username', config.username);
        await page.type('#password', config.password);
        await page.click('input[type="submit"]');

        console.log('⏳ Aguardando redirecionamento...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

        // Verificar se o login foi bem-sucedido
        const currentUrl = page.url();
        if (currentUrl.includes('login') || currentUrl.includes('erro')) {
            throw new Error('Falha no login. Verifique suas credenciais.');
        }

        console.log('📋 Navegando para página de atividades...');
        await page.goto('https://sigaa.ufrn.br/sigaa/portais/discente/discente.jsf', {
            waitUntil: 'networkidle2'
        });
        
        // Aguardar a página carregar completamente
        await delay(3000);
        
        console.log('🔍 Extraindo atividades...');
        
        const tarefas = await page.evaluate(() => {
            const atividades = [];
            
            // Seletor para as linhas da tabela de atividades
            const linhas = document.querySelectorAll('table.listagem tr');
            
            linhas.forEach((linha, index) => {
                // Pular o cabeçalho
                if (index === 0) return;
                
                const colunas = linha.querySelectorAll('td');
                if (colunas.length >= 4) {
                    const disciplina = colunas[0]?.textContent?.trim() || '';
                    const tipo = colunas[1]?.textContent?.trim() || '';
                    const titulo = colunas[2]?.textContent?.trim() || '';
                    const data = colunas[3]?.textContent?.trim() || '';
                    
                    // Verificar se há ícones ou indicadores especiais
                    const temIcone = linha.querySelector('img') !== null;
                    const iconeTitle = linha.querySelector('img')?.getAttribute('title') || '';
                    
                    if (disciplina && data) {
                        // Criar um ID único baseado no conteúdo
                        const id = btoa(disciplina + tipo + titulo + data).replace(/[^a-zA-Z0-9]/g, '');
                        
                        atividades.push({
                            id,
                            disciplina,
                            tipo,
                            titulo,
                            data,
                            temIcone,
                            iconeTitle
                        });
                    }
                }
            });
            
            return atividades;
        });

        console.log(`✅ Extraídas ${tarefas.length} atividades`);
        return tarefas;

    } catch (error) {
        console.error('❌ Erro durante a extração:', error.message);
        
        // Capturar screenshot em caso de erro
        try {
            await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
            console.log('📸 Screenshot de erro salvo como error-screenshot.png');
        } catch (screenshotError) {
            console.log('❌ Não foi possível capturar screenshot');
        }
        
        throw error;
    } finally {
        await browser.close();
    }
}

// Função para formatar atividades para envio no Telegram
function formatarAtividades(atividades) {
    if (!atividades || atividades.length === 0) {
        return '📋 *Suas Atividades Acadêmicas*\n\n✅ Não há atividades pendentes no momento!';
    }

    let mensagem = `📋 *Suas Atividades Acadêmicas*\n`;
    mensagem += `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n`;

    // Agrupar por disciplina
    const porDisciplina = {};
    atividades.forEach(atividade => {
        if (!porDisciplina[atividade.disciplina]) {
            porDisciplina[atividade.disciplina] = [];
        }
        porDisciplina[atividade.disciplina].push(atividade);
    });

    // Formatar por disciplina
    Object.keys(porDisciplina).forEach(disciplina => {
        mensagem += `🎓 *${disciplina}*\n`;
        
        porDisciplina[disciplina].forEach(atividade => {
            let emoji = '📚';
            if (atividade.tipo.includes('Prova') || atividade.tipo.includes('Avaliação')) emoji = '📋';
            if (atividade.tipo.includes('Tarefa') || atividade.tipo.includes('Exercício')) emoji = '✏️';
            if (atividade.tipo.includes('Trabalho')) emoji = '📄';
            if (atividade.temIcone && atividade.iconeTitle?.includes('Semana')) emoji = '⏰';
            
            mensagem += `  ${emoji} ${atividade.data}`;
            
            if (atividade.tipo) {
                mensagem += ` - ${atividade.tipo}`;
            }
            
            if (atividade.titulo) {
                mensagem += ` - ${atividade.titulo}`;
            }
            
            if (atividade.iconeTitle) {
                mensagem += ` ⚠️ ${atividade.iconeTitle}`;
            }
            
            mensagem += '\n';
        });
        
        mensagem += '\n';
    });

    mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    mensagem += `📊 Total: ${atividades.length} atividade${atividades.length > 1 ? 's' : ''} encontrada${atividades.length > 1 ? 's' : ''}`;

    return mensagem;
}

// Função principal
async function main() {
    try {
        console.log('🔍 Iniciando extração de atividades...');
        
        const atividades = await extrairTarefasSIGAA();
        console.log(`📊 Atividades encontradas: ${atividades.length}`);
        
        if (atividades.length === 0) {
            const mensagem = '📋 *Suas Atividades Acadêmicas*\n\n✅ Não há atividades pendentes no momento!';
            await enviarMensagemTelegram(mensagem);
        } else {
            const mensagemFormatada = formatarAtividades(atividades);
            
            // Dividir mensagem se for muito longa (limite do Telegram: 4096 caracteres)
            if (mensagemFormatada.length > 4000) {
                const partes = mensagemFormatada.match(/.{1,4000}/g);
                for (let i = 0; i < partes.length; i++) {
                    const parte = partes[i];
                    const cabecalho = i === 0 ? '' : `📋 *Continuação (${i + 1}/${partes.length})*\n\n`;
                    await enviarMensagemTelegram(cabecalho + parte);
                    
                    // Pequeno delay entre mensagens
                    if (i < partes.length - 1) {
                        await delay(1000);
                    }
                }
            } else {
                await enviarMensagemTelegram(mensagemFormatada);
            }
        }
        
        console.log('🎉 Processo concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no processo:', error.message);
        
        // Enviar erro para o Telegram
        const mensagemErro = `❌ *Erro ao buscar atividades*\n\n` +
            `⚠️ ${error.message}\n\n` +
            `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
            
        await enviarMensagemTelegram(mensagemErro);
        
        process.exit(1);
    }
}

// Executar
main();
