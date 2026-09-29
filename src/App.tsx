import React, { useEffect, useMemo, useState } from "react";
import { ACTIONS, DEFAULT_USERS, ENTITY_CONFIG, MODULES, ROLES, dateBR, defaultPermissions, hash, money } from "./domain";
import { clearSession, loadDatabase, loadSession, saveDatabase, saveSession } from "./storage";
import { storeAttachment } from "./services/documentAttachments";
import logoUrl from "../assets/logo-mark.png";

const LOGO = logoUrl;
const can = (user, db, module, action = "ver") => user?.perfil === "dev" || Boolean(db.perms?.[user?.perfil]?.[module]?.includes(action));

function Login({ onLogin, db, theme, setTheme }) {
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ usuario: "", senha: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setError("");
    const found = db.usuarios.find((item) => item.usuario.toLowerCase() === form.usuario.trim().toLowerCase());
    if (!found || found.senha !== hash(`gl::${form.senha}`) || found.perfil !== role || found.status !== "Ativo") {
      setError("Não foi possível entrar. Confira usuário, senha e perfil.");
      return;
    }
    onLogin(found);
  };

  const chooseRole = (key) => {
    setRole(key);
    setError("");
    setForm(DEFAULT_USERS[key] ? { usuario: DEFAULT_USERS[key].u, senha: DEFAULT_USERS[key].p } : { usuario: "", senha: "" });
  };

  return <div className="react-login">
    <a className="skip-link" href="#login-form">Pular para o formulário de acesso</a>
    <button type="button" className="login-theme" aria-label={`Usar tema ${theme === "dark" ? "claro" : "escuro"}`} title={`Usar tema ${theme === "dark" ? "claro" : "escuro"}`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <SidebarIcon name={theme === "dark" ? "sun" : "theme"} />
    </button>
    <main className="lg-card" id="login-form" aria-labelledby="login-title">
      <div className="login-heading">
        <h1 id="login-title">{role ? ROLES[role] : "Quem vai entrar?"}</h1>
        <p className="sub">{role ? "Confira os dados e entre no sistema." : "Escolha o perfil que corresponde ao seu acesso."}</p>
      </div>
      {!role ? <div className="roles" role="list">
        {Object.entries(ROLES).map(([key, label]) => {
          const icon = key === "funcionario" ? "user" : key === "admin" ? "shield" : "code";
          const description = key === "funcionario" ? "Estoque e produtos" : key === "admin" ? "Gestão completa do negócio" : "Permissões e configuração técnica";
          return <button type="button" className="role" key={key} onClick={() => chooseRole(key)} aria-label={`${label}: ${description}`}>
            <span className="role-icon"><SidebarIcon name={icon as IconName} /></span>
            <span className="role-copy"><b>{label}</b><small>{description}</small></span>
            <span className="role-arrow"><SidebarIcon name="chevron" /></span>
          </button>;
        })}
      </div> :
      <form onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor="login-user">Usuário</label>
          <input id="login-user" name="usuario" autoComplete="username" autoFocus value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} required />
        </div>
        <div className="form-field">
          <label htmlFor="login-password">Senha</label>
          <div className="pwrow">
            <input id="login-password" name="senha" type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
            <button type="button" className="btn password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><SidebarIcon name="eye" /><span>{showPassword ? "Ocultar" : "Mostrar"}</span></button>
          </div>
        </div>
        {error && <div className="lg-err" role="alert">{error}</div>}
        <div className="actions">
          <button type="button" className="btn" onClick={() => { setRole(null); setError(""); setShowPassword(false); }}>Voltar</button>
          <button type="submit" className="btn primary">Entrar</button>
        </div>
      </form>}
      <p className="access-note"><strong>Acessibilidade:</strong> use Tab para navegar pelos controles e Enter para confirmar.</p>
    </main>
  </div>;
}

