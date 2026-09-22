# GestãoLocal ERP

Protótipo de ERP para negócios locais: painel, clientes, produtos/estoque, bancos, contas a receber/pagar,
com login por perfil e permissões configuráveis.

## Como rodar no VS Code
1. Instale Node.js 18+.
2. Execute `npm install`.
3. Execute `npm run dev` e abra a URL indicada pelo Vite.

O projeto foi migrado para React + Vite + TypeScript. A aplicação mantém o armazenamento demonstrativo no
`localStorage`, mas agora separa domínio, persistência, componentes e composição da interface em
`src/`. O arquivo `js/app.js` é legado e não é mais carregado pelo navegador.

## Usuários padrão
| Perfil        | Usuário       | Senha     | Acesso inicial                                   |
|---------------|---------------|-----------|--------------------------------------------------|
| Funcionário   | `funcionario` | `func123` | Somente Produtos e estoque (incluir/alterar/excluir) |
| Administrador | `admin`       | `admin123`| Tudo, e gerencia os funcionários                 |
| Desenvolvedor | `dev`         | `dev123`  | Tudo + tela **Permissões** (libera/bloqueia telas e ações) |

Troque as senhas em **Usuários** (o admin altera as dos funcionários; o dev altera todas).

## Acesso pelo celular
- **Mesma rede Wi-Fi:** com `npm run dev` ligado, abra no celular `http://IP-DO-SEU-PC:5173`
  (descubra o IP com `ipconfig` no Windows ou `ifconfig`/`ip a` no Linux/Mac).
- **De qualquer lugar:** publique a pasta em um hospedeiro estático (Netlify, GitHub Pages, Vercel).
- A tela se adapta ao celular: menu lateral recolhível e listas em formato de cartões.

## Estrutura
- `index.html`  documento HTML mínimo que hospeda o root React
- `assets/logo-mark.png`  símbolo R&M (fundo transparente), usado no cabeçalho e no favicon
- `css/style.css`  estilos compartilhados, tema claro/escuro e regras para celular
- `src/main.tsx`  ponto de entrada React
- `src/App.tsx`  composição da aplicação, autenticação, shell e telas
- `src/domain.ts`  entidades, permissões, dados iniciais e formatadores tipados
- `src/storage.ts`  adaptador de persistência no navegador com APIs tipadas
- `src/App.tsx`  menu lateral agrupado como na aplicação original (`Geral`, `Cadastros`,
  `Fiscal / Documentos`, `Financeiro` e `Administração`)
- `js/app.js`  implementação legada mantida apenas como referência histórica

## Plano de migração React

### Etapa 1 — Fundação (concluída)
- Vite como ferramenta de desenvolvimento e build.
- React 18 com `StrictMode`.
- Entrada única em `src/main.tsx`.
- Tipagem estrita (TypeScript/TSX) para domínio, persistência, anexos e interface.
- `localStorage` e `sessionStorage` encapsulados em um adaptador.

### Etapa 2 — Domínio e dados (concluída)
- Entidades, perfis, permissões e seed isolados de componentes.
- Operações de inclusão, alteração, exclusão e filtros realizadas por estado React.
- Compatibilidade mantida com a chave `gestaolocal_db_v2`.

### Etapa 3 — Interface (em andamento)
- Login, dashboard, navegação por módulos, tabelas, formulários, tema e permissões migrados.
- Filtros avançados de documentos e anexos locais (nome, tipo e tamanho) migrados.
- Menu lateral fixo e recolhido por padrão, expandido ao passar o mouse ou receber foco,
  preservando os grupos e a ordem da aplicação original.
- O serviço de anexos mantém metadados localmente e deixa o ponto de integração com Google Drive
  isolado em `src/services/documentAttachments.ts`.
- Próximo incremento: extrair componentes visuais menores e conectar o serviço a OAuth/Google Drive.

### Etapa 4 — Qualidade e produção (planejada)
- Adicionar testes unitários de domínio e testes de fluxo com Playwright.
- Migrar autenticação e persistência para API/backend antes de uso real.
- Adicionar validação de schema, tratamento de erros persistentes e observabilidade.
- Publicar o build Vite no GitHub Pages ou outro host estático.

