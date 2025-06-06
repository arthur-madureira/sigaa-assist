require('dotenv').config(); // Carrega variáveis do arquivo .env
const puppeteer = require('puppeteer'); // v23.0.0 or later

// Função helper para delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para extrair e exibir as tarefas
async function extrairTarefas(page) {
    console.log('📋 Extraindo tarefas da página...');
    
    try {
        // Primeiro, vamos verificar se chegamos na página correta
        const currentUrl = page.url();
        console.log(`🌐 URL atual: ${currentUrl}`);
        
        // Aguardar a área de atividades aparecer
        console.log('⏳ Aguardando área de atividades...');
        const atividades = await page.waitForSelector('#avaliacao-portal', { timeout: 15000 });
        
        if (!atividades) {
            console.log('❌ Elemento #avaliacao-portal não encontrado');
            return;
        }
        
        console.log('✅ Área de atividades encontrada!');
        
        // Aguardar a tabela carregar
        await page.waitForSelector('#avaliacao-portal table', { timeout: 10000 });
        console.log('✅ Tabela de atividades carregada!');
        
        // Aguardar um pouco mais para os dados carregarem
        await delay(2000);
        
        // Extrair dados das tarefas
        const tarefas = await page.evaluate(() => {
            const portal = document.querySelector('#avaliacao-portal');
            if (!portal) return [];
            
            const table = portal.querySelector('table tbody');
            if (!table) return [];
            
            const rows = table.querySelectorAll('tr');
            const atividades = [];
            let semestreAtual = '';
            
            console.log(`Encontradas ${rows.length} linhas na tabela`);
            
            rows.forEach((row, index) => {
                // Verificar se é uma linha de semestre
                const semestreCell = row.querySelector('td[colspan="5"]');
                if (semestreCell) {
                    semestreAtual = semestreCell.textContent.trim();
                    console.log(`Semestre encontrado: ${semestreAtual}`);
                    return;
                }
                
                // Extrair dados da atividade
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const icone = cells[0].querySelector('img');
                    const dataTexto = cells[1].textContent.trim().replace(/\s+/g, ' ');
                    const atividadeTexto = cells[2].textContent.trim();
                    
                    // Extrair link se existir
                    const link = cells[2].querySelector('a');
                    const tituloTarefa = link ? link.textContent.trim() : null;
                    
                    // Separar disciplina e tipo de atividade
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
                            iconeTitle: icone ? icone.getAttribute('title') : null,
                            textoCompleto: atividadeTexto
                        });
                    }
                }
            });
            
            return atividades;
        });
        
        console.log(`📊 Encontradas ${tarefas.length} atividades`);
        
        // Exibir as tarefas no terminal
        if (tarefas.length === 0) {
            console.log('📭 Nenhuma atividade encontrada.');
            
            // Debug: mostrar o HTML da área para entender a estrutura
            const htmlContent = await page.$eval('#avaliacao-portal', el => el.innerHTML);
            console.log('\n🔍 Primeiros 1000 caracteres do HTML da área:');
            console.log(htmlContent.substring(0, 1000));
            return;
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('📚 MINHAS ATIVIDADES ACADÊMICAS');
        console.log('='.repeat(80));
        
        let semestreAtual = '';
        tarefas.forEach((tarefa) => {
            // Mostrar cabeçalho do semestre quando mudar
            if (tarefa.semestre !== semestreAtual) {
                semestreAtual = tarefa.semestre;
                console.log(`\n🎓 ${semestreAtual}`);
                console.log('-'.repeat(50));
            }
            
            // Ícone baseado no tipo
            let emoji = '📝';
            if (tarefa.tipo.includes('Avaliação')) emoji = '📋';
            if (tarefa.tipo.includes('Tarefa')) emoji = '✏️';
            if (tarefa.temIcone && tarefa.iconeTitle?.includes('Semana')) emoji = '⏰';
            
            console.log(`\n${emoji} ${tarefa.disciplina}`);
            console.log(`   📅 Data: ${tarefa.data}`);
            
            if (tarefa.tipo) {
                const tipoLimpo = tarefa.tipo.replace(/\s+/g, ' ').trim();
                console.log(`   📌 Tipo: ${tipoLimpo}`);
            }
            
            if (tarefa.titulo) {
                const tituloLimpo = tarefa.titulo.replace(/\s+/g, ' ').trim();
                console.log(`   🎯 Título: ${tituloLimpo}`);
            }
            
            if (tarefa.iconeTitle) {
                console.log(`   ⚠️  ${tarefa.iconeTitle}`);
            }
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`📊 Total de atividades: ${tarefas.length}`);
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('❌ Erro ao extrair tarefas:', error.message);
        
        try {
            // Verificar se estamos na página correta
            const url = page.url();
            console.log(`🌐 URL atual no erro: ${url}`);
            
            // Tentar encontrar elementos alternativos
            const elementos = await page.$$eval('*[id*="avaliacao"], *[class*="atividade"], *[class*="tarefa"]', 
                els => els.map(el => ({ id: el.id, className: el.className, tagName: el.tagName }))
            );
            
            if (elementos.length > 0) {
                console.log('🔍 Elementos relacionados encontrados:', elementos);
            }
            
        } catch (debugError) {
            console.log('❌ Erro no debug:', debugError.message);
        }
    }
}