function Dashboard({ db }) {
  const receivable = db.titulos.filter((item) => item.tipo === "R" && item.status !== "Pago").reduce((sum, item) => sum + Number(item.valor), 0);
  const payable = db.titulos.filter((item) => item.tipo === "P" && item.status !== "Pago").reduce((sum, item) => sum + Number(item.valor), 0);
  const lowStock = db.produtos.filter((item) => Number(item.estoque) <= Number(item.minimo));
  const activeClients = db.clientes.filter((item) => item.status === "Ativo").length;
  const bankBalance = db.bancos.reduce((sum, item) => sum + Number(item.saldo), 0);
  const pendingDocs = db.documentos.filter((item) => item.status !== "Arquivado").length;
  const openTitles = db.titulos.filter((item) => item.status !== "Pago").length;
  const totalProducts = db.produtos.length;
  const totalDocuments = db.documentos.length;

  return <section className="dashboard" aria-labelledby="dashboard-title">
    <div className="screen-head dashboard-head">
      <div>
        <h2 id="dashboard-title">Painel</h2>
        <p className="screen-help">Visão geral da operação, financeiro e itens que precisam de atenção.</p>
      </div>
    </div>

    <div className="kpis dashboard-kpis">
      <div className="kpi kpi-receive"><span className="kpi-label">A receber</span><strong>{money(receivable)}</strong><small>{db.titulos.filter((item) => item.tipo === "R" && item.status !== "Pago").length} título(s) em aberto</small></div>
      <div className="kpi k-bad"><span className="kpi-label">A pagar</span><strong>{money(payable)}</strong><small>{db.titulos.filter((item) => item.tipo === "P" && item.status !== "Pago").length} título(s) em aberto</small></div>
      <div className="kpi k-amber"><span className="kpi-label">Estoque baixo</span><strong>{lowStock.length}</strong><small>{lowStock.length ? "produto(s) para repor" : "Nenhum alerta de estoque"}</small></div>
      <div className="kpi k-ok"><span className="kpi-label">Clientes ativos</span><strong>{activeClients}</strong><small>de {db.clientes.length} cadastrados</small></div>
    </div>

    <div className="dashboard-grid">
      <article className="dash-card dash-finance">
        <div className="dash-card-head"><div><h3>Resumo financeiro</h3><p>Valores atualmente em aberto.</p></div><span className="dash-icon"><SidebarIcon name="bank" /></span></div>
        <div className="finance-summary">
          <div><span>Saldo em bancos</span><strong>{money(bankBalance)}</strong></div>
          <div><span>A receber</span><strong>{money(receivable)}</strong></div>
          <div><span>A pagar</span><strong>{money(payable)}</strong></div>
        </div>
        <div className="finance-balance"><span>Saldo após compromissos</span><strong>{money(bankBalance + receivable - payable)}</strong></div>
      </article>

      <article className="dash-card">
        <div className="dash-card-head"><div><h3>Atenção necessária</h3><p>Itens que merecem acompanhamento.</p></div><span className="dash-icon warning"><SidebarIcon name="settings" /></span></div>
        <ul className="attention-list">
          <li><span>Estoque abaixo do mínimo</span><strong className={lowStock.length ? "text-warning" : "text-ok"}>{lowStock.length}</strong></li>
          <li><span>Documentos pendentes</span><strong>{pendingDocs}</strong></li>
          <li><span>Títulos em aberto</span><strong>{openTitles}</strong></li>
        </ul>
      </article>

      <article className="dash-card">
        <div className="dash-card-head"><div><h3>Resumo operacional</h3><p>Volume atual dos cadastros.</p></div><span className="dash-icon"><SidebarIcon name="products" /></span></div>
        <div className="metric-list">
          <div><span>Produtos</span><strong>{totalProducts}</strong></div>
          <div><span>Clientes</span><strong>{db.clientes.length}</strong></div>
          <div><span>Documentos fiscais</span><strong>{totalDocuments}</strong></div>
          <div><span>Contas abertas</span><strong>{openTitles}</strong></div>
        </div>
      </article>
    </div>

    <div className="dashboard-bottom">
      <article className="dash-card stock-card">
        <div className="dash-card-head"><div><h3>Estoque em atenção</h3><p>Produtos próximos ou abaixo do mínimo.</p></div></div>
        {lowStock.length ? <div className="stock-list">{lowStock.map((item) => <div className="stock-row" key={item.id}><div><strong>{item.descricao}</strong><small>{item.codigo} · mínimo {item.minimo} {item.unidade}</small></div><span>{item.estoque} {item.unidade}</span></div>)}</div> : <div className="empty-state"><span className="status-dot ok" />Nenhum produto precisa de reposição no momento.</div>}
      </article>
      <article className="dash-card quick-card">
        <div className="dash-card-head"><div><h3>Indicadores</h3><p>Leitura rápida do sistema.</p></div></div>
        <div className="indicator-grid">
          <div><strong>{db.bancos.length}</strong><span>contas bancárias</span></div>
          <div><strong>{db.usuarios.filter((item) => item.status === "Ativo").length}</strong><span>usuários ativos</span></div>
          <div><strong>{db.documentos.filter((item) => item.arquivoNome).length}</strong><span>documentos anexados</span></div>
          <div><strong>{db.produtos.filter((item) => item.status === "Ativo").length}</strong><span>produtos ativos</span></div>
        </div>
      </article>
    </div>
  </section>;
}
function Charts({ db }) {
  const receiveOpen = db.titulos.filter((item) => item.tipo === "R" && item.status !== "Pago").reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const payableOpen = db.titulos.filter((item) => item.tipo === "P" && item.status !== "Pago").reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const bankBalance = db.bancos.reduce((sum, item) => sum + Number(item.saldo || 0), 0);
  const financialParts = [
    { label: "Saldo bancário", value: Math.max(bankBalance, 0), cls: "c-blue" },
    { label: "A receber", value: receiveOpen, cls: "c-cyan" },
    { label: "A pagar", value: payableOpen, cls: "c-amber" }
  ];
  const financialTotal = financialParts.reduce((sum, item) => sum + item.value, 0) || 1;

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const year = date.getFullYear();
    const month = date.getMonth();
    const titles = db.titulos.filter((item) => {
      const d = new Date(item.vencimento || item.data || item.emissao);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      label: monthNames[month],
      receive: titles.filter((item) => item.tipo === "R").reduce((sum, item) => sum + Number(item.valor || 0), 0),
      payable: titles.filter((item) => item.tipo === "P").reduce((sum, item) => sum + Number(item.valor || 0), 0)
    };
  });
  const maxMonthly = Math.max(...monthly.flatMap((item) => [item.receive, item.payable]), 1);
  const productCategories = [...new Set(db.produtos.map((item) => item.categoria || "Outros"))];
  const categoryStock = productCategories.map((category) => ({ label: category, value: db.produtos.filter((item) => (item.categoria || "Outros") === category).reduce((sum, item) => sum + Number(item.estoque || 0), 0) })).sort((a, b) => b.value - a.value).slice(0, 6);
  const maxStock = Math.max(...categoryStock.map((item) => item.value), 1);
  const statusCounts = [
    { label: "Clientes ativos", value: db.clientes.filter((item) => item.status === "Ativo").length },
    { label: "Produtos ativos", value: db.produtos.filter((item) => item.status === "Ativo").length },
    { label: "Títulos abertos", value: db.titulos.filter((item) => item.status !== "Pago").length },
    { label: "Documentos pendentes", value: db.documentos.filter((item) => item.status !== "Arquivado").length }
  ];
  const maxStatus = Math.max(...statusCounts.map((item) => item.value), 1);

  const linePoints = monthly.map((item, index) => {
    const x = 12 + index * (176 / Math.max(monthly.length - 1, 1));
    const y = 92 - (item.receive / maxMonthly) * 68;
    return `${x},${y}`;
  }).join(" ");

  return <section className="charts-page" aria-labelledby="charts-title">
    <div className="screen-head charts-head">
      <div><h2 id="charts-title">Gráficos</h2><p className="screen-help">Indicadores visuais da operação, financeiro e estoque.</p></div>
    </div>

    <div className="charts-grid">
      <article className="chart-card chart-pie">
        <div className="chart-card-head"><div><h3>Composição financeira</h3><p>Distribuição dos valores atuais.</p></div></div>
        <div className="pie-layout">
          <div className="donut" style={{ background: `conic-gradient(var(--chart-blue) 0deg ${(financialParts[0].value / financialTotal) * 360}deg, var(--chart-cyan) ${(financialParts[0].value / financialTotal) * 360}deg ${((financialParts[0].value + financialParts[1].value) / financialTotal) * 360}deg, var(--chart-amber) ${((financialParts[0].value + financialParts[1].value) / financialTotal) * 360}deg 360deg)` }}><div className="donut-hole"><strong>{money(financialTotal)}</strong><span>composição</span></div></div>
          <div className="chart-legend">{financialParts.map((item, index) => <div key={item.label}><span className={`legend-dot ${item.cls}`} /><span>{item.label}</span><strong>{money(item.value)}</strong></div>)}</div>
        </div>
      </article>

      <article className="chart-card chart-bars">
        <div className="chart-card-head"><div><h3>Crescimento mensal</h3><p>Volume financeiro por mês de vencimento.</p></div></div>
        <div className="bar-chart" aria-label="Gráfico de colunas de contas a receber e a pagar">
          {monthly.map((item) => <div className="bar-group" key={item.label}><div className="bars"><span className="bar receive" style={{ height: `${Math.max((item.receive / maxMonthly) * 100, item.receive ? 5 : 2)}%` }} title={`A receber: ${money(item.receive)}`} /><span className="bar payable" style={{ height: `${Math.max((item.payable / maxMonthly) * 100, item.payable ? 5 : 2)}%` }} title={`A pagar: ${money(item.payable)}`} /></div><small>{item.label}</small></div>)}
        </div>
        <div className="chart-inline-legend"><span><i className="legend-dot c-blue" />A receber</span><span><i className="legend-dot c-amber" />A pagar</span></div>
      </article>

      <article className="chart-card chart-line">
        <div className="chart-card-head"><div><h3>Tendência de recebimentos</h3><p>Evolução dos valores a receber nos últimos meses.</p></div></div>
        <div className="line-chart-wrap">
          <svg viewBox="0 0 200 105" role="img" aria-label="Gráfico de linha da tendência de recebimentos"><path className="line-grid" d="M12 24H188M12 58H188M12 92H188" /><polyline className="trend-line" points={linePoints} fill="none" />{monthly.map((item, index) => { const x = 12 + index * (176 / Math.max(monthly.length - 1, 1)); const y = 92 - (item.receive / maxMonthly) * 68; return <circle key={item.label} className="trend-point" cx={x} cy={y} r="2.7" />; })}</svg>
          <div className="line-labels">{monthly.map((item) => <span key={item.label}>{item.label}</span>)}</div>
        </div>
      </article>

      <article className="chart-card chart-horizontal">
        <div className="chart-card-head"><div><h3>Estoque por categoria</h3><p>Quantidade disponível por grupo de produto.</p></div></div>
        <div className="horizontal-bars">{categoryStock.length ? categoryStock.map((item) => <div className="hbar-row" key={item.label}><div><span>{item.label}</span><strong>{item.value}</strong></div><div className="hbar-track"><span style={{ width: `${Math.max((item.value / maxStock) * 100, item.value ? 4 : 0)}%` }} /></div></div>) : <div className="empty-state">Sem produtos cadastrados.</div>}</div>
      </article>

      <article className="chart-card chart-columns">
        <div className="chart-card-head"><div><h3>Indicadores operacionais</h3><p>Comparativo dos principais volumes.</p></div></div>
        <div className="tower-chart">{statusCounts.map((item) => <div className="tower-group" key={item.label}><div className="tower-area"><span style={{ height: `${Math.max((item.value / maxStatus) * 100, item.value ? 6 : 2)}%` }} title={`${item.label}: ${item.value}`}><b>{item.value}</b></span></div><small>{item.label}</small></div>)}</div>
      </article>

      <article className="chart-card chart-status">
        <div className="chart-card-head"><div><h3>Status dos títulos</h3><p>Distribuição atual entre aberto e pago.</p></div></div>
        <div className="status-donut-layout">
          {(() => { const open = db.titulos.filter((item) => item.status !== "Pago").length; const paid = db.titulos.filter((item) => item.status === "Pago").length; const total = Math.max(open + paid, 1); const split = open / total * 360; return <><div className="donut small" style={{ background: `conic-gradient(var(--chart-blue) 0deg ${split}deg, var(--chart-green) ${split}deg 360deg)` }}><div className="donut-hole"><strong>{open + paid}</strong><span>títulos</span></div></div><div className="chart-legend"><div><span className="legend-dot c-blue" /><span>Em aberto</span><strong>{open}</strong></div><div><span className="legend-dot c-green" /><span>Pagos</span><strong>{paid}</strong></div></div></>; })()}
        </div>
      </article>
    </div>
  </section>;
}

