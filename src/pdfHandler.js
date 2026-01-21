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
    const labelsRegex = new RegExp(`(?:^|\s)(${labels.join('|')}):`, 'gi');
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
 * @param {string} textoBruto - Texto extraído do PDF/documento
 * @returns {string} Lista formatada com 20 campos fixos (hífen + espaço + campo: valor)
 * 
 * @example
 * const textoPDF = await extrairTextoPDF(buffer);
 * const resumo = extrairCamposLista(textoPDF);
 * await enviarWhatsApp(resumo);
 * 
 * Formato de saída:
 * - Nº sinistro: 201034
 * - Seguradora: AXA SEGUROS
 * - Segurado: PURA BENCAO TRANSPORTES LTDA
 * ...
 */
function extrairCamposLista(textoBruto) {
        const texto = (textoBruto || '').replace(/\r\n/g, '\n');

        const LABELS_MASTER =
            'N[º°]\\s*SINISTRO(?:\\s*\\(SEC\\))?' +
            '|SEGURADORA' +
            '|SEGURADO' +
            '|MOTORISTA' +
            '|TELEFONE' +
            '|PLACAS?' +
            '|REMETENTE' +
            '|ORIGEM' +
            '|DESTINAT[ÁA]RIO' +
            '|DESTINO' +
            '|LOCAL\\s+DO\\s+EVENTO' +
            '|CIDADE(?:\\s+DO\\s+EVENTO)?' +
            '|LOCAL\\s+DA\\s+VISTORIA' +
            '|CIDADE(?:\\s+DA\\s+VISTORIA)?' +
            '|NATUREZA' +
            '|MANIFESTO(?:\\s*N[º°])?' +
            '|FATURA\\/?N\\.?FISCAL' +
            '|MERCADORIA' +
            '|VALOR\\s+DECLARADO' +
            '|OBSERVA[ÇC][ÃA]O|OBSERVA[ÇC][ÕO]ES';

        const capture = (labelRegexStr) => {
            const re = new RegExp(
                `(?:^|\\n)\\s*(?:${labelRegexStr})\\s*[:\\-]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${LABELS_MASTER})\\s*[:\\-]|$)`,
                'i'
            );
            const m = re.exec(texto);
            if (!m || !m[1]) return '--';
            return m[1].trim().replace(/[ \t]+/g, ' ');
        };

        const captureCidadeEvento = () => {
            const re = new RegExp(
                `LOCAL\\s+DO\\s+EVENTO[\\s\\S]*?CIDADE\\s*[:\\-]\\s*([^\\n]+)`,
                'i'
            );
            const m = re.exec(texto);
            if (m && m[1]) return m[1].trim();
            return '--';
        };

        const captureCidadeVistoria = () => {
            const re = new RegExp(
                `LOCAL\\s+DA\\s+VISTORIA[\\s\\S]*?CIDADE\\s*[:\\-]\\s*([^\\n]+)`,
                'i'
            );
            const m = re.exec(texto);
            if (m && m[1]) return m[1].trim();
            return '--';
        };

        const sinistro = capture('N[º°]\\s*SINISTRO(?:\\s*\\(SEC\\))?');
        const seguradora = capture('SEGURADORA');
        const segurado = capture('SEGURADO');
        const motorista = capture('MOTORISTA');
        const telefone = capture('TELEFONE');
        const placas = capture('PLACAS?');
        const remetente = capture('REMETENTE');
        const origem = capture('ORIGEM');
        const destinatario = capture('DESTINAT[ÁA]RIO');
        const destino = capture('DESTINO');
        const localEvento = capture('LOCAL\\s+DO\\s+EVENTO');
        const cidadeEvento = captureCidadeEvento();
        const localVistoria = capture('LOCAL\\s+DA\\s+VISTORIA');
        const cidadeVistoria = captureCidadeVistoria();
        const natureza = capture('NATUREZA');
        const manifesto = capture('MANIFESTO(?:\\s*N[º°])?');
        const fatura = capture('FATURA\\/?N\\.?FISCAL');
        const mercadoria = capture('MERCADORIA');
        const valorDeclarado = capture('VALOR\\s+DECLARADO');
        const observacaoRaw = capture('OBSERVA[ÇC][ÃA]O|OBSERVA[ÇC][ÕO]ES');
        const observacao = observacaoRaw.length > 500 ? observacaoRaw.substring(0, 500) + '...' : observacaoRaw;

        return [
            `- Nº sinistro: ${sinistro || '--'}`,
            `- Seguradora: ${seguradora || '--'}`,
            `- Segurado: ${segurado || '--'}`,
            `- Motorista: ${motorista || '--'}`,
            `- Telefone: ${telefone || '--'}`,
            `- Placas: ${placas || '--'}`,
            `- Remetente: ${remetente || '--'}`,
            `- Origem: ${origem || '--'}`,
            `- Destinatário: ${destinatario || '--'}`,
            `- Destino: ${destino || '--'}`,
            `- Local do evento: ${localEvento || '--'}`,
            `- Cidade do evento: ${cidadeEvento || '--'}`,
            `- Local da vistoria: ${localVistoria || '--'}`,
            `- Cidade da vistoria: ${cidadeVistoria || '--'}`,
            `- Natureza: ${natureza || '--'}`,
            `- Manifesto: ${manifesto || '--'}`,
            `- Fatura/NF Fiscal: ${fatura || '--'}`,
            `- Mercadoria: ${mercadoria || '--'}`,
            `- Valor declarado: ${valorDeclarado || '--'}`,
            `- Observação: ${observacao || '--'}`
        ].join('\n');
}

module.exports = { extrairDadosAvancado, extrairCamposLista };