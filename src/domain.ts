export type Role = "funcionario" | "admin" | "dev";
export type ModuleKey = "dash" | "clientes" | "produtos" | "bancos" | "documentos" | "receber" | "pagar" | "usuarios";
export type Action = "ver" | "incluir" | "alterar" | "excluir";

export interface Client {
  id: string; codigo: string; nome: string; tipo: string; doc: string; telefone: string; email: string;
  cidade: string; uf: string; limite: number; status: string;
}
export interface Product {
  id: string; codigo: string; descricao: string; unidade: string; categoria: string;
  custo: number; preco: number; estoque: number; minimo: number; status: string;
}
export interface Bank {
  id: string; banco: string; nomebanco: string; agencia: string; dvag: string; conta: string; dvconta: string;
  subconta: string; saldo: number; operacao: string; iof: number; tabela: string; nrobytes: number;
  cobeletron: string; lote?: string; faixaini?: string; faixafim?: string; bytesext?: number; formatodata?: string;
}
export interface Title {
  id: string; tipo: "R" | "P"; descricao: string; entidade: string; categoria: string; valor: number;
  emissao: string; vencimento: string; banco: string; status: string;
}
export interface DocumentRecord {
  id: string; tipo: string; numero: string; serie: string; chave: string; entidade: string; tituloId: string;
  data: string; valor: number; status: string; arquivoNome: string; arquivoTipo?: string; arquivoTamanho?: number;
  driveUrl: string; observacao?: string; anexoAtualizadoEm?: string;
}
export interface User { id: string; nome: string; usuario: string; senha: string; perfil: Role; status: string }
export type PermissionMap = Partial<Record<Role, Partial<Record<ModuleKey, Action[]>>>>;
export interface Database { clientes: Client[]; produtos: Product[]; bancos: Bank[]; titulos: Title[]; documentos: DocumentRecord[]; perms: PermissionMap; usuarios: User[] }
export type EntityField = [key: string, label: string];
export interface EntityConfig { title: string; store: keyof Database; key: string; fields: EntityField[]; columns: EntityField[]; filter?: (row: any) => boolean; document?: boolean }

export const MODULES: [ModuleKey, string][] = [
  ["dash", "Painel"], ["clientes", "Clientes"], ["produtos", "Produtos e estoque"],
  ["bancos", "Bancos"], ["documentos", "Documentos fiscais"], ["receber", "Contas a receber"],
  ["pagar", "Contas a pagar"], ["usuarios", "Usuários"]
];
export const ACTIONS: [Action, string][] = [["ver", "Acessar"], ["incluir", "Incluir"], ["alterar", "Alterar"], ["excluir", "Excluir"]];
export const ROLES: Record<Role, string> = { funcionario: "Funcionário", admin: "Administrador", dev: "Desenvolvedor" };
export const DEFAULT_USERS: Record<Role, { u: string; p: string }> = {
  funcionario: { u: "funcionario", p: "func123" }, admin: { u: "admin", p: "admin123" }, dev: { u: "dev", p: "dev123" }
};

export const hash = (value: string): string => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};

const actions = (): Action[] => ACTIONS.map(([key]) => key);
export const defaultPermissions = (): PermissionMap => ({
  admin: { dash: actions(), clientes: actions(), produtos: actions(), bancos: actions(), documentos: actions(), receber: actions(), pagar: actions(), usuarios: actions() },
  funcionario: { produtos: actions() }
});

const now = new Date();
const pad = (value: number): string => String(value).padStart(2, "0");
const iso = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const id = (prefix: string, index: number): string => `${prefix}${index}`;