function DataList({ module, db, setDb, user, notify, onNew }) {
  const config = ENTITY_CONFIG[module];
  const [query, setQuery] = useState("");
  const [docFilters, setDocFilters] = useState({ numero: "", chave: "", entidade: "", de: "", ate: "", tipo: "" });

  const rows = useMemo(() => (db[config.store] || [])
    .filter(config.filter || (() => true))
    .filter((row) => config.document
      ? (!docFilters.numero || String(row.numero || "").toLowerCase().includes(docFilters.numero.toLowerCase()))
        && (!docFilters.chave || String(row.chave || "").toLowerCase().includes(docFilters.chave.toLowerCase()))
        && (!docFilters.entidade || String(row.entidade || "").toLowerCase().includes(docFilters.entidade.toLowerCase()))
        && (!docFilters.de || String(row.data || "") >= docFilters.de)
        && (!docFilters.ate || String(row.data || "") <= docFilters.ate)
        && (!docFilters.tipo || row.tipo === docFilters.tipo)
      : Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase()))),
    [db, config, query, docFilters]
  );

  const remove = (row) => {
    if (!window.confirm(`Excluir "${row[config.key] || "este registro"}"? Esta ação não pode ser desfeita.`)) return;
    setDb((current) => ({ ...current, [config.store]: current[config.store].filter((item) => item.id !== row.id) }));
    notify("Registro excluído.");
  };

  const attach = async (row, file) => {
    if (!file) return;
    try {
      const updated = await storeAttachment(file, row);
      setDb((current) => ({ ...current, documentos: current.documentos.map((item) => item.id === row.id ? updated : item) }));
      notify("Anexo atualizado.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível anexar o arquivo.");
    }
  };

  const resetFilters = () => {
    setDocFilters({ numero: "", chave: "", entidade: "", de: "", ate: "", tipo: "" });
    setQuery("");
  };

  return <section aria-labelledby={`screen-${module}`}>
    <div className="screen-head">
      <div>
        <h2 id={`screen-${module}`}>{config.title}</h2>
        <p className="screen-help">{config.document ? "Filtre e consulte documentos arquivados." : "Use a busca para localizar um registro rapidamente."}</p>
      </div>
      <div className="actions">
        {can(user, db, module, "incluir") && <button className="btn primary" onClick={() => onNew(true)}>Incluir</button>}
      </div>
    </div>

    <div className="tbl-wrap">
      {config.document ? <div className="doc-filterbar" role="search" aria-label="Filtros de documentos">
        <div className="filter-field"><label htmlFor="doc-numero">Número</label><input id="doc-numero" inputMode="numeric" placeholder="Ex.: 2041" value={docFilters.numero} onChange={(event) => setDocFilters({ ...docFilters, numero: event.target.value })} /></div>
        <div className="filter-field"><label htmlFor="doc-chave">Chave de acesso</label><input id="doc-chave" inputMode="numeric" placeholder="Chave" value={docFilters.chave} onChange={(event) => setDocFilters({ ...docFilters, chave: event.target.value })} /></div>
        <div className="filter-field"><label htmlFor="doc-entidade">Emitente / cliente</label><input id="doc-entidade" placeholder="Nome" value={docFilters.entidade} onChange={(event) => setDocFilters({ ...docFilters, entidade: event.target.value })} /></div>
        <div className="filter-field"><label htmlFor="doc-de">A partir de</label><input id="doc-de" type="date" value={docFilters.de} onChange={(event) => setDocFilters({ ...docFilters, de: event.target.value })} /></div>
        <div className="filter-field"><label htmlFor="doc-ate">Até</label><input id="doc-ate" type="date" value={docFilters.ate} onChange={(event) => setDocFilters({ ...docFilters, ate: event.target.value })} /></div>
        <div className="filter-field"><label htmlFor="doc-tipo">Tipo</label><select id="doc-tipo" value={docFilters.tipo} onChange={(event) => setDocFilters({ ...docFilters, tipo: event.target.value })}><option value="">Todos os tipos</option>{["NF-e", "NFS-e", "NFC-e", "Recibo", "Comprovante"].map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
        <button className="btn" onClick={resetFilters}>Limpar filtros</button>
      </div> : <div className="toolbar">
        <label className="search-box" htmlFor={`search-${module}`}><span>Buscar</span><input id={`search-${module}`} type="search" placeholder={`Buscar em ${config.title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <span className="count" aria-live="polite">{rows.length} registro(s)</span>
      </div>}

      <div className="table-scroll">
        <table className="tbl-list">
          <caption className="sr-only">{config.title}: lista de registros</caption>
          <thead><tr>{config.columns.map(([, label]) => <th scope="col" key={label}>{label}</th>)}<th scope="col" className="action-heading">Ações</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((row) => <tr key={row.id}>
              {config.columns.map(([key, label]) => <td data-l={label} key={key} className={["valor", "preco", "saldo", "limite", "custo", "iof", "nrobytes", "bytesext"].includes(key) ? "num" : ""}>
                {["valor", "preco", "saldo", "limite", "custo"].includes(key) ? money(row[key]) : key === "vencimento" || key === "emissao" || key === "data" ? dateBR(row[key]) : key === "perfil" ? (ROLES[row[key]] || String(row[key] ?? "")) : String(row[key] ?? "")}
              </td>)}
              <td data-l="Ações" className="act">
                {config.document && can(user, db, module, "alterar") && <label className="file-action" title={row.arquivoNome ? `Trocar anexo: ${row.arquivoNome}` : "Anexar arquivo"}>
                  <span aria-hidden="true">📎</span><span className="action-text">{row.arquivoNome ? "Trocar anexo" : "Anexar"}</span>
                  <input type="file" accept=".pdf,.xml,image/*" onChange={(event) => attach(row, event.target.files?.[0])} />
                </label>}
                {can(user, db, module, "alterar") && <button type="button" onClick={() => onNew(row)}>Alterar</button>}
                {can(user, db, module, "excluir") && <button type="button" className="del" onClick={() => remove(row)}>Excluir</button>}
                {!can(user, db, module, "alterar") && !can(user, db, module, "excluir") && <span className="muted-action">Somente consulta</span>}
              </td>
            </tr>) : <tr><td colSpan={config.columns.length + 1} className="empty">Nenhum registro encontrado.<br /><button type="button" className="link-btn" onClick={resetFilters}>Limpar busca e filtros</button></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </section>;
}

function Form({ module, record, db, setDb, user, onClose, notify }) {
  const config = ENTITY_CONFIG[module];
  const defaultDraft = () => ({
    status: "Ativo",
    ...(module === "clientes" ? { tipo: "PJ", uf: "MG", limite: 0 } : {}),
    ...(module === "produtos" ? { unidade: "UN", categoria: "Mercearia", custo: 0, preco: 0, estoque: 0, minimo: 0 } : {}),
    ...(module === "bancos" ? { saldo: 0, tabela: "17", nrobytes: 400, cobeletron: "1 - Não", iof: 0 } : {}),
    ...(module === "documentos" ? { tipo: "NF-e", status: "Pendente", valor: 0, data: new Date().toISOString().slice(0, 10), tituloId: "", arquivoNome: "", driveUrl: "" } : {}),
    ...(module === "receber" ? { categoria: "Vendas", valor: 0, status: "Aberto" } : {}),
    ...(module === "pagar" ? { categoria: "Fornecedores", valor: 0, status: "Aberto" } : {}),
    ...(module === "usuarios" ? { perfil: user?.perfil === "dev" ? "funcionario" : "funcionario", status: "Ativo" } : {})
  });
  const [draft, setDraft] = useState(() => ({ ...defaultDraft(), ...(record || {}) }));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const optionsFor = (key) => {
    if (key === "tipo" && module === "clientes") return ["PJ", "PF"];
    if (key === "tipo" && module === "documentos") return ["NF-e", "NFS-e", "NFC-e", "Recibo", "Comprovante"];
    if (key === "uf") return ["MG", "SP", "RJ", "ES", "BA", "GO", "PR", "RS", "SC", "DF"];
    if (key === "unidade") return ["UN", "CX", "PCT", "KG", "L"];
    if (key === "categoria" && module === "produtos") return ["Mercearia", "Laticínios", "Limpeza", "Bebidas", "Embalagens", "Outros"];
    if (key === "categoria" && module === "receber") return ["Vendas", "Serviços", "Outras receitas"];
    if (key === "categoria" && module === "pagar") return ["Fornecedores", "Aluguel", "Folha de pagamento", "Energia e água", "Impostos", "Marketing", "Outras despesas"];
    if (key === "status" && module === "clientes") return ["Ativo", "Bloqueado", "Inativo"];
    if (key === "status" && module === "produtos") return ["Ativo", "Inativo"];
    if (key === "status" && module === "documentos") return ["Pendente", "Arquivado"];
    if (key === "status" && (module === "receber" || module === "pagar")) return ["Aberto", "Pago"];
    if (key === "status" && module === "usuarios") return ["Ativo", "Inativo"];
    if (key === "perfil" && module === "usuarios") return user?.perfil === "dev" ? ["funcionario", "admin", "dev"] : ["funcionario"];
    if (key === "cobeletron" && module === "bancos") return ["1 - Não", "2 - Sim"];
    if (key === "formatodata" && module === "bancos") return ["1 - DDMMAA", "2 - DDMMAAAA"];
    if (key === "entidade" && module === "receber") return ["", ...db.clientes.map((item) => item.nome)];
    if (key === "banco" && (module === "receber" || module === "pagar")) return db.bancos.map((item) => item.banco);
    if (key === "tituloId" && module === "documentos") return db.titulos.map((item) => item.id);
    return null;
  };

  const save = (event) => {
    event.preventDefault();
    setError("");
    const mainValue = String(draft[config.key] ?? "").trim();
    if (!mainValue) {
      setError(`Preencha o campo "${config.fields.find(([key]) => key === config.key)?.[1] || config.key}".`);
      return;
    }

    if (module === "produtos" && Number(draft.estoque) < 0) {
      setError("O estoque não pode ser negativo.");
      return;
    }

    if (module === "usuarios") {
      const normalizedUser = String(draft.usuario || "").trim().toLowerCase();
      const duplicate = db.usuarios.some((item) => item.id !== draft.id && item.usuario.toLowerCase() === normalizedUser);
      if (!normalizedUser || !draft.perfil) {
        setError("Preencha usuário e perfil.");
        return;
      }
      if (duplicate) {
        setError("Esse nome de usuário já está cadastrado.");
        return;
      }
      if (!record && password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
    }

    let value = { ...draft, id: draft.id || `${config.store}-${Date.now()}` };
    if (module === "usuarios" && password) value.senha = hash(`gl::${password}`);
    if (module === "usuarios" && !record && !password) {
      setError("Defina uma senha para o novo usuário.");
      return;
    }

    setDb((current) => ({
      ...current,
      [config.store]: draft.id
        ? current[config.store].map((item) => item.id === draft.id ? { ...item, ...value } : item)
        : [...current[config.store], value]
    }));
    notify(record ? "Alterações salvas." : "Registro incluído.");
    onClose();
  };

  return <section aria-labelledby={`form-${module}`}>
    <div className="screen-head">
      <div><h2 id={`form-${module}`}>{record ? `Alterar ${config.title}` : `Novo registro`}</h2><p className="screen-help">Preencha os campos necessários e revise antes de salvar.</p></div>
    </div>
    <div className="form-wrap">
      <form onSubmit={save} noValidate>
        <div className="fgrid">
          {config.fields.map(([key, label]) => {
            const options = optionsFor(key);
            const required = key === config.key || ["nome", "descricao", "valor", "preco", "vencimento", "usuario", "perfil"].includes(key);
            const numeric = ["valor", "preco", "saldo", "limite", "custo", "iof", "estoque", "minimo", "nrobytes", "bytesext"].includes(key);
            const date = ["data", "emissao", "vencimento"].includes(key);
            const id = `field-${module}-${key}`;
            return <div className={`fld ${required ? "req" : ""}`} key={key}>
              <label htmlFor={id}>{label}</label>
              {options ? <select id={id} value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} required={required}>
                <option value="">Selecione...</option>{options.map((option) => {
                  const label = key === "banco" ? (db.bancos.find((item) => item.banco === option)?.nomebanco ? `${option} - ${db.bancos.find((item) => item.banco === option)?.nomebanco}` : option)
                    : key === "tituloId" ? (() => { const t = db.titulos.find((item) => item.id === option); return t ? `${t.tipo === "R" ? "A receber" : "A pagar"} · ${t.descricao} · ${money(t.valor)}` : option; })()
                    : option;
                  return <option key={option} value={option}>{label}</option>;
                })}</select> :
              <input id={id} type={numeric ? "number" : date ? "date" : "text"} inputMode={numeric ? "decimal" : undefined}
                min={numeric ? "0" : undefined} step={numeric ? (["estoque", "minimo", "nrobytes", "bytesext"].includes(key) ? "1" : key === "iof" ? "0.001" : "0.01") : undefined}
                value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} required={required} />}
            </div>;
          })}
          {module === "usuarios" && <div className="fld req">
            <label htmlFor="field-usuarios-senha">Senha</label>
            <div className="pwrow"><input id="field-usuarios-senha" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required={!record} minLength={6} placeholder={record ? "Deixe em branco para manter" : "Mínimo de 6 caracteres"} /><span className="field-hint">A senha só é alterada se você preencher este campo.</span></div>
          </div>}
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button type="submit" className="btn primary">Salvar</button></div>
      </form>
    </div>
  </section>;
}

const NAV_GROUPS: [string, [string, string][]][] = [
  ["Geral", [["dash", "Painel"], ["graficos", "Gráficos"]]],
  ["Cadastros", [["clientes", "Clientes"], ["produtos", "Produtos e estoque"], ["bancos", "Bancos"]]],
  ["Fiscal / Documentos", [["documentos", "Documentos fiscais"]]],
  ["Financeiro", [["receber", "Contas a receber"], ["pagar", "Contas a pagar"]]],
  ["Administração", [["usuarios", "Usuários"], ["permissoes", "Permissões"]]]
];
type IconName = "dashboard" | "chart" | "customers" | "products" | "bank" | "document" | "receivable" | "payable" | "users" | "settings" | "restore" | "theme" | "sun" | "pin" | "logout" | "user" | "shield" | "code" | "chevron" | "eye";

const NAV_ICONS: Record<string, IconName> = {
  dash: "dashboard",
  graficos: "chart",
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
    chart: <><path d="M5 19V9M12 19V5M19 19v-8" /><path d="M3 19h18" /></>,
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
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    pin: <><path d="M12 17v5M7 3h10l-1 6 3 3H5l3-3-1-6Z" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H8" /></>,
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20c.6-3.1 3-5 7-5s6.4 1.9 7 5" /></>,
    shield: <><path d="M12 3 19 6v5c0 4.4-2.7 8.1-7 10-4.3-1.9-7-5.6-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    code: <><path d="m9 7-5 5 5 5M15 7l5 5-5 5M13 5l-2 14" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    eye: <><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></>
  };
  return <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function Sidebar({ available, active, setActive, user, setDb, notify }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(() => localStorage.getItem("gl_sidebar_pinned") !== "0");

  useEffect(() => {
    localStorage.setItem("gl_sidebar_pinned", pinned ? "1" : "0");
  }, [pinned]);

  const navigate = (key) => { setActive(key); setOpen(false); };

  return <nav className={`side ${pinned ? "pinned" : "floating"} ${open ? "open" : ""}`} aria-label="Menu principal">
    <div className="side-tools">
      <button type="button" className="menu-trigger" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? "Fechar menu" : "Abrir menu"} title={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
      <button type="button" className={`pin-trigger ${pinned ? "on" : ""}`} aria-pressed={pinned} aria-label={pinned ? "Desafixar menu lateral" : "Fixar menu lateral"} title={pinned ? "Desafixar menu lateral" : "Fixar menu lateral"} onClick={() => setPinned(!pinned)}>
        <SidebarIcon name="pin" />
      </button>
    </div>
    <div id="main-navigation" className="side-navigation">
      {NAV_GROUPS.map(([group, entries]) => {
        const visible = entries.filter(([key]) => key === "permissoes" ? user.perfil === "dev" : available.some(([availableKey]) => availableKey === key));
        if (!visible.length) return null;
        return <React.Fragment key={group}><h3>{group}</h3>{visible.map(([key, label]) => <button type="button" key={key} title={label} aria-label={label} aria-current={key === active ? "page" : undefined} className={`item ${key === active ? "on" : ""}`} onClick={() => navigate(key)}><span className="nav-icon"><SidebarIcon name={NAV_ICONS[key] || "settings"} /></span><span className="nav-label">{label}</span></button>)}</React.Fragment>;
      })}
      {user.perfil === "dev" && <><h3 className="utility-heading">Dados de demonstração</h3><button type="button" title="Restaurar dados" aria-label="Restaurar dados" className="item" onClick={() => { if (window.confirm("Restaurar os dados de demonstração? Seus dados locais atuais serão substituídos.")) { setDb(loadDatabase()); notify("Dados de demonstração restaurados."); } }}><span className="nav-icon"><SidebarIcon name="restore" /></span><span className="nav-label">Restaurar dados</span></button></>}
    </div>
    <div className="side-hint" aria-hidden="true">{pinned ? "Menu fixo" : "Menu flutuante"}</div>
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
  useEffect(() => { if (!user) return undefined; const reset = () => { window.clearTimeout(window.__glIdle); window.__glIdle = window.setTimeout(() => notify("Você está sem interagir há 1 minuto. O sistema continua aberto."), 60000); }; ["click", "keydown", "touchstart"].forEach((event) => window.addEventListener(event, reset)); reset(); return () => { window.clearTimeout(window.__glIdle); ["click", "keydown", "touchstart"].forEach((event) => window.removeEventListener(event, reset)); }; }, [user]);
  if (!user) return <Login db={db} onLogin={(found) => { setUser(found); saveSession(found.id); }} theme={theme} setTheme={setTheme} />;
  const chartNav: [string, string] = ["graficos", "Gráficos"];
  const available = [...MODULES, chartNav].filter(([key]) => key === "graficos" ? can(user, db, "dash") : can(user, db, key));
  const selectedActive = available.some(([key]) => key === active) ? active : (available[0]?.[0] || "dash");
  const activeLabel = selectedActive === "graficos" ? "Gráficos" : (MODULES.find(([key]) => key === selectedActive)?.[1] || "Administração");
  const logout = () => { if (!window.confirm("Encerrar a sessão de usuário?")) return; clearSession(); setUser(null); setEditing(null); };
  const current = selectedActive === "dash" ? <Dashboard db={db} /> : selectedActive === "graficos" ? <Charts db={db} /> : editing ? <Form module={selectedActive} record={editing === true ? null : editing} db={db} setDb={setDb} user={user} onClose={() => setEditing(null)} notify={notify} /> : <DataList module={selectedActive} db={db} setDb={setDb} user={user} notify={notify} onNew={(record = true) => setEditing(record)} />;
  return <div id="app" className="react-app"><a className="skip-link app-skip" href="#main-content">Pular para o conteúdo principal</a><header className="mod">
    <div className="brand-left"><img src={LOGO} alt="R&M IT Solutions" /><h1>GestãoLocal <span>| {activeLabel}</span></h1></div>
    <div className="ctx"><span>R&M IT Solutions</span><span>{new Date().toLocaleDateString("pt-BR")}</span></div>
    <div className="header-actions">
      <span className="user-chip"><span className="user-avatar" aria-hidden="true">{user.nome?.trim()?.charAt(0)?.toUpperCase() || "U"}</span><span className="user-chip-text"><strong>{user.nome}</strong><small>{ROLES[user.perfil] || user.perfil}</small></span></span>
      <button type="button" className="header-icon-btn" aria-label={`Usar tema ${theme === "dark" ? "claro" : "escuro"}`} title={`Usar tema ${theme === "dark" ? "claro" : "escuro"}`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><SidebarIcon name={theme === "dark" ? "sun" : "theme"} /></button>
      <button type="button" className="header-logout" onClick={logout} title="Encerrar sessão"><SidebarIcon name="logout" /><span>Sair</span></button>
    </div>
  </header><div className="shell"><Sidebar available={available} active={active === "permissoes" ? active : selectedActive} setActive={(key) => { setActive(key); setEditing(null); }} user={user} setDb={setDb} notify={notify} /><main id="main-content" tabIndex={-1}>{active === "permissoes" ? <PermissionEditor db={db} setDb={setDb} notify={notify} /> : current}</main></div>{toast && <div id="toast" className="show" role="status" aria-live="polite">{toast}</div>}</div>;
}

function PermissionEditor({ db, setDb, notify }) {
  const [role, setRole] = useState("funcionario");

  const toggle = (module, action, checked) => {
    setDb((current) => {
      const existing = current.perms?.[role]?.[module] || [];
      const next = checked
        ? [...new Set([...existing, action, ...(action !== "ver" ? ["ver"] : [])])]
        : action === "ver" ? [] : existing.filter((item) => item !== action);
      return { ...current, perms: { ...current.perms, [role]: { ...current.perms[role], [module]: next } } };
    });
  };

  return <section aria-labelledby="permissions-title">
    <div className="screen-head">
      <div><h2 id="permissions-title">Permissões por perfil</h2><p className="screen-help">Defina quais telas e ações cada perfil pode usar.</p></div>
      <button type="button" className="btn" onClick={() => { if (window.confirm(`Restaurar as permissões padrão de ${ROLES[role]}?`)) { setDb((current) => ({ ...current, perms: { ...current.perms, [role]: defaultPermissions()[role] } })); notify("Permissões restauradas."); } }}>Restaurar padrão</button>
    </div>
    <div className="card">
      <div className="seg" role="tablist" aria-label="Perfil">
        {["funcionario", "admin"].map((item) => <button type="button" role="tab" aria-selected={role === item} className={role === item ? "on" : ""} key={item} onClick={() => setRole(item)}>{ROLES[item]}</button>)}
      </div>
    </div>
    <div className="tbl-wrap permission-table">
      <div className="permission-note" role="note">Marcar uma ação automaticamente libera o acesso à tela. Desmarcar “Acessar” remove todas as ações daquela tela.</div>
      <div className="table-scroll"><table className="perm">
        <caption className="sr-only">Permissões de {ROLES[role]}</caption>
        <thead><tr><th scope="col">Tela</th>{ACTIONS.map(([, label]) => <th scope="col" key={label} className="chk">{label}</th>)}</tr></thead>
        <tbody>{MODULES.map(([module, label]) => <tr key={module}><th scope="row">{label}</th>{ACTIONS.map(([action, actionLabel]) => <td className="chk" key={action}><input type="checkbox" checked={Boolean(db.perms?.[role]?.[module]?.includes(action))} onChange={(event) => toggle(module, action, event.target.checked)} aria-label={`${label}: ${actionLabel}`} /></td>)}</tr>)}</tbody>
      </table></div>
    </div>
  </section>;
}
