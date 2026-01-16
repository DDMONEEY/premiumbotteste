function extrairDadosAvancado(texto) {
    texto = texto.replace(/www\.serraecompany\.com\.br/gi, '')
                 .replace(/PLANTÃO 24 HORAS/gi, '')
                 .replace(/0800 770 6607/g, '')
                 .replace(/Página \d+ de \d+/gi, '')
                 .replace(/REF\. CORRETOR:/gi, '')
                 .replace(/REF\. OUTROS:/gi, '')
                 .replace(/\r\n/g, '\n');

    const pegar = (regex) => {
        const match = texto.match(regex);
        return match && match[1] ? match[1].replace(/\n/g, ' ').trim() : "—";
    };

    return {
        sinistro: pegar(/Nº SINISTRO \(SEC\)[:\s]*(\d+)/i),
        seguradora: pegar(/MODALIDADE:.*?SEGURADORA:[:\s]*(.*?)(?:\n|SEGURADO)/is) || pegar(/SEGURADORA:[:\s]*(AXA SEGUROS|SOMPO|ALLIANZ|MAPFRE)/i),
        segurado: pegar(/SEGURADO:[:\s]*(.*?)(?:CPF\/CNPJ|CONTATO)/i),
        motorista: pegar(/MOTORISTA:[:\s]*(.*?)(?:TELEFONE|\()/i),
        telMotorista: pegar(/MOTORISTA:.*?TELEFONE:[:\s]*([\(\)\d\s\-]+)/i),
        placas: pegar(/PLACAS:[:\s]*(.*?)(?:REMETENTE|ORIGEM|NÃO INFORMADO|\n)/i),
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
}

module.exports = { extrairDadosAvancado };