// Configurações - você pode alterar aqui ou passar via linha de comando
const config = {
    username: process.env.SIGAA_USERNAME || 'seu_usuario_aqui', // Use variável de ambiente ou altere aqui
    password: process.env.SIGAA_PASSWORD || 'sua_senha_aqui',   // Use variável de ambiente ou altere aqui
    headless: process.env.HEADLESS !== 'false', // Por padrão executa sem interface gráfica
    timeout: 10000 // 10 segundos de timeout
};

(async () => {
    console.log('🚀 Iniciando automação do SIGAA...');
    
    // Verificar se as credenciais foram fornecidas
    if (config.username === 'seu_usuario_aqui' || config.password === 'sua_senha_aqui') {
        console.log('❌ ERRO: Configure suas credenciais!');
        console.log('💡 Opções:');
        console.log('   1. Edite o arquivo script.js e altere username/password');
        console.log('   2. Use variáveis de ambiente: SIGAA_USERNAME=seu_usuario SIGAA_PASSWORD=sua_senha node script.js');
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Para compatibilidade em alguns sistemas
    });
    
    const page = await browser.newPage();
    page.setDefaultTimeout(config.timeout);

    try {
        console.log('📱 Configurando viewport...');
        await page.setViewport({
            width: 1365,
            height: 951
        });

        console.log('🌐 Navegando para página de login...');
        await page.goto('https://autenticacao.ufrn.br/sso-server/login?service=https%3A%2F%2Fsigaa.ufrn.br%2Fsigaa%2Flogin%2Fcas');
        
        console.log('👤 Preenchendo username...');
        await page.waitForSelector('#username');
        await page.click('#username');
        await page.type('#username', config.username);
        
        console.log('🔒 Preenchendo senha...');
        await page.waitForSelector('#password');
        await page.click('#password');
        await page.type('#password', config.password);
        
        console.log('🔐 Clicando em Entrar...');
        // Aguardar pelo botão e clicar
        await page.waitForSelector('button[value="Submit"]');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button[value="Submit"]')
        ]);
        
        console.log('✅ Login realizado com sucesso!');
        
        // Aguardar redirecionamento para a página do portal do discente
        console.log('⏳ Aguardando redirecionamento para portal do discente...');
        
        // Aguardar até que a URL contenha o portal do discente
        await page.waitForFunction(
            () => window.location.href.includes('portais/discente/discente.jsf'),
            { timeout: 15000 }
        );
        
        console.log('📄 Página do portal carregada, aguardando atividades...');
        
        // Aguardar a área de atividades carregar
        await page.waitForSelector('#avaliacao-portal', { timeout: 10000 });
        
        // Aguardar um pouco mais para garantir que os dados das atividades carregaram
        await delay(3000);
        
        // Extrair e exibir as tarefas
        await extrairTarefas(page);
        
        console.log('✅ Automação concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a execução:', error.message);
        
        // Tirar screenshot em caso de erro (útil para debug)
        if (!config.headless) {
            await page.screenshot({ path: 'error-screenshot.png' });
            console.log('📸 Screenshot salvo como error-screenshot.png');
        }
    } finally {
        console.log('🔄 Fechando navegador...');
        await browser.close();
    }

})().catch(err => {
    console.error('💥 Erro fatal:', err);
    process.exit(1);
});