export function seedDatabase(): Database {
  let seed = 7;
  const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const clientesSeed: [string, string, string, string, string, string, number][] = [
    ["Mercadinho Santa Luzia", "PJ", "12.345.678/0001-90", "(31) 3222-1010", "Belo Horizonte", "MG", 8000],
    ["Restaurante Sabor Mineiro", "PJ", "98.765.432/0001-10", "(31) 3344-5566", "Contagem", "MG", 12000],
    ["Ana Paula Ribeiro", "PF", "123.456.789-09", "(31) 99876-1122", "Belo Horizonte", "MG", 1500],
    ["Padaria Pão Quente", "PJ", "45.678.901/0001-23", "(31) 3555-7788", "Betim", "MG", 5000],
    ["Carlos Eduardo Lima", "PF", "987.654.321-00", "(31) 98811-3344", "Nova Lima", "MG", 2500],
    ["Hotel Serra Azul", "PJ", "33.444.555/0001-66", "(31) 3777-9900", "Sabará", "MG", 20000]
  ];
  const clientes: Client[] = clientesSeed.map((c, i) => ({
    id: id("c", i), codigo: `C${pad(i + 1)}0`, nome: c[0], tipo: c[1], doc: c[2], telefone: c[3],
    email: `contato@${c[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}.com.br`, cidade: c[4], uf: c[5], limite: c[6], status: "Ativo"
  }));

  const produtosSeed: [string, string, string, number, number, number, number][] = [
    ["Café torrado 500g", "UN", "Mercearia", 14.5, 26.9, 48, 20], ["Açúcar refinado 1kg", "UN", "Mercearia", 3.2, 5.9, 120, 40],
    ["Arroz tipo 1 5kg", "UN", "Mercearia", 21, 32.9, 9, 15], ["Leite integral cx c/12", "CX", "Laticínios", 42, 64, 22, 10],
    ["Queijo minas frescal", "KG", "Laticínios", 28, 44.9, 6, 8], ["Detergente 500ml", "UN", "Limpeza", 1.9, 3.8, 90, 30],
    ["Sacola plástica pct 100", "PCT", "Embalagens", 7, 12, 35, 12], ["Refrigerante 2L", "UN", "Bebidas", 5.4, 9.5, 64, 24]
  ];
  const produtos: Product[] = produtosSeed.map((p, i) => ({ id: id("p", i), codigo: `P${pad(i + 1)}0`, descricao: p[0], unidade: p[1], categoria: p[2], custo: p[3], preco: p[4], estoque: p[5], minimo: p[6], status: "Ativo" }));

  const bancos: Bank[] = [
    { id: "b0", banco: "341", nomebanco: "Itaú Unibanco", agencia: "1234", dvag: "5", conta: "56789", dvconta: "0", subconta: "001", saldo: 48250.4, operacao: "Cobrança simples", iof: 0, tabela: "17", nrobytes: 400, cobeletron: "1 - Não" },
    { id: "b1", banco: "001", nomebanco: "Banco do Brasil", agencia: "3210", dvag: "X", conta: "11223", dvconta: "4", subconta: "001", saldo: 15780.9, operacao: "Carteira 17", iof: 0, tabela: "17", nrobytes: 400, cobeletron: "2 - Sim" },
    { id: "b2", banco: "104", nomebanco: "Caixa Econômica", agencia: "0456", dvag: "1", conta: "99887", dvconta: "6", subconta: "002", saldo: 6120, operacao: "", iof: 0, tabela: "17", nrobytes: 240, cobeletron: "1 - Não" }
  ];

  const titulos: Title[] = [];
  let n = 1;
  const cats = ["Fornecedores", "Aluguel", "Folha de pagamento", "Energia e água", "Impostos", "Marketing"];
  for (let m = -5; m <= 1; m += 1) {
    for (let k = 0; k < 3; k += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 3 + Math.floor(rnd() * 24));
      const v = iso(d); const past = v < iso(new Date(now.getTime() - 5 * 864e5));
      titulos.push({ id: `t${n++}`, tipo: "R", descricao: ["Venda a prazo", "Encomenda de evento", "Fornecimento mensal"][k], entidade: clientes[Math.floor(rnd() * clientes.length)].nome, categoria: "Vendas", valor: Math.round(900 + rnd() * 5200), emissao: iso(new Date(d.getTime() - 20 * 864e5)), vencimento: v, banco: "341", status: past ? "Pago" : "Aberto" });
    }
    for (let k = 0; k < 3; k += 1) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 2 + Math.floor(rnd() * 25));
      const v = iso(d); const past = v < iso(new Date(now.getTime() - 5 * 864e5));
      const cat = cats[Math.floor(rnd() * cats.length)];
      titulos.push({ id: `t${n++}`, tipo: "P", descricao: `${cat} - ${["ref. mês", "parcela", `NF 1${Math.floor(100 + rnd() * 800)}`][k]}`, entidade: "", categoria: cat, valor: Math.round(500 + rnd() * 4200), emissao: iso(new Date(d.getTime() - 15 * 864e5)), vencimento: v, banco: "341", status: past ? "Pago" : "Aberto" });
    }
  }
  titulos.push({ id: `t${n++}`, tipo: "R", descricao: "Venda a prazo - NF 2041", entidade: clientes[1].nome, categoria: "Vendas", valor: 3480, emissao: iso(new Date(now.getTime() - 20 * 864e5)), vencimento: iso(new Date(now.getTime() - 3 * 864e5)), banco: "341", status: "Aberto" });
  titulos.push({ id: `t${n++}`, tipo: "P", descricao: "Energia e água - ref. mês", entidade: "", categoria: "Energia e água", valor: 1260, emissao: iso(new Date(now.getTime() - 12 * 864e5)), vencimento: iso(new Date(now.getTime() - 1 * 864e5)), banco: "341", status: "Aberto" });

  const documentos: DocumentRecord[] = [
    { id: "d0", tipo: "NF-e", numero: "2041", serie: "1", chave: "31260912345678000190550010000020411000020410", entidade: clientes[1].nome, tituloId: titulos.find((t) => t.tipo === "R" && t.descricao.includes("NF 2041"))?.id || "", data: iso(new Date(now.getTime() - 8 * 864e5)), valor: 3480, status: "Arquivado", arquivoNome: "NF-e_2041.jpg", driveUrl: "" },
    { id: "d1", tipo: "Comprovante", numero: "CP-0087", serie: "", chave: "", entidade: "Companhia de Energia", tituloId: titulos.find((t) => t.tipo === "P" && t.descricao.includes("Energia e água"))?.id || "", data: iso(new Date(now.getTime() - 3 * 864e5)), valor: 1260, status: "Arquivado", arquivoNome: "comprovante_energia.png", driveUrl: "" },
    { id: "d2", tipo: "Recibo", numero: "REC-014", serie: "", chave: "", entidade: "Fornecedor Demo", tituloId: "", data: iso(new Date(now.getTime() - 1 * 864e5)), valor: 780, status: "Pendente", arquivoNome: "", driveUrl: "" }
  ];

  return {
    clientes, produtos, bancos, titulos, documentos, perms: defaultPermissions(), usuarios: [
      { id: "u0", nome: "Desenvolvedor", usuario: "dev", senha: hash("gl::dev123"), perfil: "dev", status: "Ativo" },
      { id: "u1", nome: "Administrador", usuario: "admin", senha: hash("gl::admin123"), perfil: "admin", status: "Ativo" },
      { id: "u2", nome: "Funcionário Estoque", usuario: "funcionario", senha: hash("gl::func123"), perfil: "funcionario", status: "Ativo" }
    ]
  };
}

