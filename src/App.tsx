import React, { useEffect, useMemo, useState } from "react";
import { ACTIONS, DEFAULT_USERS, ENTITY_CONFIG, MODULES, ROLES, dateBR, defaultPermissions, hash, money } from "./domain";
import { clearSession, loadDatabase, loadSession, saveDatabase, saveSession } from "./storage";
import { storeAttachment } from "./services/documentAttachments";
import logoUrl from "../assets/logo-mark.png";

const LOGO = logoUrl;
const can = (user, db, module, action = "ver") => user?.perfil === "dev" || Boolean(db.perms?.[user?.perfil]?.[module]?.includes(action));

function Login({ onLogin, db }) {
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ usuario: "", senha: "" });
  const [error, setError] = useState("");
  const submit = (event) => {
    event.preventDefault();
    const found = db.usuarios.find((item) => item.usuario.toLowerCase() === form.usuario.trim().toLowerCase());
    if (!found || found.senha !== hash(`gl::${form.senha}`) || found.perfil !== role || found.status !== "Ativo") {
      setError("Usuário ou senha incorretos, perfil inválido ou usuário inativo.");
      return;
    }
    onLogin(found);
  };
  return <div className="react-login"><header><div className="brand-left"><img src={LOGO} alt="R&M" /><strong>GestãoLocal</strong></div><span>R&M IT Solutions</span></header>
    <section className="lg-card"><h1>{role ? ROLES[role] : "Quem vai entrar?"}</h1><p className="sub">{role ? "Entre com seu usuário e senha." : "Escolha o seu perfil de acesso."}</p>
      {!role ? <div className="roles">{Object.entries(ROLES).map(([key, label]) => <button className="role" key={key} onClick={() => { setRole(key); setForm(DEFAULT_USERS[key] ? { usuario: DEFAULT_USERS[key].u, senha: DEFAULT_USERS[key].p } : form); }}><b>{label}</b><small>{key === "funcionario" ? "Estoque e produtos" : key === "admin" ? "Gestão completa do negócio" : "Define quem pode fazer o quê"}</small></button>)}</div> :
        <form onSubmit={submit}><label>Usuário<input autoFocus value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} /></label><label>Senha<input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} /></label>{error && <div className="lg-err">{error}</div>}<div className="actions"><button type="button" className="btn" onClick={() => { setRole(null); setError(""); }}>Voltar</button><button className="btn primary">Entrar</button></div></form>}
    </section></div>;
}

function Dashboard({ db }) {
  const receivable = db.titulos.filter((item) => item.tipo === "R" && item.status !== "Pago").reduce((sum, item) => sum + Number(item.valor), 0);
  const payable = db.titulos.filter((item) => item.tipo === "P" && item.status !== "Pago").reduce((sum, item) => sum + Number(item.valor), 0);
  const lowStock = db.produtos.filter((item) => Number(item.estoque) <= Number(item.minimo)).length;
  return <><div className="screen-head"><h2>Painel</h2></div><div className="kpis"><div className="kpi"><small>A receber</small><strong>{money(receivable)}</strong></div><div className="kpi k-bad"><small>A pagar</small><strong>{money(payable)}</strong></div><div className="kpi k-amber"><small>Estoque baixo</small><strong>{lowStock}</strong><em>produto(s) para repor</em></div><div className="kpi k-ok"><small>Clientes ativos</small><strong>{db.clientes.filter((item) => item.status === "Ativo").length}</strong></div></div></>;
}

