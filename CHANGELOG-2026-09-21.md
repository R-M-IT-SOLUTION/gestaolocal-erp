# Atualização 2026-09-21

- Splash de entrada: ~5 s.
- Tela de espera por inatividade: 60 s, com R&M IT Solutions.
- Identidade visual: paleta, abas, proporções e novo SVG.
- Novo módulo Documentos fiscais.
- Entrada/arquivamento de NF-e, NFS-e, NFC-e, recibos e comprovantes.
- Clipe 📎 no final da linha para anexos.
- Integração preparada com Google Drive via OAuth 2.0 + Drive API.
- Pesquisa inicial de mercado registrada em `PESQUISA-MERCADO-2026.md`.

## Atualização adicional — filtros, vínculos e tema claro
- Documentos fiscais: pesquisa específica por número, chave de acesso, entidade, período (De/Até) e tipo.
- Documentos fiscais: campo para associação direta a um título de Contas a pagar ou Contas a receber.
- Ao associar um título, valor e entidade podem ser preenchidos automaticamente quando disponíveis.
- Modo dia refinado com fundo, barras, campos e separadores mais claros.
- Azul da identidade R&M (`#1778B4` / `#34B5E4`) passou a ser a cor principal de destaque no modo dia.
# Migração React

- Adicionada aplicação React 18 com Vite e configuração de desenvolvimento/build.
- Separados domínio, seed, permissões e formatadores em `src/domain.js`.
- Encapsulada a persistência de `localStorage` e `sessionStorage` em `src/storage.js`.
- Migrados login, dashboard, navegação, CRUD, tema e editor de permissões para componentes React.
- Atualizado o ponto de entrada para `src/main.jsx`; o `js/app.js` antigo não é mais carregado.
- Adicionados filtros por número, chave, entidade, período e tipo em Documentos fiscais.
- Adicionado fluxo de seleção de anexos com persistência local de metadados.
- Adicionados testes de domínio em `test/domain.test.js` e script `npm test`.
- Refeito o menu lateral React com os mesmos grupos da aplicação legada:
  `Geral`, `Cadastros`, `Fiscal / Documentos`, `Financeiro` e `Administração`.
- O menu permanece fixo, recolhido visualmente e expande por mouse ou foco de teclado.
- Incluídos dados fictícios de bancos e recuperação dos dados de demonstração para stores vazias.
- Adicionado botão hambúrguer ao menu lateral, com expansão por mouse e foco de teclado.
- Corrigida a referência do logo R&M para `assets/logo-mark.png`, um PNG válido usado no cabeçalho e favicon.
- Refinada a responsividade de login, cabeçalho, menu, formulários, filtros e listagens.
- Listagens passam a usar cartões em telas pequenas, evitando quebra horizontal e mantendo as ações acessíveis.
- Removida a navegação por abas da barra superior; a navegação principal agora fica exclusivamente na barra lateral.
- Movido o controle de tema para a barra lateral e ajustada sua posição após a remoção da barra superior.
- Revisão de UI/UX concluída nos fluxos de login, painel, cadastros, documentos, financeiro e permissões.
- Validada a ausência de overflow horizontal em 1440, 1024, 768, 540, 390 e 320 pixels.
- Tabela de permissões recebeu área de rolagem horizontal controlada em telas pequenas.
- Ícones da barra lateral substituídos por SVG inline consistentes, com melhor contraste, escala e acessibilidade.
## Migração TypeScript

- Conversão da aplicação React, domínio, persistência, anexos, configuração Vite e testes para TypeScript/TSX.
- Adicionados `tsconfig.json`, `tsconfig.node.json`, verificação com `npm run type-check` e execução de testes TS com `tsx`.
- APIs de `localStorage`, `sessionStorage`, arquivos e entidades do domínio receberam tipos explícitos.