## Importante: segurança
Este projeto roda só no navegador. Usuários, senhas (com hash simples) e permissões ficam no `localStorage`
de cada aparelho. Isso serve para demonstração e para validar o fluxo, **mas não protege dados de verdade**:
quem abrir as ferramentas do navegador consegue alterar tudo, e cada celular/computador tem sua própria cópia dos dados.
Para uso real com vários usuários, o próximo passo é um backend (API + banco de dados) que valide
o login e as permissões no servidor. O adaptador `src/storage.ts` e o fluxo de login em `src/App.tsx`
são os pontos de integração para substituir o armazenamento local por chamadas à API.


## Atualizações — R&M IT Solutions

### Interface
- Splash de entrada ampliada para aproximadamente 5 segundos.
- Após 60 segundos sem interação, a tela entra em modo de espera com a marca **R&M IT Solutions**. Qualquer interação retorna ao sistema.
- Identidade visual revisada: proporções mais consistentes, paleta azul/grafite neutra e tecnológica e abas com estados mais claros.
- Logo R&M padronizado em `assets/logo-mark.png`, evitando o uso de um PNG com extensão SVG.
- Menu lateral React com botão hambúrguer, expansão por mouse e foco de teclado.

### Documentos fiscais e anexos
Foi incluído o módulo **Documentos fiscais** para registrar NF-e, NFS-e, NFC-e, recibos e comprovantes, com:
- número, série, chave de acesso;
- emitente/cliente;
- data e valor;
- situação de arquivamento;
- nome do arquivo e referência do Google Drive;
- botão 📎 no final de cada linha para anexar/trocar imagem, PDF ou XML.

### Google Drive
A integração foi preparada no `js/app.js` por OAuth 2.0 com escopo `drive.file`. Para ativá-la em um ambiente real, configure `DRIVE_CONFIG.clientId` e opcionalmente `DRIVE_CONFIG.folderId` com um OAuth Client ID criado no Google Cloud Console. Sem essas credenciais, o sistema registra o nome do anexo localmente e não tenta enviar o arquivo para a nuvem.

> Segurança: o Client ID pode ficar no frontend; tokens OAuth não devem ser gravados no localStorage. Em produção, revise também as regras de compartilhamento do Drive e o domínio autorizado do OAuth.

### Pesquisa de mercado
A pesquisa de mercado fica como etapa de validação antes de fechar o escopo comercial. O objetivo é comparar recursos normalmente oferecidos por ERPs para micro e pequenas empresas, especialmente fiscal/documentos, financeiro, estoque, armazenamento de comprovantes, integrações e usabilidade. A implementação atual não apresenta dados de mercado como se fossem fatos sem uma pesquisa documentada.

### Próximos passos
1. Definir o mercado-alvo e concorrentes.
2. Validar os campos fiscais necessários ao negócio.
3. Configurar OAuth/Google Drive.
4. Migrar o armazenamento de `localStorage` para backend/banco de dados quando o sistema sair do modo demonstração.


## Ativação do Google Drive — ambiente real

1. No Google Cloud Console, crie/seleciona um projeto.
2. Ative a **Google Drive API**.
3. Configure a tela de consentimento OAuth.
4. Crie uma credencial OAuth 2.0 do tipo aplicação web.
5. Cadastre o domínio/origem onde o ERP será executado como origem autorizada.
6. Copie o Client ID para:
   `const DRIVE_CONFIG={clientId:"SEU_CLIENT_ID.apps.googleusercontent.com",folderId:"ID_DA_PASTA"};`
7. Se quiser que todos os arquivos sejam enviados para uma pasta específica, informe `folderId`.
8. Teste com uma conta Google separada antes de usar em produção.

A aplicação solicita apenas o escopo `drive.file`, destinado aos arquivos que ela cria/usa pela integração. O projeto atual é um protótipo frontend; para produção, recomenda-se adicionar backend, banco de dados, auditoria, controle de sessão e política de backup.

### Documentos fiscais — pesquisa e vínculo financeiro
O módulo de Documentos fiscais possui filtros por número, chave de acesso, entidade, período e tipo. Cada documento também pode ser associado a um título existente em Contas a pagar ou Contas a receber.

### Identidade visual
No modo claro, a interface utiliza uma paleta mais leve e o azul da marca R&M como cor de destaque. O modo escuro mantém sua configuração atual.