function DataList({ module, db, setDb, user, notify, onNew }) {
  const config = ENTITY_CONFIG[module];
  const [query, setQuery] = useState("");
  const [docFilters, setDocFilters] = useState({ numero: "", chave: "", entidade: "", de: "", ate: "", tipo: "" });
  const rows = useMemo(() => (db[config.store] || [])
    .filter(config.filter || (() => true))
    .filter((row) => config.document ? (!docFilters.numero || String(row.numero || "").toLowerCase().includes(docFilters.numero.toLowerCase()))
      && (!docFilters.chave || String(row.chave || "").toLowerCase().includes(docFilters.chave.toLowerCase()))
      && (!docFilters.entidade || String(row.entidade || "").toLowerCase().includes(docFilters.entidade.toLowerCase()))
      && (!docFilters.de || String(row.data || "") >= docFilters.de)
      && (!docFilters.ate || String(row.data || "") <= docFilters.ate)
      && (!docFilters.tipo || row.tipo === docFilters.tipo)
      : Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase()))), [db, config, query, docFilters]);
  const remove = (row) => { if (!window.confirm("Excluir este registro?")) return; setDb((current) => ({ ...current, [config.store]: current[config.store].filter((item) => item.id !== row.id) })); notify("Registro excluído"); };
  const attach = async (row, file) => {
    try {
      const updated = await storeAttachment(file, row);
      setDb((current) => ({ ...current, documentos: current.documentos.map((item) => item.id === row.id ? updated : item) }));
      notify("Anexo atualizado");
    } catch (error) { notify(error.message); }
  };
  return <><div className="screen-head"><h2>{config.title}</h2><div className="actions">{can(user, db, module, "incluir") && <button className="btn primary" onClick={onNew}>Incluir</button>}</div></div><div className="tbl-wrap">{config.document ? <div className="doc-filterbar"><input aria-label="N?mero" placeholder="N?mero" value={docFilters.numero} onChange={(event) => setDocFilters({ ...docFilters, numero: event.target.value })} /><input aria-label="Chave de acesso" placeholder="Chave de acesso" value={docFilters.chave} onChange={(event) => setDocFilters({ ...docFilters, chave: event.target.value })} /><input aria-label="Entidade" placeholder="Emitente / cliente" value={docFilters.entidade} onChange={(event) => setDocFilters({ ...docFilters, entidade: event.target.value })} /><input aria-label="De" type="date" value={docFilters.de} onChange={(event) => setDocFilters({ ...docFilters, de: event.target.value })} /><input aria-label="At?" type="date" value={docFilters.ate} onChange={(event) => setDocFilters({ ...docFilters, ate: event.target.value })} /><select aria-label="Tipo" value={docFilters.tipo} onChange={(event) => setDocFilters({ ...docFilters, tipo: event.target.value })}><option value="">Todos os tipos</option>{["NF-e", "NFS-e", "NFC-e", "Recibo", "Comprovante"].map((type) => <option key={type} value={type}>{type}</option>)}</select><button className="btn" onClick={() => setDocFilters({ numero: "", chave: "", entidade: "", de: "", ate: "", tipo: "" })}>Limpar</button></div> : <div className="toolbar"><input type="search" placeholder={`Buscar em ${config.title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} /><span className="count">{rows.length} registro(s)</span></div>}<table className="tbl-list"><thead><tr>{config.fields.map(([, label]) => <th key={label}>{label}</th>)}<th /></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id}>{config.fields.map(([key, label]) => <td data-l={label} key={key} className={["valor", "preco", "saldo"].includes(key) ? "num" : ""}>{key === "valor" || key === "preco" || key === "saldo" ? money(row[key]) : key === "vencimento" || key === "data" ? dateBR(row[key]) : String(row[key] ?? "")}</td>)}<td data-l="A??es" className="act">{config.document && can(user, db, module, "alterar") && <label className="file-action">Ã°Å¸â€œÅ½{row.arquivoNome ? " Ã¢Å“â€œ" : ""}<input type="file" accept=".pdf,.xml,image/*" onChange={(event) => attach(row, event.target.files?.[0])} /></label>}{can(user, db, module, "alterar") && <button onClick={() => onNew(row)}>Alterar</button>}{can(user, db, module, "excluir") && <button className="del" onClick={() => remove(row)}>Excluir</button>}</td></tr>) : <tr><td colSpan={config.fields.length + 1} className="empty">Nenhum registro encontrado.</td></tr>}</tbody></table></div></>;
}

function Form({ module, record, db, setDb, user, onClose, notify }) {
  const config = ENTITY_CONFIG[module];
  const [draft, setDraft] = useState(() => ({ ...(record || {}), status: record?.status || "Ativo" }));
  const save = (event) => {
    event.preventDefault();
    if (!draft[config.key]) { notify("Preencha o campo principal"); return; }
    let value = { ...draft, id: draft.id || `${config.store}-${Date.now()}` };
    if (module === "usuarios" && draft.senha) value.senha = hash(`gl::${draft.senha}`);
    setDb((current) => ({ ...current, [config.store]: draft.id ? current[config.store].map((item) => item.id === draft.id ? { ...item, ...value } : item) : [...current[config.store], value] }));
    notify(record ? "Altera??es salvas" : "Registro inclu?do"); onClose();
  };
  return <div className="form-wrap"><form onSubmit={save}><div className="fgrid">{config.fields.map(([key, label]) => <div className="fld" key={key}><label>{label}</label><input type={["valor", "preco", "saldo", "estoque", "minimo"].includes(key) ? "number" : key === "data" || key === "vencimento" ? "date" : "text"} value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></div>)}{module === "usuarios" && <div className="fld"><label>Senha</label><input type="password" value={draft.senha || ""} onChange={(event) => setDraft({ ...draft, senha: event.target.value })} /></div>}</div><div className="form-actions"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn primary">Salvar</button></div></form></div>;
}

const NAV_GROUPS: [string, [string, string][]][] = [
  ["Geral", [["dash", "Painel"]]],
  ["Cadastros", [["clientes", "Clientes"], ["produtos", "Produtos e estoque"], ["bancos", "Bancos"]]],
  ["Fiscal / Documentos", [["documentos", "Documentos fiscais"]]],
  ["Financeiro", [["receber", "Contas a receber"], ["pagar", "Contas a pagar"]]],
  ["Administração", [["usuarios", "Usuários"], ["permissoes", "Permissões"]]]
];
type IconName = "dashboard" | "customers" | "products" | "bank" | "document" | "receivable" | "payable" | "users" | "settings" | "restore" | "theme" | "logout";

const NAV_ICONS: Record<string, IconName> = {
  dash: "dashboard",
  clientes: "customers",
  produtos: "products",
  bancos: "bank",
  documentos: "document",
  receber: "receivable",
  pagar: "payable",
  usuarios: "users",
  permissoes: "settings"
};

function SidebarIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><path d="M4 11 12 4l8 7" /><path d="M6 10v9h12v-9M9 19v-5h6v5" /></>,
    customers: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.5-3 2.8-5 7-5s6.5 2 7 5M17 5.5a2.5 2.5 0 0 1 0 5M19 15c1.8.6 2.7 1.8 3 3.5" /></>,
    products: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 4v16M14 14h3M14 17h3" /></>,
    bank: <><path d="m3 9 9-5 9 5" /><path d="M5 10v7M9 10v7M15 10v7M19 10v7M3 20h18M2 9h20" /></>,
    document: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
    receivable: <><path d="M5 19 19 5M9 5h10v10" /><path d="M5 14v5h5" /></>,
    payable: <><path d="m5 5 14 14M15 19H5V9" /><path d="M19 10V5h-5" /></>,
    users: <><circle cx="12" cy="8" r="3" /><path d="M5 20c.5-3 2.8-5 7-5s6.5 2 7 5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1-1.8 3.1-.2-.1a2 2 0 0 0-2.5.8l-.1.2h-3.6l-.1-.2a2 2 0 0 0-2.5-.8l-.2.1-1.8-3.1.1-.1a2 2 0 0 0 0-2.8l-.1-.1 1.8-3.1.2.1a2 2 0 0 0 2.5-.8l.1-.2h3.6l.1.2a2 2 0 0 0 2.5.8l.2-.1 1.8 3.1-.1.1a2 2 0 0 0 0 2.8Z" /></>,
    restore: <><path d="M4 10a8 8 0 1 1 2.3 5.7" /><path d="M4 4v6h6" /></>,
    theme: <><path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H8" /></>
  };
  return <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function Sidebar({ available, active, setActive, user, setDb, notify, logout, theme, setTheme }) {
  const navigate = (key) => setActive(key);
  return <nav className="side" aria-label="Menu principal">
    <button className="menu-trigger" aria-label="Abrir menu lateral" title="Abrir menu lateral"><span /><span /><span /></button>
    {NAV_GROUPS.map(([group, entries]) => {
      const visible = entries.filter(([key]) => key === "permissoes" ? user.perfil === "dev" : available.some(([availableKey]) => availableKey === key));
      if (!visible.length) return null;
      return <React.Fragment key={group}><h3>{group}</h3>{visible.map(([key, label]) => <button key={key} title={label} aria-label={label} className={`item ${key === active ? "on" : ""}`} onClick={(event) => { navigate(key); event.currentTarget.blur(); }}><span className="nav-icon"><SidebarIcon name={NAV_ICONS[key] || "settings"} /></span><span className="nav-label">{label}</span></button>)}</React.Fragment>;
    })}
    {user.perfil === "dev" && <><h3 className="utility-heading">Dados de demonstração</h3><button title="Restaurar dados" aria-label="Restaurar dados" className="item" onClick={() => { setDb(loadDatabase()); notify("Dados fictícios restaurados"); }}><span className="nav-icon"><SidebarIcon name="restore" /></span><span className="nav-label">Restaurar dados</span></button></>}
    <button title="Alternar tema" aria-label="Alternar tema" className="item" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><span className="nav-icon"><SidebarIcon name="theme" /></span><span className="nav-label">Alternar tema</span></button>
    <div className="foot"><button title="Sair da conta" aria-label="Sair da conta" onClick={logout}><span className="nav-icon"><SidebarIcon name="logout" /></span><span className="nav-label">Sair da conta</span></button></div>
  </nav>;
}

export default function App() {
  const [db, setDbState] = useState(loadDatabase);
  const [user, setUser] = useState(() => db.usuarios.find((item) => item.id === loadSession()) || null);
  const [active, setActive] = useState("dash");
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("gl_theme") || "light");
  const setDb = (updater) => setDbState((current) => { const next = typeof updater === "function" ? updater(current) : updater; saveDatabase(next); return next; });
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("gl_theme", theme); }, [theme]);
  useEffect(() => { if (!user) return undefined; const reset = () => { window.clearTimeout(window.__glIdle); window.__glIdle = window.setTimeout(() => notify("Sess?o em modo de espera"), 60000); }; ["click", "keydown", "touchstart"].forEach((event) => window.addEventListener(event, reset)); reset(); return () => { window.clearTimeout(window.__glIdle); ["click", "keydown", "touchstart"].forEach((event) => window.removeEventListener(event, reset)); }; }, [user]);
  if (!user) return <Login db={db} onLogin={(found) => { setUser(found); saveSession(found.id); }} />;
  const available = MODULES.filter(([key]) => key === "dash" ? can(user, db, key) : can(user, db, key));
  const selectedActive = available.some(([key]) => key === active) ? active : (available[0]?.[0] || "dash");
  const logout = () => { clearSession(); setUser(null); setEditing(null); };
  const current = selectedActive === "dash" ? <Dashboard db={db} /> : editing ? <Form module={selectedActive} record={editing === true ? null : editing} db={db} setDb={setDb} user={user} onClose={() => setEditing(null)} notify={notify} /> : <DataList module={selectedActive} db={db} setDb={setDb} user={user} notify={notify} onNew={(record = true) => setEditing(record)} />;
  return <div id="app" className="react-app"><div className="mod"><div className="brand-left"><img src={LOGO} alt="R&M" /><h1>Gest?oLocal <span>| {MODULES.find(([key]) => key === selectedActive)?.[1] || "Administra??o"}</span></h1></div><div className="ctx"><span>R&M IT Solutions</span><span>{new Date().toLocaleDateString("pt-BR")}</span></div></div><div className="shell"><Sidebar available={available} active={active === "permissoes" ? active : selectedActive} setActive={(key) => { setActive(key); setEditing(null); }} user={user} setDb={setDb} notify={notify} logout={logout} theme={theme} setTheme={setTheme} /><main>{active === "permissoes" ? <PermissionEditor db={db} setDb={setDb} notify={notify} /> : current}</main></div>{toast && <div id="toast" className="show">{toast}</div>}</div>;
}

function PermissionEditor({ db, setDb, notify }) {
  const [role, setRole] = useState("funcionario");
  return <><div className="screen-head"><h2>Permiss?es por perfil</h2><button className="btn" onClick={() => { setDb((current) => ({ ...current, perms: { ...current.perms, [role]: defaultPermissions()[role] } })); notify("Permiss?es restauradas"); }}>Restaurar padr?o</button></div><div className="card"><p>Defina quais telas e a??es cada perfil pode usar.</p><div className="seg">{["funcionario", "admin"].map((item) => <button className={role === item ? "on" : ""} key={item} onClick={() => setRole(item)}>{ROLES[item]}</button>)}</div></div><div className="tbl-wrap permission-table"><table className="perm"><thead><tr><th>Tela</th>{ACTIONS.map(([, label]) => <th key={label} className="chk">{label}</th>)}</tr></thead><tbody>{MODULES.map(([module, label]) => <tr key={module}><td>{label}</td>{ACTIONS.map(([action, actionLabel]) => <td className="chk" key={action}><input type="checkbox" checked={Boolean(db.perms?.[role]?.[module]?.includes(action))} onChange={(event) => setDb((current) => ({ ...current, perms: { ...current.perms, [role]: { ...current.perms[role], [module]: event.target.checked ? [...new Set([...(current.perms[role]?.[module] || []), action, ...(action !== "ver" ? ["ver"] : [])] )] : action === "ver" ? [] : (current.perms[role]?.[module] || []).filter((item) => item !== action) } } }))} aria-label={`${label}: ${actionLabel}`} /></td>)}</tr>)}</tbody></table></div></>;
}
