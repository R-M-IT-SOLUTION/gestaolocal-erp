# GestãoLocal ERP

Protótipo de ERP para negócios locais: painel, clientes, produtos/estoque, bancos, contas a receber/pagar,
com login por perfil e permissões configuráveis.

## Como rodar no VS Code
1. Abra a pasta `gestaolocal-erp` no VS Code.
2. Instale a extensão **Live Server** e clique em **Open with Live Server** no `index.html`.

## Usuários padrão
| Perfil        | Usuário       | Senha     | Acesso inicial                                   |
|---------------|---------------|-----------|--------------------------------------------------|
| Funcionário   | `funcionario` | `func123` | Somente Produtos e estoque (incluir/alterar/excluir) |
| Administrador | `admin`       | `admin123`| Tudo, e gerencia os funcionários                 |
| Desenvolvedor | `dev`         | `dev123`  | Tudo + tela **Permissões** (libera/bloqueia telas e ações) |

Troque as senhas em **Usuários** (o admin altera as dos funcionários; o dev altera todas).

## Acesso pelo celular
- **Mesma rede Wi-Fi:** com o Live Server ligado, abra no celular `http://IP-DO-SEU-PC:5500`
  (descubra o IP com `ipconfig` no Windows ou `ifconfig`/`ip a` no Linux/Mac).
- **De qualquer lugar:** publique a pasta em um hospedeiro estático (Netlify, GitHub Pages, Vercel).
- A tela se adapta ao celular: menu lateral recolhível e listas em formato de cartões.

## Estrutura
- `index.html`  estrutura, incluindo a animação de entrada e a tela de login
- `assets/rm-logo.svg`  símbolo R&M (fundo transparente), usado no cabeçalho e na animação
- `css/style.css`  estilos, tema claro/escuro e regras para celular
- `js/app.js`  dados demo, login, permissões, telas, formulários e dashboard

## Importante: segurança
Este projeto roda só no navegador. Usuários, senhas (com hash simples) e permissões ficam no `localStorage`
de cada aparelho. Isso serve para demonstração e para validar o fluxo, **mas não protege dados de verdade**:
quem abrir as ferramentas do navegador consegue alterar tudo, e cada celular/computador tem sua própria cópia dos dados.
Para uso real com vários usuários, o próximo passo é um backend (API + banco de dados) que valide
o login e as permissões no servidor. As funções `save()`, o carregamento de `db` e `attemptLogin()` em
`js/app.js` são os pontos a trocar por chamadas à API.


## Atualizações — R&M IT Solutions

### Interface
- Splash de entrada ampliada para aproximadamente 5 segundos.
- Após 60 segundos sem interação, a tela entra em modo de espera com a marca **R&M IT Solutions**. Qualquer interação retorna ao sistema.
- Identidade visual revisada: proporções mais consistentes, paleta azul/grafite neutra e tecnológica e abas com estados mais claros.
- Novo vetor `assets/rm-logo.svg`, usado na tela de inatividade.

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