const fields = (items: [string, string][]): EntityField[] => items;
export const ENTITY_CONFIG: Record<Exclude<ModuleKey, "dash">, EntityConfig> = {
  clientes: {
    title: "Clientes", store: "clientes", key: "nome",
    columns: fields([["codigo", "Código"], ["nome", "Nome / Razão social"], ["doc", "CPF / CNPJ"], ["cidade", "Cidade"], ["telefone", "Telefone"], ["status", "Situação"]]),
    fields: fields([["codigo", "Código"], ["nome", "Nome / Razão social"], ["tipo", "Tipo"], ["doc", "CPF / CNPJ"], ["telefone", "Telefone"], ["email", "E-mail"], ["cidade", "Cidade"], ["uf", "UF"], ["limite", "Limite de crédito"], ["status", "Situação"]])
  },
  produtos: {
    title: "Produtos e estoque", store: "produtos", key: "descricao",
    columns: fields([["codigo", "Código"], ["descricao", "Descrição"], ["categoria", "Categoria"], ["preco", "Preço"], ["estoque", "Estoque"], ["status", "Situação"]]),
    fields: fields([["codigo", "Código"], ["descricao", "Descrição"], ["unidade", "Unidade"], ["categoria", "Categoria"], ["custo", "Custo"], ["preco", "Preço de venda"], ["estoque", "Estoque atual"], ["minimo", "Estoque mínimo"], ["status", "Situação"]])
  },
  bancos: {
    title: "Parâmetros de Bancos", store: "bancos", key: "nomebanco",
    columns: fields([["banco", "Banco"], ["nomebanco", "Nome"], ["agencia", "Agência"], ["conta", "Conta"], ["subconta", "Sub conta"], ["saldo", "Saldo"]]),
    fields: fields([
      ["banco", "Banco"], ["nomebanco", "Nome do banco"], ["agencia", "Agência"], ["dvag", "DV Agência"], ["conta", "Conta"], ["dvconta", "DV Conta"], ["subconta", "Sub Conta"], ["saldo", "Saldo atual"],
      ["tabela", "Tabela"], ["nrobytes", "Nro. Bytes"], ["cobeletron", "Cob. Eletrônica"], ["operacao", "Operação"], ["iof", "IOF (%)"], ["lote", "Lote CNAB"], ["faixaini", "Faixa início"], ["faixafim", "Faixa fim"], ["bytesext", "Bytes extrato"], ["formatodata", "Formato data"]
    ])
  },
  documentos: {
    title: "Documentos fiscais", store: "documentos", key: "numero", document: true,
    columns: fields([["data", "Data"], ["tipo", "Tipo"], ["numero", "Número"], ["entidade", "Emitente / cliente"], ["valor", "Valor"], ["status", "Situação"]]),
    fields: fields([["tipo", "Tipo"], ["numero", "Número"], ["serie", "Série"], ["chave", "Chave de acesso"], ["entidade", "Emitente / cliente"], ["data", "Data"], ["valor", "Valor"], ["tituloId", "Conta a pagar / receber"], ["status", "Situação"], ["arquivoNome", "Arquivo anexado"], ["driveUrl", "Google Drive"], ["observacao", "Observação"]])
  },
  receber: {
    title: "Contas a receber", store: "titulos", filter: (row) => row.tipo === "R", key: "descricao",
    columns: fields([["vencimento", "Vencimento"], ["descricao", "Descrição"], ["entidade", "Cliente"], ["valor", "Valor"], ["status", "Situação"]]),
    fields: fields([["descricao", "Descrição"], ["entidade", "Cliente"], ["categoria", "Categoria"], ["valor", "Valor"], ["emissao", "Emissão"], ["vencimento", "Vencimento"], ["banco", "Banco"], ["status", "Situação"]])
  },
  pagar: {
    title: "Contas a pagar", store: "titulos", filter: (row) => row.tipo === "P", key: "descricao",
    columns: fields([["vencimento", "Vencimento"], ["descricao", "Descrição"], ["categoria", "Categoria"], ["valor", "Valor"], ["status", "Situação"]]),
    fields: fields([["descricao", "Descrição"], ["entidade", "Fornecedor"], ["categoria", "Categoria"], ["valor", "Valor"], ["emissao", "Emissão"], ["vencimento", "Vencimento"], ["banco", "Banco"], ["status", "Situação"]])
  },
  usuarios: {
    title: "Usuários", store: "usuarios", key: "nome",
    columns: fields([["nome", "Nome"], ["usuario", "Usuário"], ["perfil", "Perfil"], ["status", "Situação"]]),
    fields: fields([["nome", "Nome"], ["usuario", "Usuário (login)"], ["perfil", "Perfil"], ["status", "Situação"]])
  }
};

export const money = (value: number | string | null | undefined): string => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dateBR = (value: string | undefined): string => value ? value.split("-").reverse().join("/") : "";
