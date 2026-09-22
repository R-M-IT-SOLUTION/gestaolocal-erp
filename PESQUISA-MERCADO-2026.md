# Pesquisa de mercado — ERP para micro e pequenas empresas no Brasil
Data da pesquisa: 21/09/2026

## Objetivo
Identificar funcionalidades recorrentes e oportunidades para o GestãoLocal ERP, sem tratar um fornecedor como vencedor universal.

## Observações do mercado
- Conteúdos comparativos recentes de 2026 descrevem o mercado de ERP para PME como segmentado por perfil operacional: e-commerce/marketplaces, financeiro/contábil, ou gestão mais ampla.
- Integração de estoque, emissão fiscal, contas a pagar/receber e integrações com canais de venda aparecem repetidamente como capacidades centrais.
- O Bling, por exemplo, apresenta integração com e-commerce, marketplaces e logística, sincronização de estoque, emissão de NF-e e gestão financeira; também informa disponibilizar API pública para integrações específicas.
- O Sebrae informou em março de 2026 que havia quase 24 milhões de pequenos negócios em funcionamento no último trimestre de 2025, com base em dados da Receita Federal. Isso reforça a existência de um mercado amplo de pequenos negócios, mas não significa que todos sejam potenciais clientes do sistema.

## Implicações para o GestãoLocal
1. **Fiscal/documentos:** o sistema deve evoluir de simples cadastro de documentos para armazenamento organizado de NF-e, NFS-e, NFC-e, recibos e comprovantes.
2. **Anexos:** cada documento deve ter um acesso rápido ao arquivo, por isso foi incluído o clipe 📎 no final da linha.
3. **Nuvem:** o Google Drive pode ser usado como camada de armazenamento de arquivos, mantendo os dados estruturados no banco do ERP.
4. **Financeiro + estoque:** manter o vínculo entre documento, entidade, valor e movimentação financeira.
5. **Integrações:** prever uma camada de API para não prender o sistema a um único fornecedor.
6. **Simplicidade:** para pequenas empresas, manter a interface enxuta e evitar excesso de campos obrigatórios.
7. **Validação:** antes de definir preço e pacote comercial, entrevistar empresas reais e mapear segmento, número de usuários, volume de documentos, necessidade fiscal e canais de venda.

## Escopo recomendado para a próxima fase
- Cadastro e arquivamento de documentos fiscais.
- Upload para Google Drive.
- Pesquisa por número, chave, entidade, período e tipo.
- Pré-visualização de imagem/PDF.
- Associação de documento a contas a pagar/receber.
- Histórico de anexos.
- Backup e permissões.
- Backend + banco de dados, substituindo o `localStorage` usado atualmente no protótipo.

## Fontes consultadas
- Sebrae / Agência Sebrae de Notícias — “Brasil tem recorde de CNPJ ativos de pequenos negócios”, 18/03/2026.
- Bling — páginas oficiais de integrações e recursos de ERP.
- Comparativos independentes de ERP publicados em 2026 foram usados apenas como material complementar para identificar critérios recorrentes; preços e rankings desses sites não foram adotados como decisão de produto.
