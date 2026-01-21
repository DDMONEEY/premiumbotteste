/**
 * @deprecated Use extrairCamposLista() para resposta formatada como lista
 * Esta função retorna objeto e será removida em versões futuras
 */
function extrairDadosAvancado(texto) {
    console.log('🔍 [pdfHandler] Extraindo dados...');
    console.log(`📊 [pdfHandler] Comprimento do texto: ${texto?.length || 0} chars`);
    
    if (!texto || texto.length === 0) {
        console.log('⚠️ [pdfHandler] Texto vazio, retornando dados padrão');
        return getDefaultData();
    }
    
    // Limpeza do texto
    let textoLimpo = texto.replace(/www\.serraecompany\.com\.br/gi, '')
                          .replace(/PLANTÃO 24 HORAS/gi, '')
                          .replace(/0800 770 6607/g, '')
                          .replace(/Página \d+ de \d+/gi, '')
                          .replace(/\r\n/g, '\n');

    // Inserir quebra de linha antes de labels conhecidos para separar campos
    const labels = [
        'Nº SINISTRO', 'SEGURADORA', 'SEGURADO', 'MOTORISTA', 'TELEFONE', 'PLACAS',
        'REMETENTE', 'ORIGEM', 'DESTINATÁRIO', 'DESTINO', 'LOCAL DO EVENTO',
        'CIDADE DO EVENTO', 'LOCAL DA VISTORIA', 'CIDADE DA VISTORIA', 'NATUREZA',
        'MANIFESTO', 'FATURA\/N\.FISCAL', 'MERCADORIA', 'VALOR DECLARADO', 'OBSERVAÇÃO'
    ];
    const labelsRegex = new RegExp(`(?:^|\\s)(${labels.join('|')}):`, 'gi');
    textoLimpo = textoLimpo.replace(labelsRegex, '\n$1:');

    console.log(`📝 [pdfHandler] Primeiros 500 chars do texto: ${textoLimpo.substring(0, 500)}`);

    // Função de extração otimizada com múltiplos padrões
    const pegar = (regexArray) => {
        // Aceitar um array de regex ou uma regex única
        const regexes = Array.isArray(regexArray) ? regexArray : [regexArray];
        
        for (let regex of regexes) {
            try {
                const match = regex.exec(textoLimpo);
                if (match && match[1]) {
                    // Apenas remover quebras de linha EXCESSIVAS, manter a estrutura
                    let resultado = match[1]
                        .replace(/\n\n+/g, ' ') // Remover múltiplas quebras
                        .replace(/\n/g, ' ')    // Quebras simples viram espaço
                        .trim();
                    
                    // Limpar múltiplos espaços
                    resultado = resultado.replace(/\s+/g, ' ');
                    
                    console.log(`✓ [pdfHandler] Encontrado: ${regex.source.substring(0, 50)} = "${resultado.substring(0, 50)}"`);
                    return resultado;
                }
            } catch (e) {
                console.log(`⚠️ [pdfHandler] Erro ao executar regex: ${e.message}`);
            }
        }
        return "—";
    };

    const dados = {
        sinistro: pegar([
            /Nº SINISTRO \(SEC\)[:\s]*(\d+)/i,
            /Nº.*?SINISTRO[:\s]*(\d+)/i,
            /SINISTRO[:\s]*(\d+)/i
        ]),
        seguradora: pegar([
            /SEGURADORA:[:\s]*([A-Z0-9\.\-&\s]+?)(?:APÓLICE|MODALIDADE|RAMO|CPF|CNPJ|\n|$)/i,
            /SEGURADORA[:\s]*([A-Z0-9\.\-&\s]+?)(?:\n|$)/i,
            /SEGURADO POR[:\s]*([A-Z0-9\.\-&\s]+?)(?:\n|$)/i
        ]),
        segurado: pegar([
            /SEGURADO:[:\s]*([A-Z0-9\.\-&\s]+?)(?:CPF|CNPJ|CONTATO|APÓLICE|MODALIDADE|SEGURADORA|BENEFICIÁRIO|CORRETOR|\n|$)/i,
            /SEGURADO[:\s]*([A-Z0-9\.\-&\s]+?)(?:\n|$)/i,
            /NOME DO SEGURADO[:\s]*([A-Z0-9\.\-&\s]+?)(?:\n|$)/i
        ]),
        motorista: pegar([
            /MOTORISTA:[:\s]*(.*?)(?:TELEFONE|CPF|\(|\n)/i,
            /MOTORISTA[:\s]*(.*?)(?:\n|$)/i,
            /CONDUTOR:[:\s]*(.*?)(?:\n|$)/i
        ]),
        telMotorista: pegar([
            /MOTORISTA:.*?TELEFONE:[:\s]*([\(\)\d\s\-]+)/i,
            /TELEFONE:[:\s]*([\(\)\d\s\-]+)/i,
            /CONTATO:[:\s]*([\(\)\d\s\-]+)/i
        ]),
        placas: pegar([
            /PLACAS:[:\s]*(.*?)(?:REMETENTE|ORIGEM|VEÍCULO|\n)/i,
            /PLACA:[:\s]*(.*?)(?:\n|$)/i,
            /PLACA DO VEÍCULO:[:\s]*(.*?)(?:\n|$)/i
        ]),
        remetente: pegar([
            /REMETENTE:[:\s]*(.*?)(?:ORIGEM|\n)/i,
            /REMETENTE[:\s]*(.*?)(?:\n|$)/i,
            /REMETENTE DO PRODUTO[:\s]*(.*?)(?:\n|$)/i
        ]),
        origem: pegar([
            /ORIGEM:[:\s]*(.*?)(?:\n|DESTINATÁRIO|DESTINO)/i,
            /ORIGEM[:\s]*(.*?)(?:\n|$)/i,
            /LOCAL DE ORIGEM[:\s]*(.*?)(?:\n|$)/i
        ]),
        destinatario: pegar([
            /DESTINATÁRIO:[:\s]*(.*?)(?:DESTINO|\n)/i,
            /DESTINATÁRIO[:\s]*(.*?)(?:\n|$)/i,
            /DESTINATÁRIO DO PRODUTO[:\s]*(.*?)(?:\n|$)/i
        ]),
        destino: pegar([
            /DESTINO:[:\s]*(.*?)(?:\n|LOCAL DO EVENTO|LOCAL DA)/i,
            /DESTINO[:\s]*(.*?)(?:\n|$)/i,
            /LOCAL DE DESTINO[:\s]*(.*?)(?:\n|$)/i
        ]),
        localEvento: pegar([
            /LOCAL DO EVENTO:[:\s]*([\s\S]*?)CIDADE:/i,
            /LOCAL DO EVENTO[:\s]*(.*?)(?:CIDADE|$)/i,
            /LOCAL DO EVENTO[:\s]*(.*?)(?:\n|$)/i
        ]), 
        cidadeEvento: pegar([
            /LOCAL DO EVENTO:.*?CIDADE:[:\s]*(.*?)(?:\n|LOCAL DA VISTORIA)/i,
            /CIDADE.*?EVENTO[:\s]*(.*?)(?:\n|$)/i,
            /CIDADE DO EVENTO[:\s]*(.*?)(?:\n|$)/i
        ]),
        localVistoria: pegar([
            /LOCAL DA VISTORIA:[:\s]*(.*?)(?:CIDADE|\n)/i,
            /LOCAL DA VISTORIA[:\s]*(.*?)(?:\n|$)/i,
            /LOCAL DE VISTORIA[:\s]*(.*?)(?:\n|$)/i
        ]),
        cidadeVistoria: pegar([
            /LOCAL DA VISTORIA:.*?CIDADE:[:\s]*(.*?)(?:\n|NATUREZA)/i,
            /CIDADE.*?VISTORIA[:\s]*(.*?)(?:\n|$)/i,
            /CIDADE DA VISTORIA[:\s]*(.*?)(?:\n|$)/i
        ]),
        natureza: pegar([
            /NATUREZA:[:\s]*(.*?)(?:DATA|MANIFESTO|\n)/i,
            /NATUREZA[:\s]*(.*?)(?:\n|$)/i,
            /NATUREZA DO SINISTRO[:\s]*(.*?)(?:\n|$)/i
        ]),
        manifesto: pegar([
            /MANIFESTO Nº:[:\s]*(.*?)(?:DATA|FATURA|\n)/i,
            /MANIFESTO[:\s]*(.*?)(?:\n|$)/i,
            /Nº MANIFESTO[:\s]*(.*?)(?:\n|$)/i
        ]),
        nf: pegar([
            /FATURA\/N\.FISCAL:[:\s]*(.*?)(?:DATA|MERCADORIA|\n)/i,
            /N\.FISCAL[:\s]*(.*?)(?:\n|$)/i,
            /NOTA FISCAL[:\s]*(.*?)(?:\n|$)/i
        ]),
        mercadoria: pegar([
            /MERCADORIA:[:\s]*(.*?)(?:DANOS|VALOR|\n)/i,
            /MERCADORIA[:\s]*(.*?)(?:\n|$)/i,
            /CARGA:[:\s]*(.*?)(?:\n|$)/i
        ]),
        valor: pegar([
            /VALOR DECLARADO:[:\s]*(R\$\s*[\d\.,]+)/i,
            /VALOR[:\s]*(R\$\s*[\d\.,]+)/i,
            /VALOR TOTAL[:\s]*(R\$\s*[\d\.,]+)/i
        ]),
        obs: pegar([
            /OBSERVAÇÃO:[:\s]*([\s\S]+?)$/i,
            /OBSERVAÇÕES[:\s]*([\s\S]+?)$/i,
            /OBSERVAÇÃO[:\s]*([\s\S]+?)$/i
        ])
    };
    
    console.log('✅ [pdfHandler] Extração concluída');
    console.log(`📊 [pdfHandler] Dados extraídos:`, JSON.stringify(dados, null, 2).substring(0, 300));
    
    return dados;
}

function getDefaultData() {
    return {
        sinistro: "—",
        seguradora: "—",
        segurado: "—",
        motorista: "—",
        telMotorista: "—",
        placas: "—",
        remetente: "—",
        origem: "—",
        destinatario: "—",
        destino: "—",
        localEvento: "—",
        cidadeEvento: "—",
        localVistoria: "—",
        cidadeVistoria: "—",
        natureza: "—",
        manifesto: "—",
        nf: "—",
        mercadoria: "—",
        valor: "—",
        obs: "—"
    };
}

/**
 * FUNÇÃO PRINCIPAL - Extrai campos de aviso de sinistro e retorna lista formatada
 * 
 * LÓGICA:
 * 1. Recebe TODO o texto extraído do PDF/documento
 * 2. Define os 20 campos fixos que devem ser extraídos
 * 3. Para cada campo, busca no texto completo usando regex
 * 4. Preenche com o valor encontrado ou "--" se não encontrar
 * 5. Retorna formatado como lista com bullet points
 * 
 * @param {string} textoBruto - Texto COMPLETO extraído do PDF/documento
 * @returns {string} Lista formatada com 20 campos fixos
 */
function extrairCamposLista(textoBruto) {
    console.log('🔍 [EXTRAÇÃO] Iniciando análise do documento...');
    console.log(`📄 [EXTRAÇÃO] Tamanho do texto: ${textoBruto?.length || 0} caracteres`);
    
    // PASSO 1: Normalizar o texto completo
    const textoCompleto = (textoBruto || '')
        .replace(/\r\n/g, '\n')           // Normalizar quebras de linha
        .replace(/[ \t]+/g, ' ')          // Normalizar espaços
        .trim();
    
    if (!textoCompleto || textoCompleto.length < 10) {
        console.log('⚠️ [EXTRAÇÃO] Texto vazio ou muito curto');
        return '❌ *ERRO: Documento vazio ou ilegível*';
    }
    
    console.log(`📝 [EXTRAÇÃO] Primeiros 200 chars: ${textoCompleto.substring(0, 200)}`);
    
    // PASSO 2: Definir TODOS os campos que queremos extrair
    // Lista master de todos os labels possíveis (para lookahead negativo)
    const TODOS_LABELS = [
        'N[º°]\\s*SINISTRO(?:\\s*\\(SEC\\))?',
        'SEGURADORA',
        'SEGURADO',
        'MOTORISTA',
        'TELEFONE',
        'PLACAS?',
        'REMETENTE',
        'ORIGEM',
        'DESTINAT[ÁA]RIO',
        'DESTINO',
        'LOCAL\\s+DO\\s+EVENTO',
        'CIDADE(?:\\s+DO\\s+EVENTO)?',
        'LOCAL\\s+DA\\s+VISTORIA',
        'CIDADE(?:\\s+DA\\s+VISTORIA)?',
        'NATUREZA',
        'MANIFESTO(?:\\s*N[º°])?',
        'FATURA\\/?N\\.?FISCAL',
        'MERCADORIA',
        'VALOR\\s+DECLARADO',
        'OBSERVA[ÇC][ÃA]O|OBSERVA[ÇC][ÕO]ES'
    ].join('|');
    
    // PASSO 3: Função genérica para extrair qualquer campo
    const extrairCampo = (labelPattern, opcoes = {}) => {
        const {
            somenteLinhaAtual = false,
            multiplosValores = false,
            limiteCaracteres = null
        } = opcoes;
        
        try {
            // PADRÃO 1: Formato texto normal "LABEL: valor"
            const regexTexto = new RegExp(
                `(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\\-]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${TODOS_LABELS})\\s*[:\\-]|$)`,
                'i'
            );
            
            // PADRÃO 2: Formato tabular "LABEL valor" (sem dois pontos, separado por espaços)
            const regexTabular = new RegExp(
                `(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\\-]?\\s+([^\\n]+)`,
                'i'
            );
            
            // PADRÃO 3: Formato com quebra de linha (label em uma linha, valor na próxima)
            const regexQuebraLinha = new RegExp(
                `(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\\-]?\\s*\\n\\s*([^\\n]+)`,
                'i'
            );
            
            let match = regexTexto.exec(textoCompleto);
            let metodo = 'texto';
            
            // Se não encontrou com padrão texto, tenta tabular
            if (!match || !match[1] || match[1].trim().length === 0) {
                match = regexTabular.exec(textoCompleto);
                metodo = 'tabular';
            }
            
            // Se ainda não encontrou, tenta com quebra de linha
            if (!match || !match[1] || match[1].trim().length === 0) {
                match = regexQuebraLinha.exec(textoCompleto);
                metodo = 'quebra-linha';
            }
            
            if (!match || !match[1] || match[1].trim().length === 0) {
                console.log(`⚠️ [EXTRAÇÃO] Campo não encontrado: ${labelPattern.substring(0, 30)}`);
                return '--';
            }
            
            let valor = match[1].trim();
            
            // Se quiser apenas a linha atual (primeira linha)
            if (somenteLinhaAtual) {
                valor = valor.split('\n')[0].trim();
            }
            
            // Limpar espaços múltiplos
            valor = valor.replace(/\s+/g, ' ');
            
            // Remover lixo comum de PDFs tabulares
            valor = valor.replace(/^[:\-\s]+/, '').trim();
            
            // Aplicar limite de caracteres se especificado
            if (limiteCaracteres && valor.length > limiteCaracteres) {
                valor = valor.substring(0, limiteCaracteres) + '...';
            }
            
            console.log(`✅ [EXTRAÇÃO] ${labelPattern.substring(0, 20)} (${metodo}): "${valor.substring(0, 50)}${valor.length > 50 ? '...' : ''}"`);
            
            return valor || '--';
            
        } catch (erro) {
            console.error(`❌ [EXTRAÇÃO] Erro ao extrair ${labelPattern}: ${erro.message}`);
            return '--';
        }
    };
    
    // PASSO 4: Funções especiais para campos complexos (com CIDADE adjacente)
    const extrairLocalEvento = () => {
        try {
            const regex = /LOCAL\s+DO\s+EVENTO\s*[:\-]\s*([^\n]+?)(?=\s*CIDADE|$)/i;
            const match = regex.exec(textoCompleto);
            return match && match[1] ? match[1].trim().replace(/\s+/g, ' ') : '--';
        } catch (e) {
            return '--';
        }
    };
    
    const extrairCidadeEvento = () => {
        try {
            const regex = /LOCAL\s+DO\s+EVENTO[\s\S]*?CIDADE\s*[:\-]\s*([^\n]+)/i;
            const match = regex.exec(textoCompleto);
            return match && match[1] ? match[1].trim().replace(/\s+/g, ' ') : '--';
        } catch (e) {
            return '--';
        }
    };
    
    const extrairLocalVistoria = () => {
        try {
            const regex = /LOCAL\s+DA\s+VISTORIA\s*[:\-]\s*([^\n]+?)(?=\s*CIDADE|$)/i;
            const match = regex.exec(textoCompleto);
            return match && match[1] ? match[1].trim().replace(/\s+/g, ' ') : '--';
        } catch (e) {
            return '--';
        }
    };
    
    const extrairCidadeVistoria = () => {
        try {
            const regex = /LOCAL\s+DA\s+VISTORIA[\s\S]*?CIDADE\s*[:\-]\s*([^\n]+)/i;
            const match = regex.exec(textoCompleto);
            return match && match[1] ? match[1].trim().replace(/\s+/g, ' ') : '--';
        } catch (e) {
            return '--';
        }
    };
    
    // PASSO 5: Extrair cada um dos 20 campos do documento
    console.log('🔎 [EXTRAÇÃO] Buscando campos no documento...');
    
    const dadosExtraidos = {
        sinistro: extrairCampo('N[º°]\\s*SINISTRO(?:\\s*\\(SEC\\))?', { somenteLinhaAtual: true }),
        seguradora: extrairCampo('(?:N[º°]\\s*)?SEGURADORA', { somenteLinhaAtual: true }),
        segurado: extrairCampo('(?:N[º°]\\s*)?SEGURADO', { somenteLinhaAtual: true }),
        motorista: extrairCampo('MOTORISTA', { somenteLinhaAtual: true }),
        telefone: extrairCampo('TELEFONE', { somenteLinhaAtual: true }),
        placas: extrairCampo('PLACAS?', { somenteLinhaAtual: true }),
        remetente: extrairCampo('REMETENTE', { somenteLinhaAtual: true }),
        origem: extrairCampo('ORIGEM', { somenteLinhaAtual: true }),
        destinatario: extrairCampo('DESTINAT[ÁA]RIO', { somenteLinhaAtual: true }),
        destino: extrairCampo('DESTINO', { somenteLinhaAtual: true }),
        localEvento: extrairLocalEvento(),
        cidadeEvento: extrairCidadeEvento(),
        localVistoria: extrairLocalVistoria(),
        cidadeVistoria: extrairCidadeVistoria(),
        natureza: extrairCampo('NATUREZA', { somenteLinhaAtual: true }),
        manifesto: extrairCampo('MANIFESTO(?:\\s*N[º°])?', { somenteLinhaAtual: true }),
        fatura: extrairCampo('FATURA\\/?N\\.?FISCAL|FATURA\\/NR\\.?N\\.?FISCAL', { somenteLinhaAtual: true }),
        mercadoria: extrairCampo('MERCADORIA', { somenteLinhaAtual: true }),
        valorDeclarado: extrairCampo('VALOR\\s+(?:NA\\s+)?DECLARADO|VALOR\\s+DECLARADO\\s+NA\\s+CARGA', { somenteLinhaAtual: true }),
        observacao: extrairCampo('OBSERVA[ÇC][ÃA]O|OBSERVA[ÇC][ÕO]ES', { limiteCaracteres: 500 })
    };
    
    console.log('✅ [EXTRAÇÃO] Todos os campos processados');
    
    // PASSO 6: Montar resposta formatada
    const resumo = '✅ *RESUMO DO AVISO GERADO*\n\n' + [
        `• *Nº sinistro:* ${dadosExtraidos.sinistro}`,
        `• *Seguradora:* ${dadosExtraidos.seguradora}`,
        `• *Segurado:* ${dadosExtraidos.segurado}`,
        `• *Motorista:* ${dadosExtraidos.motorista}`,
        `• *Telefone:* ${dadosExtraidos.telefone}`,
        `• *Placas:* ${dadosExtraidos.placas}`,
        `• *Remetente:* ${dadosExtraidos.remetente}`,
        `• *Origem:* ${dadosExtraidos.origem}`,
        `• *Destinatário:* ${dadosExtraidos.destinatario}`,
        `• *Destino:* ${dadosExtraidos.destino}`,
        `• *Local do evento:* ${dadosExtraidos.localEvento}`,
        `• *Cidade do evento:* ${dadosExtraidos.cidadeEvento}`,
        `• *Local da vistoria:* ${dadosExtraidos.localVistoria}`,
        `• *Cidade da vistoria:* ${dadosExtraidos.cidadeVistoria}`,
        `• *Natureza:* ${dadosExtraidos.natureza}`,
        `• *Manifesto:* ${dadosExtraidos.manifesto}`,
        `• *Fatura/NF:* ${dadosExtraidos.fatura}`,
        `• *Mercadoria:* ${dadosExtraidos.mercadoria}`,
        `• *Valor declarado:* ${dadosExtraidos.valorDeclarado}`,
        `• *Observação:* ${dadosExtraidos.observacao}`
    ].join('\n');
    
    console.log('📤 [EXTRAÇÃO] Resumo gerado com sucesso');
    
    return resumo;
}

module.exports = { extrairDadosAvancado, extrairCamposLista };
