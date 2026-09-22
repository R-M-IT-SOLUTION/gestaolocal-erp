export type Role = "funcionario" | "admin" | "dev";
export type ModuleKey = "dash" | "clientes" | "produtos" | "bancos" | "documentos" | "receber" | "pagar" | "usuarios";
export type Action = "ver" | "incluir" | "alterar" | "excluir";

export interface Client { id: string; codigo: string; nome: string; tipo: string; doc: string; cidade: string; uf: string; status: string }
export interface Product { id: string; codigo: string; descricao: string; unidade: string; categoria: string; preco: number; estoque: number; minimo: number; status: string }
export interface Bank { id: string; banco: string; nomebanco: string; agencia: string; conta: string; saldo: number }
export interface Title { id: string; tipo: "R" | "P"; descricao: string; entidade: string; categoria: string; valor: number; vencimento: string; status: string }
export interface DocumentRecord { id: string; tipo: string; numero: string; serie: string; chave: string; entidade: string; data: string; valor: number; status: string; arquivoNome: string; arquivoTipo?: string; arquivoTamanho?: number; driveUrl: string; anexoAtualizadoEm?: string }
export interface User { id: string; nome: string; usuario: string; senha: string; perfil: Role; status: string }
export type PermissionMap = Partial<Record<Role, Partial<Record<ModuleKey, Action[]>>>>;
export interface Database { clientes: Client[]; produtos: Product[]; bancos: Bank[]; titulos: Title[]; documentos: DocumentRecord[]; perms: PermissionMap; usuarios: User[] }
export type EntityField = [key: string, label: string];
export interface EntityConfig { title: string; store: keyof Database; key: string; fields: EntityField[]; filter?: (row: Record<string, unknown>) => boolean; document?: boolean }

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
  admin: Object.fromEntries(MODULES.map(([key]) => [key, actions()])) as Record<ModuleKey, Action[]>,
  funcionario: { produtos: actions() }
});

const today = new Date();
const iso = (date: Date): string => date.toISOString().slice(0, 10);
const id = (prefix: string, index: number): string => `${prefix}${index}`;

export function seedDatabase(): Database {
  const clientes: Client[] = [
    ["Mercadinho Santa Luzia", "PJ", "12.345.678/0001-90", "Belo Horizonte", "MG"], ["Restaurante Sabor Mineiro", "PJ", "98.765.432/0001-10", "Contagem", "MG"],
    ["Ana Paula Ribeiro", "PF", "123.456.789-09", "Belo Horizonte", "MG"], ["Padaria Pão Quente", "PJ", "45.678.901/0001-23", "Betim", "MG"]
  ].map((item, index) => ({ id: id("c", index), codigo: `C${String(index + 1).padStart(3, "0")}`, nome: item[0], tipo: item[1], doc: item[2], cidade: item[3], uf: item[4], status: "Ativo" }));
  const produtos: Product[] = ([
    ["Café torrado 500g", "UN", "Mercearia", 26.9, 48, 20], ["Açúcar refinado 1kg", "UN", "Mercearia", 5.9, 120, 40],
    ["Arroz tipo 1 5kg", "UN", "Mercearia", 32.9, 9, 15], ["Leite integral cx c/12", "CX", "Laticínios", 64, 22, 10]
  ] as [string, string, string, number, number, number][]).map((item, index) => ({ id: id("p", index), codigo: `P${String(index + 1).padStart(3, "0")}`, descricao: item[0], unidade: item[1], categoria: item[2], preco: item[3], estoque: item[4], minimo: item[5], status: "Ativo" }));
  const titulos: Title[] = [
    { id: "t1", tipo: "R", descricao: "Venda a prazo - NF 2041", entidade: clientes[1].nome, categoria: "Vendas", valor: 3480, vencimento: iso(new Date(today.getTime() - 3 * 86400000)), status: "Aberto" },
    { id: "t2", tipo: "P", descricao: "Energia e água - ref. mês", entidade: "Companhia de Energia", categoria: "Energia e água", valor: 1260, vencimento: iso(new Date(today.getTime() - 86400000)), status: "Aberto" }
  ];
  return {
    clientes, produtos, bancos: [
      { id: "b0", banco: "341", nomebanco: "Itaú Unibanco", agencia: "1234", conta: "56789", saldo: 48250.40 },
      { id: "b1", banco: "001", nomebanco: "Banco do Brasil", agencia: "3210", conta: "11223", saldo: 15780.90 },
      { id: "b2", banco: "104", nomebanco: "Caixa Econômica", agencia: "0456", conta: "99887", saldo: 6120.00 }
    ], titulos, documentos: [
      { id: "d0", tipo: "NF-e", numero: "2041", serie: "1", chave: "31260912345678000190550010000020411000020410", entidade: clientes[1].nome, data: iso(new Date(today.getTime() - 8 * 86400000)), valor: 3480, status: "Arquivado", arquivoNome: "NF-e_2041.jpg", driveUrl: "" },
      { id: "d1", tipo: "Comprovante", numero: "CP-0087", serie: "", chave: "", entidade: "Companhia de Energia", data: iso(new Date(today.getTime() - 3 * 86400000)), valor: 1260, status: "Arquivado", arquivoNome: "comprovante_energia.png", driveUrl: "" },
      { id: "d2", tipo: "Recibo", numero: "REC-014", serie: "", chave: "", entidade: "Fornecedor Demo", data: iso(new Date(today.getTime() - 86400000)), valor: 780, status: "Pendente", arquivoNome: "", driveUrl: "" }
    ], perms: defaultPermissions(), usuarios: [
      { id: "u0", nome: "Desenvolvedor", usuario: "dev", senha: hash("gl::dev123"), perfil: "dev", status: "Ativo" },
      { id: "u1", nome: "Administrador", usuario: "admin", senha: hash("gl::admin123"), perfil: "admin", status: "Ativo" },
      { id: "u2", nome: "Funcionário Estoque", usuario: "funcionario", senha: hash("gl::func123"), perfil: "funcionario", status: "Ativo" }
    ]
  };
}

