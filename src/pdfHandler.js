function extrairDadosAvancado(texto) {
    console.log('🔍 [pdfHandler] Iniciando extração de dados...');
    console.log('📝 [pdfHandler] Comprimento do texto:', texto.length, 'caracteres');
    
    if (!texto || texto.length === 0) {
        console.error('❌ [pdfHandler] Texto vazio recebido!');
        return getDefaultData();
    }
    
    texto = texto.replace(/www\.serraecompany\.com\.br/gi, '')
                 .replace(/PLANTÃO 24 HORAS/gi, '')
                 .replace(/0800 770 6607/g, '')
                 .replace(/Página \d+ de \d+/gi, '')
                 .replace(/REF\. CORRETOR:/gi, '')
                 .replace(/REF\. OUTROS:/gi, '')
                 .replace(/\r\n/g, '\n');

    const pegar = (fieldName, regex) => {
        const match = texto.match(regex);
        const valor = match && match[1] ? match[1].replace(/\n/g, ' ').trim() : "—";
        if (valor !== "—") {
            console.log(`  ✓ ${fieldName}: ${valor.substring(0, 50)}${valor.length > 50 ? '...' : ''}`);
        }
        return valor;
    };

    const dados = {
        sinistro: pegar('Nº SINISTRO', /Nº SINISTRO \(SEC\)[:\s]*(\d+)/i),
        seguradora: pegar('SEGURADORA', /MODALIDADE:.*?SEGURADORA:[:\s]*(.*?)(?:\n|SEGURADO)/is) || pegar('SEGURADORA (alt)', /SEGURADORA:[:\s]*(AXA SEGUROS|SOMPO|ALLIANZ|MAPFRE)/i),
        segurado: pegar('SEGURADO', /SEGURADO:[:\s]*(.*?)(?:CPF\/CNPJ|CONTATO)/i),
        motorista: pegar('MOTORISTA', /MOTORISTA:[:\s]*(.*?)(?:TELEFONE|\()/i),
        telMotorista: pegar('TELEFONE', /MOTORISTA:.*?TELEFONE:[:\s]*([\(\)\d\s\-]+)/i),
        placas: pegar('PLACAS', /PLACAS:[:\s]*(.*?)(?:REMETENTE|ORIGEM|NÃO INFORMADO|\n)/i),
        remetente: pegar('REMETENTE', /REMETENTE:[:\s]*(.*?)(?:ORIGEM|\n)/i),
        origem: pegar('ORIGEM', /ORIGEM:[:\s]*(.*?)(?:\n|DESTINATÁRIO)/i),
        destinatario: pegar('DESTINATÁRIO', /DESTINATÁRIO:[:\s]*(.*?)(?:DESTINO|\n)/i),
        destino: pegar('DESTINO', /DESTINO:[:\s]*(.*?)(?:\n|LOCAL DO EVENTO)/i),
        localEvento: pegar('LOCAL DO EVENTO', /LOCAL DO EVENTO:[:\s]*([\s\S]*?)CIDADE:/i), 
        cidadeEvento: pegar('CIDADE EVENTO', /LOCAL DO EVENTO:.*?CIDADE:[:\s]*(.*?)(?:\n|LOCAL DA VISTORIA)/i),
        localVistoria: pegar('LOCAL DA VISTORIA', /LOCAL DA VISTORIA:[:\s]*(.*?)(?:CIDADE|\n)/i),
        cidadeVistoria: pegar('CIDADE VISTORIA', /LOCAL DA VISTORIA:.*?CIDADE:[:\s]*(.*?)(?:\n|NATUREZA)/i),
        natureza: pegar('NATUREZA', /NATUREZA:[:\s]*(.*?)(?:DATA|\n)/i),
        manifesto: pegar('MANIFESTO', /MANIFESTO Nº:[:\s]*(.*?)(?:DATA|\n)/i),
        nf: pegar('FATURA/N.FISCAL', /FATURA\/N\.FISCAL:[:\s]*(.*?)(?:DATA|\n)/i),
        mercadoria: pegar('MERCADORIA', /MERCADORIA:[:\s]*(.*?)(?:DANOS|\n)/i),
        valor: pegar('VALOR DECLARADO', /VALOR DECLARADO:[:\s]*(R\$\s*[\d\.,]+)/i),
        obs: pegar('OBSERVAÇÃO', /OBSERVAÇÃO:[:\s]*([\s\S]+?)$/i)
    };
    
    console.log('✅ [pdfHandler] Extração concluída');
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