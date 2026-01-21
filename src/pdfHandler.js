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

    const capture = (labelRegexStr, stopAtFirstLine = false) => {
        const re = new RegExp(
            `(?:^|\\n)\\s*(?:${labelRegexStr})\\s*[:\\-]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${LABELS_MASTER})\\s*[:\\-]|$)`,
            'i'
        );
        const m = re.exec(texto);
        if (!m || !m[1]) return '--';
        
        let resultado = m[1].trim();
        
        // Se stopAtFirstLine = true, pega apenas a primeira linha
        if (stopAtFirstLine) {
            resultado = resultado.split('\n')[0].trim();
        }
        
        // Limpar espaços múltiplos
        resultado = resultado.replace(/[ \t]+/g, ' ');
        
        return resultado || '--';
    };

    const captureCidadeEvento = () => {
        // Captura apenas o que vem depois de "CIDADE:" até a próxima linha
        const re = new RegExp(
            `LOCAL\\s+DO\\s+EVENTO[\\s\\S]*?CIDADE\\s*[:\\-]\\s*([^\\n]+)`,
            'i'
        );
        const m = re.exec(texto);
        if (m && m[1]) return m[1].trim().replace(/[ \t]+/g, ' ');
        return '--';
    };

    const captureCidadeVistoria = () => {
        // Captura apenas o que vem depois de "CIDADE:" até a próxima linha
        const re = new RegExp(
            `LOCAL\\s+DA\\s+VISTORIA[\\s\\S]*?CIDADE\\s*[:\\-]\\s*([^\\n]+)`,
            'i'
        );
        const m = re.exec(texto);
        if (m && m[1]) return m[1].trim().replace(/[ \t]+/g, ' ');
        return '--';
    };

    const captureLocalEvento = () => {
        // Captura apenas até encontrar "CIDADE:" ou próximo label
        const re = new RegExp(
            `LOCAL\\s+DO\\s+EVENTO\\s*[:\\-]\\s*([^\\n]+?)(?=\\s*CIDADE|\\n|$)`,
            'i'
        );
        const m = re.exec(texto);
        if (m && m[1]) return m[1].trim().replace(/[ \t]+/g, ' ');
        return '--';
    };

    const captureLocalVistoria = () => {
        // Captura apenas até encontrar "CIDADE:" ou próximo label
        const re = new RegExp(
            `LOCAL\\s+DA\\s+VISTORIA\\s*[:\\-]\\s*([^\\n]+?)(?=\\s*CIDADE|\\n|$)`,
            'i'
        );
        const m = re.exec(texto);
        if (m && m[1]) return m[1].trim().replace(/[ \t]+/g, ' ');
        return '--';
    };

    const sinistro = capture('N[º°]\\s*SINISTRO(?:\\s*\\(SEC\\))?', true);
    const seguradora = capture('SEGURADORA', true);
    const segurado = capture('SEGURADO', true);
    const motorista = capture('MOTORISTA', true);
    const telefone = capture('TELEFONE', true);
    const placas = capture('PLACAS?', true);
    const remetente = capture('REMETENTE', true);
    const origem = capture('ORIGEM', true);
    const destinatario = capture('DESTINAT[ÁA]RIO', true);
    const destino = capture('DESTINO', true);
    const localEvento = captureLocalEvento();
    const cidadeEvento = captureCidadeEvento();
    const localVistoria = captureLocalVistoria();
    const cidadeVistoria = captureCidadeVistoria();
    const natureza = capture('NATUREZA', true);
    const manifesto = capture('MANIFESTO(?:\\s*N[º°])?', true);
    const fatura = capture('FATURA\\/?N\\.?FISCAL', true);
    const mercadoria = capture('MERCADORIA', true);
    const valorDeclarado = capture('VALOR\\s+DECLARADO', true);
    const observacaoRaw = capture('OBSERVA[ÇC][ÃA]O|OBSERVA[ÇC][ÕO]ES');
    const observacao = observacaoRaw.length > 500 ? observacaoRaw.substring(0, 500) + '...' : observacaoRaw;

    return '✅ *RESUMO DO AVISO GERADO*\n\n' + [
        `• *Nº sinistro:* ${sinistro}`,
        `• *Seguradora:* ${seguradora}`,
        `• *Segurado:* ${segurado}`,
        `• *Motorista:* ${motorista}`,
        `• *Telefone:* ${telefone}`,
        `• *Placas:* ${placas}`,
        `• *Remetente:* ${remetente}`,
        `• *Origem:* ${origem}`,
        `• *Destinatário:* ${destinatario}`,
        `• *Destino:* ${destino}`,
        `• *Local do evento:* ${localEvento}`,
        `• *Cidade do evento:* ${cidadeEvento}`,
        `• *Local da vistoria:* ${localVistoria}`,
        `• *Cidade da vistoria:* ${cidadeVistoria}`,
        `• *Natureza:* ${natureza}`,
        `• *Manifesto:* ${manifesto}`,
        `• *Fatura/NF:* ${fatura}`,
        `• *Mercadoria:* ${mercadoria}`,
        `• *Valor declarado:* ${valorDeclarado}`,
        `• *Observação:* ${observacao}`
    ].join('\n');
}