const fields = (items: [string, string][]): EntityField[] => items;
export const ENTITY_CONFIG: Record<Exclude<ModuleKey, "dash">, EntityConfig> = {
  clientes: { title: "Clientes", store: "clientes", key: "nome", fields: fields([["nome", "Nome / Razão social"], ["tipo", "Tipo"], ["doc", "CPF / CNPJ"], ["cidade", "Cidade"], ["uf", "UF"]]) },
  produtos: { title: "Produtos e estoque", store: "produtos", key: "descricao", fields: fields([["descricao", "Descrição"], ["categoria", "Categoria"], ["unidade", "Unidade"], ["preco", "Preço"], ["estoque", "Estoque"], ["minimo", "Mínimo"]]) },
  bancos: { title: "Bancos", store: "bancos", key: "nomebanco", fields: fields([["nomebanco", "Banco"], ["agencia", "Agência"], ["conta", "Conta"], ["saldo", "Saldo"]]) },
  documentos: { title: "Documentos fiscais", store: "documentos", key: "numero", fields: fields([["tipo", "Tipo"], ["numero", "Número"], ["serie", "Série"], ["chave", "Chave de acesso"], ["entidade", "Emitente / cliente"], ["data", "Data"], ["valor", "Valor"], ["status", "Situação"]]), document: true },
  receber: { title: "Contas a receber", store: "titulos", filter: (row) => row.tipo === "R", key: "descricao", fields: fields([["descricao", "Descrição"], ["entidade", "Cliente"], ["valor", "Valor"], ["vencimento", "Vencimento"], ["status", "Situação"]]) },
  pagar: { title: "Contas a pagar", store: "titulos", filter: (row) => row.tipo === "P", key: "descricao", fields: fields([["descricao", "Descrição"], ["entidade", "Fornecedor"], ["valor", "Valor"], ["vencimento", "Vencimento"], ["status", "Situação"]]) },
  usuarios: { title: "Usuários", store: "usuarios", key: "nome", fields: fields([["nome", "Nome"], ["usuario", "Usuário"], ["perfil", "Perfil"], ["status", "Situação"]]) }
};

export const money = (value: number | string | null | undefined): string => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dateBR = (value: string | undefined): string => value ? value.split("-").reverse().join("/") : "";
