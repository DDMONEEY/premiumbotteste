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

    console.log(`📝 [pdfHandler] Primeiros 500 chars do texto: ${textoLimpo.substring(0, 500)}`);

    // Função de extração otimizada com múltiplos padrões
    const pegar = (regexArray) => {
        // Aceitar um array de regex ou uma regex única
        const regexes = Array.isArray(regexArray) ? regexArray : [regexArray];
        
        for (let regex of regexes) {
            try {
                const match = regex.exec(textoLimpo);
                if (match && match[1]) {
                    const resultado = match[1].replace(/\n/g, ' ').trim();
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
            /SEGURADORA:[:\s]*(AXA SEGUROS|SOMPO|ALLIANZ|MAPFRE|[A-Z\s]+?)(?:\n|$)/i,
            /SEGURADORA[:\s]*([A-Z\s]+?)(?:\n|$)/i,
            /SEGURADO POR[:\s]*([A-Z\s]+?)(?:\n|$)/i
        ]),
        segurado: pegar([
            /SEGURADO:[:\s]*(.*?)(?:CPF|CNPJ|CONTATO|\n)/i,
            /SEGURADO[:\s]*(.*?)(?:\n|$)/i,
            /NOME DO SEGURADO[:\s]*(.*?)(?:\n|$)/i
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

module.exports = { extrairDadosAvancado };