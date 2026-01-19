function extrairDadosAvancado(texto) {
    console.log('🔍 [pdfHandler] Extraindo dados...');
    
    if (!texto || texto.length === 0) {
        return getDefaultData();
    }
    
    // Limpeza rápida do texto
    texto = texto.replace(/www\.serraecompany\.com\.br/gi, '')
                 .replace(/PLANTÃO 24 HORAS/gi, '')
                 .replace(/0800 770 6607/g, '')
                 .replace(/Página \d+ de \d+/gi, '')
                 .replace(/\r\n/g, '\n');

    // Função de extração otimizada
    const pegar = (regex) => {
        try {
            const match = regex.exec(texto);
            return match && match[1] ? match[1].replace(/\n/g, ' ').trim() : "—";
        } catch (e) {
            return "—";
        }
    };

    const dados = {
        sinistro: pegar(/Nº SINISTRO \(SEC\)[:\s]*(\d+)/i),
        seguradora: pegar(/SEGURADORA:[:\s]*(AXA SEGUROS|SOMPO|ALLIANZ|MAPFRE|[A-Z\s]+)/i),
        segurado: pegar(/SEGURADO:[:\s]*(.*?)(?:CPF\/CNPJ|CONTATO|\n)/i),
        motorista: pegar(/MOTORISTA:[:\s]*(.*?)(?:TELEFONE|\(|\n)/i),
        telMotorista: pegar(/MOTORISTA:.*?TELEFONE:[:\s]*([\(\)\d\s\-]+)/i),
        placas: pegar(/PLACAS:[:\s]*(.*?)(?:REMETENTE|ORIGEM|\n)/i),
        remetente: pegar(/REMETENTE:[:\s]*(.*?)(?:ORIGEM|\n)/i),
        origem: pegar(/ORIGEM:[:\s]*(.*?)(?:\n|DESTINATÁRIO)/i),
        destinatario: pegar(/DESTINATÁRIO:[:\s]*(.*?)(?:DESTINO|\n)/i),
        destino: pegar(/DESTINO:[:\s]*(.*?)(?:\n|LOCAL DO EVENTO)/i),
        localEvento: pegar(/LOCAL DO EVENTO:[:\s]*([\s\S]*?)CIDADE:/i), 
        cidadeEvento: pegar(/LOCAL DO EVENTO:.*?CIDADE:[:\s]*(.*?)(?:\n|LOCAL DA VISTORIA)/i),
        localVistoria: pegar(/LOCAL DA VISTORIA:[:\s]*(.*?)(?:CIDADE|\n)/i),
        cidadeVistoria: pegar(/LOCAL DA VISTORIA:.*?CIDADE:[:\s]*(.*?)(?:\n|NATUREZA)/i),
        natureza: pegar(/NATUREZA:[:\s]*(.*?)(?:DATA|\n)/i),
        manifesto: pegar(/MANIFESTO Nº:[:\s]*(.*?)(?:DATA|\n)/i),
        nf: pegar(/FATURA\/N\.FISCAL:[:\s]*(.*?)(?:DATA|\n)/i),
        mercadoria: pegar(/MERCADORIA:[:\s]*(.*?)(?:DANOS|\n)/i),
        valor: pegar(/VALOR DECLARADO:[:\s]*(R\$\s*[\d\.,]+)/i),
        obs: pegar(/OBSERVAÇÃO:[:\s]*([\s\S]+?)$/i)
    };
    
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