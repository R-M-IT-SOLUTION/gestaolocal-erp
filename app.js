(function(){
"use strict";

/* ---------- utilidades ---------- */
const $ = (s,el=document)=>el.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = v => (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const moneyK = v => Math.abs(v)>=1000 ? "R$ "+(v/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+" mil" : money(v);
const pad = n => String(n).padStart(2,"0");
const iso = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const fdate = s => s ? s.split("-").reverse().join("/") : "";
const now = new Date();
const TODAY = iso(now);
const ACTIONS=[["ver","Acessar"],["incluir","Incluir"],["alterar","Alterar"],["excluir","Excluir"]];
const MODULES=[["dash","Painel"],["clientes","Clientes"],["produtos","Produtos e estoque"],["bancos","Bancos"],["documentos","Documentos fiscais"],["receber","Contas a receber"],["pagar","Contas a pagar"],["usuarios","Usuários"]];
const ROLE={funcionario:"Funcionário",admin:"Administrador",dev:"Desenvolvedor"};
const DEFAULT_USERS={funcionario:{u:"funcionario",p:"func123"},admin:{u:"admin",p:"admin123"},dev:{u:"dev",p:"dev123"}};
/* Hash simples apenas para demonstração (não é segurança real: veja o README) */
function hash(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);}
function defaultPerms(){const A=()=>ACTIONS.map(a=>a[0]);return{admin:{dash:A(),clientes:A(),produtos:A(),bancos:A(),documentos:A(),receber:A(),pagar:A(),usuarios:A()},funcionario:{produtos:A()}}}
let user=null;
let toastT;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),2400)}

/* ---------- dados (demonstração) ---------- */
function seed(){
  let s=7;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647};
  const clientes=[
    ["Mercadinho Santa Luzia","PJ","12.345.678/0001-90","(31) 3222-1010","Belo Horizonte","MG",8000],
    ["Restaurante Sabor Mineiro","PJ","98.765.432/0001-10","(31) 3344-5566","Contagem","MG",12000],
    ["Ana Paula Ribeiro","PF","123.456.789-09","(31) 99876-1122","Belo Horizonte","MG",1500],
    ["Padaria Pão Quente","PJ","45.678.901/0001-23","(31) 3555-7788","Betim","MG",5000],
    ["Carlos Eduardo Lima","PF","987.654.321-00","(31) 98811-3344","Nova Lima","MG",2500],
    ["Hotel Serra Azul","PJ","33.444.555/0001-66","(31) 3777-9900","Sabará","MG",20000]
  ].map((c,i)=>({id:"c"+i,codigo:"C"+pad(i+1)+"0",nome:c[0],tipo:c[1],doc:c[2],telefone:c[3],email:"contato@"+c[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g,"")+".com.br",cidade:c[4],uf:c[5],limite:c[6],status:"Ativo"}));
  const produtos=[
    ["Café torrado 500g","UN","Mercearia",14.5,26.9,48,20],
    ["Açúcar refinado 1kg","UN","Mercearia",3.2,5.9,120,40],
    ["Arroz tipo 1 5kg","UN","Mercearia",21,32.9,9,15],
    ["Leite integral cx c/12","CX","Laticínios",42,64,22,10],
    ["Queijo minas frescal","KG","Laticínios",28,44.9,6,8],
    ["Detergente 500ml","UN","Limpeza",1.9,3.8,90,30],
    ["Sacola plástica pct 100","PCT","Embalagens",7,12,35,12],
    ["Refrigerante 2L","UN","Bebidas",5.4,9.5,64,24]
  ].map((p,i)=>({id:"p"+i,codigo:"P"+pad(i+1)+"0",descricao:p[0],unidade:p[1],categoria:p[2],custo:p[3],preco:p[4],estoque:p[5],minimo:p[6],status:"Ativo"}));
  const bancos=[
    {id:"b0",banco:"341",nomebanco:"Itaú Unibanco",agencia:"1234",dvag:"5",conta:"56789",dvconta:"0",subconta:"001",saldo:48250.4,operacao:"Cobrança simples",iof:0,tabela:"17",nrobytes:400,cobeletron:"1 - Não"},
    {id:"b1",banco:"001",nomebanco:"Banco do Brasil",agencia:"3210",dvag:"X",conta:"11223",dvconta:"4",subconta:"001",saldo:15780.9,operacao:"Carteira 17",iof:0,tabela:"17",nrobytes:400,cobeletron:"2 - Sim"},
    {id:"b2",banco:"104",nomebanco:"Caixa Econômica",agencia:"0456",dvag:"1",conta:"99887",dvconta:"6",subconta:"002",saldo:6120,operacao:"",iof:0,tabela:"17",nrobytes:240,cobeletron:"1 - Não"}
  ];
  const titulos=[];let n=1;
  const cats=["Fornecedores","Aluguel","Folha de pagamento","Energia e água","Impostos","Marketing"];
  for(let m=-5;m<=1;m++){
    for(let k=0;k<3;k++){
      const d=new Date(now.getFullYear(),now.getMonth()+m,3+Math.floor(rnd()*24));
      const v=iso(d), past=v<iso(new Date(now.getTime()-5*864e5));
      titulos.push({id:"t"+(n++),tipo:"R",descricao:["Venda a prazo","Encomenda de evento","Fornecimento mensal"][k],entidade:clientes[Math.floor(rnd()*clientes.length)].nome,categoria:"Vendas",valor:Math.round(900+rnd()*5200),emissao:iso(new Date(d.getTime()-20*864e5)),vencimento:v,banco:"341",status:past?"Pago":"Aberto"});
    }
    for(let k=0;k<3;k++){
      const d=new Date(now.getFullYear(),now.getMonth()+m,2+Math.floor(rnd()*25));
      const v=iso(d), past=v<iso(new Date(now.getTime()-5*864e5));
      const cat=cats[Math.floor(rnd()*cats.length)];
      titulos.push({id:"t"+(n++),tipo:"P",descricao:cat+" - "+["ref. mês","parcela","NF 1"+Math.floor(100+rnd()*800)][k],entidade:"",categoria:cat,valor:Math.round(500+rnd()*4200),emissao:iso(new Date(d.getTime()-15*864e5)),vencimento:v,banco:"341",status:past?"Pago":"Aberto"});
    }
  }
  titulos.push({id:"t"+(n++),tipo:"R",descricao:"Venda a prazo - NF 2041",entidade:clientes[1].nome,categoria:"Vendas",valor:3480,emissao:iso(new Date(now.getTime()-20*864e5)),vencimento:iso(new Date(now.getTime()-3*864e5)),banco:"341",status:"Aberto"});
  titulos.push({id:"t"+(n++),tipo:"P",descricao:"Energia e água - ref. mês",entidade:"",categoria:"Energia e água",valor:1260,emissao:iso(new Date(now.getTime()-12*864e5)),vencimento:iso(new Date(now.getTime()-1*864e5)),banco:"341",status:"Aberto"});
  const documentos=[
    {id:"d0",tipo:"NF-e",numero:"2041",serie:"1",chave:"31260912345678000190550010000020411000020410",entidade:clientes[1].nome,tituloId:titulos.find(t=>t.tipo==="R"&&t.descricao.includes("NF 2041"))?.id||"",data:iso(new Date(now.getTime()-8*864e5)),valor:3480,status:"Arquivado",arquivoNome:"NF-e_2041.jpg",driveUrl:""},
    {id:"d1",tipo:"Comprovante",numero:"CP-0087",serie:"",chave:"",entidade:"Companhia de Energia",tituloId:titulos.find(t=>t.tipo==="P"&&t.descricao.includes("Energia e água"))?.id||"",data:iso(new Date(now.getTime()-3*864e5)),valor:1260,status:"Arquivado",arquivoNome:"comprovante_energia.png",driveUrl:""},
    {id:"d2",tipo:"Recibo",numero:"REC-014",serie:"",chave:"",entidade:"Fornecedor Demo",tituloId:"",data:iso(new Date(now.getTime()-1*864e5)),valor:780,status:"Pendente",arquivoNome:"",driveUrl:""}
  ];
  const usuarios=[
    {id:"u0",nome:"Desenvolvedor",usuario:"dev",senha:hash("gl::dev123"),perfil:"dev",status:"Ativo"},
    {id:"u1",nome:"Administrador",usuario:"admin",senha:hash("gl::admin123"),perfil:"admin",status:"Ativo"},
    {id:"u2",nome:"Funcionário Estoque",usuario:"funcionario",senha:hash("gl::func123"),perfil:"funcionario",status:"Ativo"}
  ];
  return {clientes,produtos,bancos,titulos,documentos,usuarios,perms:defaultPerms()};
}
let db;
let docFilters={numero:"",chave:"",entidade:"",de:"",ate:"",tipo:""};
try{ const raw=localStorage.getItem("gestaolocal_db_v2"); db=raw?JSON.parse(raw):null; }catch(e){ db=null }
if(!db||!db.titulos||!db.usuarios||!db.perms||!db.documentos) db=seed();
function save(){ try{localStorage.setItem("gestaolocal_db_v2",JSON.stringify(db))}catch(e){} }

/* ---------- definição das entidades ---------- */
const UF=["MG","SP","RJ","ES","BA","GO","PR","RS","SC","DF"];
const ENT={
  clientes:{store:"clientes",title:"Clientes",prefix:"C",mod:"Cadastros",
    cols:[["codigo","Código"],["nome","Nome / Razão social"],["doc","CPF / CNPJ"],["cidade","Cidade"],["telefone","Telefone"],["status","Situação","badge"]],
    tabs:[
      {name:"Cadastrais",fields:[
        {k:"codigo",l:"Código",auto:1},{k:"nome",l:"Nome / Razão social",req:1,w:2},{k:"tipo",l:"Tipo",t:"select",opts:["PJ","PF"],req:1},{k:"doc",l:"CPF / CNPJ",req:1},
        {k:"telefone",l:"Telefone"},{k:"email",l:"E-mail",w:2},{k:"cidade",l:"Cidade"},{k:"uf",l:"UF",t:"select",opts:UF}]},
      {name:"Comercial",fields:[
        {k:"limite",l:"Limite de crédito",t:"number",step:"0.01"},{k:"status",l:"Situação",t:"select",opts:["Ativo","Bloqueado","Inativo"],req:1}]}
    ],def:{tipo:"PJ",uf:"MG",status:"Ativo",limite:0}},
  produtos:{store:"produtos",title:"Produtos e estoque",prefix:"P",mod:"Cadastros",
    cols:[["codigo","Código"],["descricao","Descrição"],["categoria","Categoria"],["preco","Preço","money"],["estoque","Estoque","stock"],["status","Situação","badge"]],
    tabs:[
      {name:"Cadastrais",fields:[
        {k:"codigo",l:"Código",auto:1},{k:"descricao",l:"Descrição",req:1,w:2},{k:"unidade",l:"Unidade",t:"select",opts:["UN","CX","PCT","KG","L"],req:1},{k:"categoria",l:"Categoria",t:"select",opts:["Mercearia","Laticínios","Limpeza","Bebidas","Embalagens","Outros"]},
        {k:"custo",l:"Custo",t:"number",step:"0.01"},{k:"preco",l:"Preço de venda",t:"number",step:"0.01",req:1},{k:"estoque",l:"Estoque atual",t:"number",step:"1"},{k:"minimo",l:"Estoque mínimo",t:"number",step:"1"},
        {k:"status",l:"Situação",t:"select",opts:["Ativo","Inativo"]}]}
    ],def:{unidade:"UN",categoria:"Mercearia",custo:0,preco:0,estoque:0,minimo:0,status:"Ativo"}},
  bancos:{store:"bancos",title:"Parâmetros de Bancos",prefix:"",mod:"Cadastros",
    cols:[["banco","Banco"],["nomebanco","Nome"],["agencia","Agência"],["conta","Conta"],["subconta","Sub conta"],["saldo","Saldo","money"]],
    tabs:[
      {name:"Cadastrais",fields:[
        {k:"banco",l:"Banco",req:1},{k:"nomebanco",l:"Nome do banco",w:2},{k:"agencia",l:"Agência",req:1},{k:"dvag",l:"DV Agência"},
        {k:"conta",l:"Conta",req:1},{k:"dvconta",l:"DV Conta"},{k:"subconta",l:"Sub Conta",req:1},{k:"saldo",l:"Saldo atual",t:"number",step:"0.01"},
        {k:"tabela",l:"Tabela"},{k:"nrobytes",l:"Nro. Bytes",t:"number",step:"1"},{k:"cobeletron",l:"Cob. Eletrônica",t:"select",opts:["1 - Não","2 - Sim"]}]},
      {name:"Retorno Automático",fields:[
        {k:"operacao",l:"Operação",w:3},{k:"iof",l:"IOF (%)",t:"number",step:"0.001"},{k:"lote",l:"Lote CNAB"},{k:"faixaini",l:"Faixa início"},{k:"faixafim",l:"Faixa fim"}]},
      {name:"Extrato / Conciliação",fields:[
        {k:"bytesext",l:"Bytes extrato",t:"number"},{k:"formatodata",l:"Formato data",t:"select",opts:["1 - DDMMAA","2 - DDMMAAAA"]}]}
    ],def:{saldo:0,tabela:"17",nrobytes:400,cobeletron:"1 - Não",iof:0}},
  receber:{store:"titulos",filter:{tipo:"R"},title:"Contas a receber",mod:"Financeiro",prefix:"",titulo:1,
    cols:[["vencimento","Vencimento","date"],["descricao","Descrição"],["entidade","Cliente"],["valor","Valor","money"],["status","Situação","tstatus"]],
    tabs:[{name:"Cadastrais",fields:[
      {k:"descricao",l:"Descrição",req:1,w:2},{k:"entidade",l:"Cliente",t:"select",dyn:"clientes",w:2},{k:"categoria",l:"Categoria",t:"select",opts:["Vendas","Serviços","Outras receitas"]},
      {k:"valor",l:"Valor",t:"number",step:"0.01",req:1},{k:"emissao",l:"Emissão",t:"date"},{k:"vencimento",l:"Vencimento",t:"date",req:1},{k:"banco",l:"Banco",t:"select",dyn:"bancos"},{k:"status",l:"Situação",t:"select",opts:["Aberto","Pago"]}]}],
    def:{tipo:"R",categoria:"Vendas",valor:0,status:"Aberto"}},
  pagar:{store:"titulos",filter:{tipo:"P"},title:"Contas a pagar",mod:"Financeiro",prefix:"",titulo:1,
    cols:[["vencimento","Vencimento","date"],["descricao","Descrição"],["categoria","Categoria"],["valor","Valor","money"],["status","Situação","tstatus"]],
    tabs:[{name:"Cadastrais",fields:[
      {k:"descricao",l:"Descrição",req:1,w:2},{k:"entidade",l:"Fornecedor",w:2},{k:"categoria",l:"Categoria",t:"select",opts:["Fornecedores","Aluguel","Folha de pagamento","Energia e água","Impostos","Marketing","Outras despesas"]},
      {k:"valor",l:"Valor",t:"number",step:"0.01",req:1},{k:"emissao",l:"Emissão",t:"date"},{k:"vencimento",l:"Vencimento",t:"date",req:1},{k:"banco",l:"Banco",t:"select",dyn:"bancos"},{k:"status",l:"Situação",t:"select",opts:["Aberto","Pago"]}]}],
    def:{tipo:"P",categoria:"Fornecedores",valor:0,status:"Aberto"}}
};
ENT.documentos={store:"documentos",title:"Documentos fiscais",prefix:"D",mod:"Fiscal / Documentos",
  cols:[["data","Data","date"],["tipo","Tipo"],["numero","Número"],["entidade","Emitente / cliente"],["valor","Valor","money"],["status","Situação","badge"]],
  tabs:[
    {name:"Documento",fields:[
      {k:"tipo",l:"Tipo",t:"select",opts:["NF-e","NFS-e","NFC-e","Recibo","Comprovante"],req:1},
      {k:"numero",l:"Número",req:1},{k:"serie",l:"Série"},{k:"chave",l:"Chave de acesso",w:2},
      {k:"entidade",l:"Emitente / cliente",w:2},{k:"data",l:"Data",t:"date",req:1},{k:"valor",l:"Valor",t:"number",step:"0.01",req:1},{k:"tituloId",l:"Conta a pagar / receber",t:"select",dyn:"titulos",w:2},
      {k:"status",l:"Situação",t:"select",opts:["Pendente","Arquivado"]}]},
    {name:"Arquivo",fields:[
      {k:"arquivoNome",l:"Arquivo anexado",w:2},{k:"driveUrl",l:"Google Drive",w:2},
      {k:"observacao",l:"Observação",w:3}]}
  ],
  def:{tipo:"NF-e",status:"Pendente",valor:0,data:TODAY,tituloId:"",arquivoNome:"",driveUrl:"",observacao:""}};
ENT.usuarios={store:"usuarios",title:"Usuários",prefix:"",mod:"Administração",
  cols:[["nome","Nome"],["usuario","Usuário"],["perfil","Perfil","perfil"],["status","Situação","badge"]],
  tabs:[{name:"Cadastrais",fields:[
    {k:"nome",l:"Nome",req:1,w:2},{k:"usuario",l:"Usuário (login)",req:1},{k:"senha",l:"Senha",t:"password"},
    {k:"perfil",l:"Perfil",t:"select",dyn:"perfis",req:1},{k:"status",l:"Situação",t:"select",opts:["Ativo","Inativo"]}]}],
  def:{perfil:"funcionario",status:"Ativo"}};
const MENU=[
  ["Geral",[["dash","Painel"]]],
  ["Cadastros",[["clientes","Clientes"],["produtos","Produtos e estoque"],["bancos","Bancos"]]],
  ["Fiscal / Documentos",[["documentos","Documentos fiscais"]]],
  ["Financeiro",[["receber","Contas a receber"],["pagar","Contas a pagar"]]],
  ["Administração",[["usuarios","Usuários"],["permissoes","Permissões"]]]
];
/* ---------- permissões ---------- */
function canFor(u,mod,act){
  if(!u) return false;
  if(u.perfil==="dev") return true;
  const p=db.perms[u.perfil];
  return !!(p&&p[mod]&&p[mod].includes(act||"ver"));
}
function canScreenFor(u,id){ return id==="permissoes" ? !!u&&u.perfil==="dev" : canFor(u,id,"ver"); }
const can=(mod,act)=>canFor(user,mod,act);
const canScreen=id=>canScreenFor(user,id);
function firstScreenFor(u){
  for(const g of MENU) for(const it of g[1]) if(canScreenFor(u,it[0])) return it[0];
  return null;
}
const firstScreen=()=>firstScreenFor(user);

function rowsOf(key){
  const e=ENT[key];
  let rows=db[e.store].filter(r=>!e.filter||Object.keys(e.filter).every(k=>r[k]===e.filter[k]));
  if(key==="usuarios"&&user&&user.perfil!=="dev") rows=rows.filter(u=>u.perfil==="funcionario");
  return rows;
}
function optionsFor(f){
  if(f.dyn==="clientes") return [""].concat(db.clientes.map(c=>c.nome));
  if(f.dyn==="bancos") return db.bancos.map(b=>b.banco);
  if(f.dyn==="perfis") return user&&user.perfil==="dev"?["funcionario","admin","dev"]:["funcionario"];
  if(f.dyn==="titulos") return [""].concat(db.titulos.map(t=>t.id));
  return f.opts||[];
}
function optLabel(f,o){
  if(f.dyn==="perfis") return ROLE[o]||o;
  if(f.dyn==="bancos"){const b=db.bancos.find(x=>x.banco===o);return b?o+" - "+(b.nomebanco||""):o}
  if(f.dyn==="titulos"){const t=db.titulos.find(x=>x.id===o);return t?(t.tipo==="R"?"A receber":"A pagar")+" · "+(t.descricao||"")+" · "+money(t.valor):"Sem associação"}
  return o===""?"—":o;
}
function nextCode(e){
  const list=db[e.store];let max=0;
  list.forEach(r=>{const m=/(\d+)/.exec(r.codigo||"");if(m)max=Math.max(max,parseInt(m[1],10))});
  return e.prefix+pad(Math.floor(max/10)+1)+"0";
}

/* ---------- estado de abas ---------- */
let tabs=[];
let active=null;
let permRole="funcionario";
let search={};
let formTab={}; // id da aba -> índice da aba interna

function openTab(t){
  if(!tabs.find(x=>x.id===t.id)) tabs.push(t);
  active=t.id; render(); $("#side").classList.remove("open");
}
function openScreen(id){
  if(!canScreen(id)){toast("Você não tem acesso a esta tela");return;}
  if(id==="dash") return openTab({id:"dash",title:"Painel",type:"dash"});
  if(id==="permissoes") return openTab({id:"perms",title:"Permissões",type:"perms",ent:"permissoes"});
  openTab({id:"list:"+id,title:ENT[id].title,type:"list",ent:id});
}
function openForm(ent,recId){
  if(!can(ent,recId?"alterar":"incluir")){toast("Você não tem permissão para isso");return;}
  const e=ENT[ent];const isNew=!recId;
  const id="form:"+ent+":"+(recId||"new");
  if(!tabs.find(x=>x.id===id)){
    const base=isNew?Object.assign({},e.def,e.filter||{}):Object.assign({},db[e.store].find(r=>r.id===recId));
    if(isNew&&e.tabs[0].fields.some(f=>f.auto)) base.codigo=nextCode(e);
    if(ent==="usuarios") base.senha="";
    tabs.push({id,title:(isNew?"Incluir ":"Alterar ")+e.title.toLowerCase(),type:"form",ent,recId:recId||null,draft:base,errors:{}});
  }
  active=id;render();
}
function closeTab(id){
  const i=tabs.findIndex(t=>t.id===id);if(i<0||tabs.length<=1)return;
  tabs.splice(i,1);
  if(active===id) active=(tabs[i]||tabs[i-1]).id;
  render();
}

/* ---------- render ---------- */
function render(){
  const cur=tabs.find(t=>t.id===active)||tabs[0];
  $("#tabs").innerHTML=tabs.map(t=>`<button class="tab ${t.id===active?"on":""}" role="tab" aria-selected="${t.id===active}" data-act="go" data-id="${esc(t.id)}">${esc(t.title)}${tabs.length>1?`<span class="x" role="button" aria-label="Fechar ${esc(t.title)}" data-act="close" data-id="${esc(t.id)}">✕</span>`:""}</button>`).join("");
  const activeEnt = cur.ent || (cur.type==="dash"?"dash":"");
  $("#side").innerHTML=MENU.map(([g,items])=>{const vis=items.filter(([k])=>canScreen(k));return vis.length?`<h3>${g}</h3>`+vis.map(([k,l])=>`<button class="item ${(cur.type==="dash"&&k==="dash")||(cur.ent===k)?"on":""}" data-act="nav" data-id="${k}">${l}</button>`).join(""):""}).join("")+
    `<div class="foot">${user.perfil==="dev"?`<button data-act="reset">Restaurar dados de demonstração</button>`:""}<button data-act="logout">Sair da conta</button></div>`;
  const modName=cur.type==="dash"?"Painel":cur.type==="perms"?"Administração":ENT[cur.ent].mod;
  $("#modTitle").innerHTML=`GestãoLocal<span class="modn"> <span style="opacity:.5">|</span> <b>${modName}</b></span>`;
  const main=$("#main");
  if(cur.type==="dash") main.innerHTML=viewDash();
  else if(cur.type==="perms") main.innerHTML=viewPerms();
  else if(cur.type==="list") main.innerHTML=viewList(cur);
  else main.innerHTML=viewForm(cur);
}

/* ----- lista ----- */
function fmtCell(v,fmt,r){
  if(fmt==="money") return money(v);
  if(fmt==="date") return fdate(v);
  if(fmt==="badge"){
    const c=v==="Ativo"||v==="Arquivado"?"b-ok":v==="Bloqueado"?"b-bad":v==="Pendente"?"b-warn":"b-off";
    return `<span class="badge ${c}">${esc(v)}</span>`;
  }
  if(fmt==="tstatus"){
    if(r.status==="Pago") return `<span class="badge b-ok">${r.tipo==="R"?"Recebido":"Pago"}</span>`;
    return r.vencimento<TODAY?`<span class="badge b-bad">Vencido</span>`:`<span class="badge b-warn">Em aberto</span>`;
  }
  if(fmt==="perfil"){return `<span class="badge ${v==="dev"?"b-warn":v==="admin"?"b-ok":"b-off"}">${esc(ROLE[v]||v)}</span>`}
  if(fmt==="stock"){const low=Number(r.estoque)<=Number(r.minimo);return `<span class="badge ${low?"b-bad":"b-ok"}">${esc(v)}${low?" · repor":""}</span>`}
  return esc(v);
}
function listRows(key){
  const e=ENT[key];const q=(search[key]||"").toLowerCase();
  let rows=rowsOf(key);
  if(e.titulo) rows=rows.slice().sort((a,b)=>b.vencimento.localeCompare(a.vencimento));
  if(q) rows=rows.filter(r=>e.cols.some(c=>String(r[c[0]]||"").toLowerCase().includes(q)));
  if(key==="documentos"){
    const f=docFilters;
    if(f.numero) rows=rows.filter(r=>String(r.numero||"").toLowerCase().includes(f.numero.toLowerCase()));
    if(f.chave) rows=rows.filter(r=>String(r.chave||"").toLowerCase().includes(f.chave.toLowerCase()));
    if(f.entidade) rows=rows.filter(r=>String(r.entidade||"").toLowerCase().includes(f.entidade.toLowerCase()));
    if(f.de) rows=rows.filter(r=>String(r.data||"")>=f.de);
    if(f.ate) rows=rows.filter(r=>String(r.data||"")<=f.ate);
    if(f.tipo) rows=rows.filter(r=>r.tipo===f.tipo);
  }
  return rows;
}
function tbodyHtml(key){
  const e=ENT[key];const rows=listRows(key);
  if(!rows.length) return `<tr><td colspan="${e.cols.length+1}" class="empty">Nenhum registro encontrado. Use “Incluir” para cadastrar o primeiro.</td></tr>`;
  return rows.map(r=>`<tr>${e.cols.map(c=>`<td data-l="${esc(c[1])}" class="${c[2]==="money"?"num":""}">${fmtCell(r[c[0]],c[2],r)}</td>`).join("")}
    <td class="act">${key==="documentos"&&can(key,"alterar")?`<button class="clip-btn" data-act="attach" data-ent="${key}" data-id="${r.id}" title="${r.arquivoNome?"Trocar anexo":"Anexar arquivo"}" aria-label="${r.arquivoNome?"Trocar anexo":"Anexar arquivo"}">📎${r.arquivoNome?" ✓":""}</button>`:""}${e.titulo&&r.status!=="Pago"&&can(key,"alterar")?`<button data-act="baixar" data-ent="${key}" data-id="${r.id}">Baixar</button>`:""}${can(key,"alterar")?`<button data-act="edit" data-ent="${key}" data-id="${r.id}">Alterar</button>`:""}${can(key,"excluir")?`<button class="del" data-act="del" data-ent="${key}" data-id="${r.id}">Excluir</button>`:""}</td></tr>`).join("");
}
function viewList(t){
  const key=t.ent,e=ENT[key];
  const toolbar=key==="documentos"?`<div class="doc-filterbar">
    <div class="filter-field"><label for="doc_numero">Número</label><input id="doc_numero" type="search" placeholder="Ex.: 2041" value="${esc(docFilters.numero)}"></div>
    <div class="filter-field filter-wide"><label for="doc_chave">Chave de acesso</label><input id="doc_chave" type="search" placeholder="44 dígitos" value="${esc(docFilters.chave)}"></div>
    <div class="filter-field filter-wide"><label for="doc_entidade">Entidade</label><input id="doc_entidade" type="search" placeholder="Emitente / cliente" value="${esc(docFilters.entidade)}"></div>
    <div class="filter-field"><label for="doc_de">De</label><input id="doc_de" type="date" value="${esc(docFilters.de)}"></div>
    <div class="filter-field"><label for="doc_ate">Até</label><input id="doc_ate" type="date" value="${esc(docFilters.ate)}"></div>
    <div class="filter-field"><label for="doc_tipo">Tipo</label><select id="doc_tipo"><option value="">Todos</option>${["NF-e","NFS-e","NFC-e","Recibo","Comprovante"].map(o=>`<option value="${o}" ${docFilters.tipo===o?"selected":""}>${o}</option>`).join("")}</select></div>
    <button class="btn" data-act="docclear">Limpar</button>
  </div>`:`<div class="toolbar"><input type="search" id="q" placeholder="Buscar em ${e.title.toLowerCase()}" value="${esc(search[key]||"")}" aria-label="Buscar">`;
  return `<div class="screen-head"><h2>${e.title}</h2><div class="actions">${can(key,"incluir")?`<button class="btn primary" data-act="new" data-ent="${key}">Incluir</button>`:""}</div></div>
  <div class="tbl-wrap">${toolbar}${key!=="documentos"?`<span class="count" id="cnt">${listRows(key).length} registro(s)</span></div>`:`<div class="doc-filter-count"><span class="count" id="cnt">${listRows(key).length} registro(s)</span></div>`}
  <table class="tbl-list"><thead><tr>${e.cols.map(c=>`<th class="${c[2]==="money"?"num":""}">${c[1]}</th>`).join("")}<th></th></tr></thead><tbody id="tb">${tbodyHtml(key)}</tbody></table></div>`;
}

/* ----- formulário ----- */
function fieldHtml(f,t){
  const v=t.draft[f.k]; const bad=t.errors[f.k];
  const cls=`fld ${f.req?"req":""} ${bad?"bad":""} ${f.w?"w"+f.w:""}`;
  let input;
  if(f.t==="select"){
    input=`<select id="f_${f.k}" data-k="${f.k}">${optionsFor(f).map(o=>`<option value="${esc(o)}" ${String(v)===String(o)?"selected":""}>${esc(optLabel(f,o))}</option>`).join("")}</select>`;
  }else{
    const type=f.t||"text";
    input=`<input id="f_${f.k}" data-k="${f.k}" type="${type}" ${f.step?`step="${f.step}"`:""} value="${esc(v==null?"":v)}" ${f.auto?"readonly":""} ${f.t==="password"?`autocomplete="new-password" placeholder="${t.recId?"Em branco = manter a atual":""}"`:""}>`;
  }
  return `<div class="${cls}"><label for="f_${f.k}">${f.l}</label>${input}${bad?`<div class="hint">${bad}</div>`:""}</div>`;
}
function viewForm(t){
  const e=ENT[t.ent];const idx=formTab[t.id]||0;const tab=e.tabs[idx];
  const isNew=!t.recId;
  return `<div class="screen-head"><h2>Atualiza ${e.title} - ${isNew?"INCLUIR":"ALTERAR"}</h2>
    <div class="actions">${!isNew&&can(t.ent,"excluir")?`<button class="btn danger" data-act="del" data-ent="${t.ent}" data-id="${t.recId}">Excluir</button>`:""}<button class="btn" data-act="close" data-id="${esc(t.id)}">Cancelar</button><button class="btn primary" data-act="save" data-id="${esc(t.id)}">Salvar</button></div></div>
    <div class="form-wrap">${e.tabs.length>1?`<div class="ftabs" role="tablist">${e.tabs.map((x,i)=>`<button role="tab" class="${i===idx?"on":""}" data-act="ftab" data-i="${i}" data-id="${esc(t.id)}">${x.name}</button>`).join("")}</div>`:""}
    <div class="fgrid">${tab.fields.map(f=>fieldHtml(f,t)).join("")}</div></div>`;
}

/* ----- dashboard ----- */
const MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function viewDash(){
  const T=db.titulos;
  const open=(tp)=>T.filter(t=>t.tipo===tp&&t.status!=="Pago");
  const aRec=open("R").reduce((s,t)=>s+t.valor,0), aPag=open("P").reduce((s,t)=>s+t.valor,0);
  const venc=T.filter(t=>t.status!=="Pago"&&t.vencimento<TODAY);
  const saldo=db.bancos.reduce((s,b)=>s+Number(b.saldo||0),0);
  const low=db.produtos.filter(p=>Number(p.estoque)<=Number(p.minimo));
  // 6 meses
  const months=[];for(let i=-5;i<=0;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);months.push({key:d.getFullYear()+"-"+pad(d.getMonth()+1),label:MES[d.getMonth()],r:0,p:0})}
  T.forEach(t=>{const m=months.find(x=>t.vencimento.startsWith(x.key));if(m){if(t.tipo==="R")m.r+=t.valor;else m.p+=t.valor}});
  const max=Math.max(1,...months.map(m=>Math.max(m.r,m.p)));
  const W=560,H=230,L=44,B=26,Tp=10,bw=18,gap=(W-L)/months.length;
  const step=niceStep(max/4);
  let grid="";for(let v=0;v<=max*1.02;v+=step){const y=H-B-(v/(max*1.08))*(H-B-Tp);grid+=`<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y+4}" text-anchor="end">${v>=1000?(v/1000)+"k":v}</text>`}
  let bars="";months.forEach((m,i)=>{
    const cx=L+gap*i+gap/2;const hr=(m.r/(max*1.08))*(H-B-Tp),hp=(m.p/(max*1.08))*(H-B-Tp);
    bars+=`<rect x="${cx-bw-1}" y="${H-B-hr}" width="${bw}" height="${hr}" fill="var(--accent)" rx="2"><title>Receitas ${m.label}: ${money(m.r)}</title></rect>
    <rect x="${cx+1}" y="${H-B-hp}" width="${bw}" height="${hp}" fill="var(--amber)" rx="2"><title>Despesas ${m.label}: ${money(m.p)}</title></rect>
    <text x="${cx}" y="${H-8}" text-anchor="middle">${m.label}</text>`});
  // rosca
  const byCat={};T.filter(t=>t.tipo==="P").forEach(t=>byCat[t.categoria]=(byCat[t.categoria]||0)+t.valor);
  const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);const tot=cats.reduce((s,c)=>s+c[1],0)||1;
  const pal=["#1a9cc0","#e0a030","#2f9e6b","#8a6fd1","#d2413f","#6b7f8c","#c56aa0"];
  let acc=0;const R=52,C=2*Math.PI*R;
  const segs=cats.map((c,i)=>{const len=c[1]/tot*C;const s=`<circle r="${R}" cx="70" cy="70" fill="none" stroke="${pal[i%pal.length]}" stroke-width="22" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"><title>${esc(c[0])}: ${money(c[1])}</title></circle>`;acc+=len;return s}).join("");
  const prox=T.filter(t=>t.status!=="Pago").sort((a,b)=>a.vencimento.localeCompare(b.vencimento)).slice(0,7);
  return `<div class="screen-head"><h2>Visão geral do negócio</h2><div class="actions">${canScreen("receber")?`<button class="btn" data-act="nav" data-id="receber">Nova cobrança</button>`:""}${can("clientes","incluir")?`<button class="btn primary" data-act="new" data-ent="clientes">Novo cliente</button>`:""}</div></div>
  <div class="kpis">
    <div class="kpi k-ok"><small>A receber</small><strong>${money(aRec)}</strong><em>${open("R").length} títulos em aberto</em></div>
    <div class="kpi k-amber"><small>A pagar</small><strong>${money(aPag)}</strong><em>${open("P").length} títulos em aberto</em></div>
    <div class="kpi"><small>Saldo em bancos</small><strong>${money(saldo)}</strong><em>${db.bancos.length} contas</em></div>
    <div class="kpi ${venc.length?"k-bad":"k-ok"}"><small>Vencidos</small><strong>${money(venc.reduce((s,t)=>s+t.valor,0))}</strong><em>${venc.length} título(s) atrasado(s)</em></div>
  </div>
  <div class="grid2">
    <div class="card"><h3>Receitas e despesas por mês</h3><div class="sub">Pelo vencimento dos títulos, últimos 6 meses</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gráfico de barras de receitas e despesas dos últimos seis meses">${grid}${bars}</svg>
      <div class="legend"><span><i style="background:var(--accent)"></i>Receitas</span><span><i style="background:var(--amber)"></i>Despesas</span></div></div>
    <div class="card"><h3>Despesas por categoria</h3><div class="sub">Total lançado em contas a pagar</div>
      <div class="donut-row"><svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="Rosca de despesas por categoria">${segs}<text x="70" y="68" text-anchor="middle" style="font-size:11px">Total</text><text x="70" y="84" text-anchor="middle" style="font-size:12px;fill:var(--ink);font-weight:600">${moneyK(tot)}</text></svg>
      <ul>${cats.map((c,i)=>`<li><span><i style="background:${pal[i%pal.length]}"></i>${esc(c[0])}</span><span>${Math.round(c[1]/tot*100)}%</span></li>`).join("")}</ul></div></div>
  </div>
  <div class="grid2">
    <div class="card"><h3>Próximos vencimentos</h3><div class="tbl-wrap" style="border:0"><table class="mini"><thead><tr><th>Venc.</th><th>Descrição</th><th>Tipo</th><th class="num">Valor</th></tr></thead><tbody>
      ${prox.map(t=>`<tr><td>${fdate(t.vencimento)}</td><td>${esc(t.descricao)}</td><td>${fmtCell(null,"tstatus",t)}</td><td class="num">${money(t.valor)}</td></tr>`).join("")||`<tr><td colspan="4" class="empty">Nenhum título em aberto.</td></tr>`}</tbody></table></div></div>
    <div class="card"><h3>Estoque para repor</h3><div class="sub">Produtos no mínimo ou abaixo dele</div>
      ${low.length?`<table class="mini"><tbody>${low.map(p=>`<tr><td>${esc(p.descricao)}</td><td class="num">${esc(p.estoque)} / ${esc(p.minimo)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Estoque em dia.</div>`}</div>
  </div>`;
}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x||1)));const n=x/p;return (n<=1?1:n<=2?2:n<=5?5:10)*p}

/* ---------- Google Drive / anexos ---------- */
const DRIVE_CONFIG={clientId:"",folderId:""};
let driveToken=null,driveTokenClient=null;

function driveConfigured(){
  return !!DRIVE_CONFIG.clientId;
}
function ensureDriveScript(){
  if(document.querySelector('script[data-gis]')) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src="https://accounts.google.com/gsi/client";s.async=true;s.defer=true;s.dataset.gis="1";
    s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
}
async function getDriveToken(){
  if(!driveConfigured()) throw new Error("Configure o Client ID do Google Drive em DRIVE_CONFIG.");
  await ensureDriveScript();
  return new Promise((resolve,reject)=>{
    try{
      driveTokenClient=google.accounts.oauth2.initTokenClient({
        client_id:DRIVE_CONFIG.clientId,
        scope:"https://www.googleapis.com/auth/drive.file",
        callback:(resp)=>{if(resp.error)reject(new Error(resp.error));else{driveToken=resp.access_token;resolve(driveToken);}}
      });
      driveTokenClient.requestAccessToken({prompt:driveToken?"":"consent"});
    }catch(e){reject(e);}
  });
}
async function uploadToDrive(file){
  const token=await getDriveToken();
  const metadata={name:file.name,mimeType:file.type||"application/octet-stream"};
  if(DRIVE_CONFIG.folderId) metadata.parents=[DRIVE_CONFIG.folderId];
  const body=new FormData();
  body.append("metadata",new Blob([JSON.stringify(metadata)],{type:"application/json"}));
  body.append("file",file);
  const res=await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",{
    method:"POST",headers:{Authorization:"Bearer "+token},body
  });
  if(!res.ok) throw new Error("Falha no upload para o Google Drive.");
  return res.json();
}
async function attachDocument(id,file){
  const doc=db.documentos.find(d=>d.id===id);if(!doc)return;
  doc.arquivoNome=file.name;
  if(driveConfigured()){
    try{
      toast("Enviando para o Google Drive…");
      const result=await uploadToDrive(file);
      doc.driveId=result.id||"";
      doc.driveUrl=result.webViewLink||("https://drive.google.com/file/d/"+result.id+"/view");
      doc.status="Arquivado";
      save();render();toast("Arquivo salvo no Google Drive");
      return;
    }catch(err){
      save();render();toast(err.message||"Não foi possível enviar ao Google Drive");
      return;
    }
  }
  doc.driveUrl="";
  save();render();
  toast("Anexo registrado. Configure o Google Drive para enviar o arquivo à nuvem.");
}
/* ---------- eventos ---------- */
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-act]");if(!el)return;
  const act=el.dataset.act,id=el.dataset.id,ent=el.dataset.ent;
  if(act==="go"){active=id;render();}
  else if(act==="home"){openScreen(firstScreen());}
  else if(act==="logout"){logout();}
  else if(act==="pick"){loginRole=el.dataset.role;loginErr="";renderLogin();}
  else if(act==="back"){loginRole=null;loginErr="";renderLogin();}
  else if(act==="usedefault"){const d=DEFAULT_USERS[loginRole];attemptLogin(d.u,d.p);}
  else if(act==="docclear"){docFilters={numero:"",chave:"",entidade:"",de:"",ate:"",tipo:""};render();}
  else if(act==="attach"){
    const input=document.createElement("input");input.type="file";input.accept="image/*,.pdf,.xml";
    input.onchange=()=>{const f=input.files&&input.files[0];if(f)attachDocument(id,f);};
    input.click();
  }
  else if(act==="showpw"){const i=$("#lg_pw");i.type=i.type==="password"?"text":"password";el.textContent=i.type==="password"?"Mostrar":"Ocultar";}
  else if(act==="prole"){permRole=el.dataset.role;render();}
  else if(act==="permreset"){if(user.perfil==="dev"){db.perms[permRole]=defaultPerms()[permRole];save();render();toast("Permissões do perfil restauradas");}}
  else if(act==="close"){ev.stopPropagation();closeTab(id);}
  else if(act==="nav"){openScreen(id);}
  else if(act==="menu"){$("#side").classList.toggle("open");}
  else if(act==="theme"){const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=dark?"light":"dark";}
  else if(act==="new"){openForm(ent,null);}
  else if(act==="edit"){openForm(ent,id);}
  else if(act==="ftab"){formTab[id]=+el.dataset.i;render();}
  else if(act==="save"){saveForm(id);}
  else if(act==="del"){
    if(!can(ent,"excluir")){toast("Você não tem permissão para excluir");return;}
    const e=ENT[ent];const r=db[e.store].find(x=>x.id===id);if(!r)return;
    if(ent==="usuarios"){
      if(id===user.id){toast("Você não pode excluir o próprio usuário");return;}
      if(r.perfil==="dev"&&db.usuarios.filter(u=>u.perfil==="dev").length<=1){toast("É preciso manter ao menos um desenvolvedor");return;}
    }
    if(!confirm("Excluir este registro? Essa ação não pode ser desfeita."))return;
    db[e.store]=db[e.store].filter(x=>x.id!==id);save();
    tabs=tabs.filter(t=>t.id!=="form:"+ent+":"+id);
    if(!tabs.length){openScreen(firstScreen());toast("Registro excluído");return;}
    if(!tabs.find(t=>t.id===active)) active=(tabs.find(t=>t.id==="list:"+ent)||tabs[0]).id;
    render();toast("Registro excluído");
  }
  else if(act==="baixar"){
    if(!can(ent,"alterar"))return;
    const r=db.titulos.find(x=>x.id===id);if(r){r.status="Pago";save();render();toast(r.tipo==="R"?"Recebimento registrado":"Pagamento registrado");}
  }
  else if(act==="reset"){
    if(confirm("Restaurar os dados de demonstração? Suas alterações serão perdidas.")){if(user.perfil!=="dev")return;db=seed();save();logout();toast("Dados restaurados. Entre novamente.");}
  }
});
document.addEventListener("input",ev=>{
  const el=ev.target;
  const docMap={doc_numero:"numero",doc_chave:"chave",doc_entidade:"entidade",doc_de:"de",doc_ate:"ate"};
  if(docMap[el.id]){
    docFilters[docMap[el.id]]=el.value;
    const t=tabs.find(x=>x.id===active);
    if(t&&t.ent==="documentos"){$("#tb").innerHTML=tbodyHtml("documentos");$("#cnt").textContent=listRows("documentos").length+" registro(s)";}
    return;
  }
  if(el.id==="q"){
    const t=tabs.find(x=>x.id===active);search[t.ent]=el.value;
    $("#tb").innerHTML=tbodyHtml(t.ent);$("#cnt").textContent=listRows(t.ent).length+" registro(s)";return;
  }
  if(el.dataset.k){
    const t=tabs.find(x=>x.id===active);if(!t||t.type!=="form")return;
    t.draft[el.dataset.k]=el.type==="number"?(el.value===""?"":Number(el.value)):el.value;
    if(t.errors[el.dataset.k]){delete t.errors[el.dataset.k];const box=el.closest(".fld");box.classList.remove("bad");const h=$(".hint",box);if(h)h.remove();}
  }
});
document.addEventListener("change",ev=>{
  const el=ev.target;
  if(el.id==="doc_tipo"){
    docFilters.tipo=el.value;
    $("#tb").innerHTML=tbodyHtml("documentos");$("#cnt").textContent=listRows("documentos").length+" registro(s)";
    return;
  }
  if(el.dataset&&el.dataset.k){
    const t=tabs.find(x=>x.id===active);
    if(t&&t.type==="form"){
      t.draft[el.dataset.k]=el.value;
      if(t.errors[el.dataset.k]){delete t.errors[el.dataset.k];const box=el.closest(".fld");if(box){box.classList.remove("bad");const h=$(".hint",box);if(h)h.remove();}}
      if(t.ent==="documentos"&&el.dataset.k==="tituloId"){const linked=db.titulos.find(x=>x.id===el.value);if(linked){t.draft.valor=Number(linked.valor)||t.draft.valor;t.draft.entidade=t.draft.entidade||linked.entidade||"";}}
    }
    return;
  }
  if(!el.dataset||!el.dataset.perm)return;
  if(!user||user.perfil!=="dev")return;
  const [mod,act]=el.dataset.perm.split(":");
  const p=db.perms[permRole]=db.perms[permRole]||{};
  let list=(p[mod]||[]).slice();
  if(el.checked){if(!list.includes(act))list.push(act);if(!list.includes("ver"))list.push("ver");}
  else{list=act==="ver"?[]:list.filter(x=>x!==act);}
  p[mod]=list;save();render();toast("Permissão atualizada");
});
document.addEventListener("submit",ev=>{
  if(ev.target.id==="lgform"){ev.preventDefault();attemptLogin($("#lg_user").value,$("#lg_pw").value);}
});
function viewPerms(){
  const p=db.perms[permRole]||{};
  return `<div class="screen-head"><h2>Permissões por perfil</h2><div class="actions"><button class="btn" data-act="permreset">Restaurar padrão do perfil</button></div></div>
  <div class="card" style="margin-bottom:14px"><p style="margin:0 0 12px">Escolha o perfil e marque o que ele pode fazer em cada tela. <b>Acessar</b> mostra a tela no menu; as outras ações liberam os botões dentro dela. O Desenvolvedor sempre tem acesso total.</p>
  <div class="seg" role="tablist">${["funcionario","admin"].map(r=>`<button role="tab" aria-selected="${r===permRole}" class="${r===permRole?"on":""}" data-act="prole" data-role="${r}">${ROLE[r]}</button>`).join("")}</div></div>
  <div class="tbl-wrap"><table class="perm"><thead><tr><th>Tela</th>${ACTIONS.map(a=>`<th class="chk">${a[1]}</th>`).join("")}</tr></thead><tbody>
  ${MODULES.map(([k,l])=>`<tr><td>${l}</td>${ACTIONS.map(([a,al])=>`<td class="chk"><input type="checkbox" data-perm="${k}:${a}" ${(p[k]||[]).includes(a)?"checked":""} aria-label="${l}: ${al}"></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/* ---------- login ---------- */
let loginRole=null,loginErr="";
function renderLogin(anim){
  if(anim===undefined)anim=true;
  $("#login").classList.toggle("noanim",!anim);
  let card;
  if(!loginRole){
    card=`<h1>Quem vai entrar?</h1><p class="sub">Escolha o seu perfil de acesso.</p>
    <div class="roles">
      <button class="role" data-act="pick" data-role="funcionario"><span class="rt"><b>Funcionário</b><small>Estoque e produtos</small></span></button>
      <button class="role r-admin" data-act="pick" data-role="admin"><span class="rt"><b>Administrador</b><small>Gestão completa do negócio</small></span></button>
      <button class="role r-dev" data-act="pick" data-role="dev"><span class="rt"><b>Desenvolvedor</b><small>Define quem pode fazer o quê</small></span></button>
    </div>
    <details class="cred"><summary>Usuários padrão de demonstração</summary>
      <table><thead><tr><th>Perfil</th><th>Usuário</th><th>Senha</th></tr></thead><tbody>${Object.keys(DEFAULT_USERS).map(r=>`<tr><td>${ROLE[r]}</td><td>${DEFAULT_USERS[r].u}</td><td>${DEFAULT_USERS[r].p}</td></tr>`).join("")}</tbody></table>
      <p>Troque essas senhas em Usuários antes de usar de verdade.</p></details>`;
  }else{
    card=`<h1>${ROLE[loginRole]}</h1><p class="sub">Entre com seu usuário e senha.</p>
    <form id="lgform"><div class="fld"><label for="lg_user">Usuário</label><input id="lg_user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></div>
    <div class="fld" style="margin-top:14px"><label for="lg_pw">Senha</label><div class="pwrow"><input id="lg_pw" name="password" type="password" autocomplete="current-password" required><button type="button" class="btn" data-act="showpw">Mostrar</button></div></div>
    ${loginErr?`<div class="lg-err" role="alert">${esc(loginErr)}</div>`:""}
    <div class="actions lg-actions"><button type="button" class="btn" data-act="back">Voltar</button><button type="submit" class="btn primary">Entrar</button></div></form>
    <button class="linkbtn" data-act="usedefault">Entrar com o usuário padrão (${DEFAULT_USERS[loginRole].u})</button>`;
  }
  $("#lgbody").innerHTML=`<div class="lg-card">${card}</div>`;
}
function attemptLogin(u,p){
  const found=db.usuarios.find(x=>x.usuario.toLowerCase()===String(u).trim().toLowerCase());
  let err="";
  if(!found||found.senha!==hash("gl::"+p)) err="Usuário ou senha incorretos.";
  else if(found.perfil!==loginRole) err="Este usuário não é do perfil "+ROLE[loginRole]+". Volte e escolha o perfil correto.";
  else if(found.status!=="Ativo") err="Este usuário está inativo. Fale com o administrador.";
  else if(!firstScreenFor(found)) err="Seu perfil ainda não tem telas liberadas. Fale com o desenvolvedor.";
  if(err){loginErr=err;renderLogin(false);const i=$("#lg_user");if(i){i.value=String(u);const pw=$("#lg_pw");if(pw)pw.focus();}return;}
  user=found;
  try{sessionStorage.setItem("gl_session",found.id)}catch(e){}
  enterApp();
}
function setWho(){const r=ROLE[user.perfil];$("#whoBtn").textContent=user.nome===r?r:user.nome+" · "+r;}
function enterApp(){
  $("#login").hidden=true;$("#app").hidden=false;
  const ap=$("#app");ap.classList.remove("enter");void ap.offsetWidth;ap.classList.add("enter");
  tabs=[];active=null;search={};formTab={};loginRole=null;loginErr="";
  setWho();
  openScreen(firstScreen());
  resetInactivity();
}
function showLogin(){
  loginRole=null;loginErr="";
  $("#app").hidden=true;$("#login").hidden=false;$("#side").classList.remove("open");
  renderLogin();
}
function logout(){
  clearTimeout(inactivityTimer);$("#idle-screen")?.classList.remove("show");
  user=null;tabs=[];active=null;
  try{sessionStorage.removeItem("gl_session")}catch(e){}
  showLogin();
}

function saveForm(id){
  const t=tabs.find(x=>x.id===id);const e=ENT[t.ent];
  if(!can(t.ent,t.recId?"alterar":"incluir")){toast("Você não tem permissão para salvar");return;}
  t.errors={};let first=null;
  e.tabs.forEach((tab,ti)=>tab.fields.forEach(f=>{
    const v=t.draft[f.k];
    if(f.req&&(v===undefined||v===null||String(v).trim()==="")){t.errors[f.k]="Campo obrigatório";if(first===null)first=ti;}
    else if(f.t==="number"&&f.req&&Number(v)<=0){t.errors[f.k]="Informe um valor maior que zero";if(first===null)first=ti;}
  }));
  if(t.ent==="usuarios"){
    const d=t.draft;
    if(!t.recId&&!d.senha){t.errors.senha="Campo obrigatório";first=0;}
    else if(d.senha&&String(d.senha).length<4){t.errors.senha="Mínimo de 4 caracteres";first=0;}
    if(d.usuario&&db.usuarios.some(u=>u.usuario.toLowerCase()===String(d.usuario).trim().toLowerCase()&&u.id!==t.recId)){t.errors.usuario="Este usuário já existe";first=0;}
  }
  if(first!==null){formTab[id]=first;render();toast("Preencha os campos obrigatórios");return;}
  const list=db[e.store];
  const data=Object.assign({},t.draft);
  if(t.ent==="usuarios"){
    data.usuario=String(data.usuario).trim();
    const old=t.recId?list.find(r=>r.id===t.recId):null;
    data.senha=data.senha?hash("gl::"+data.senha):old.senha;
    if(user.perfil!=="dev") data.perfil="funcionario";
    if(t.recId===user.id){data.perfil=user.perfil;data.status="Ativo";}
  }
  if(t.recId){const i=list.findIndex(r=>r.id===t.recId);list[i]=Object.assign({},list[i],data);}
  else{list.push(Object.assign({id:e.store[0]+Date.now().toString(36)},data));}
  save();
  if(t.ent==="usuarios"&&t.recId===user.id){user=db.usuarios.find(u=>u.id===user.id);setWho();}
  const listId="list:"+t.ent;
  tabs=tabs.filter(x=>x.id!==id);
  if(!tabs.find(x=>x.id===listId)) tabs.push({id:listId,title:e.title,type:"list",ent:t.ent});
  active=listId;render();toast(t.recId?"Alterações salvas":"Registro incluído");
}


/* ---------- proteção de tela por inatividade ---------- */
const INACTIVITY_MS=60000;
let inactivityTimer=null;
function resetInactivity(){
  const idle=$("#idle-screen");
  if(idle&&idle.classList.contains("show")) idle.classList.remove("show");
  clearTimeout(inactivityTimer);
  if(!user)return;
  inactivityTimer=setTimeout(()=>$("#idle-screen")?.classList.add("show"),INACTIVITY_MS);
}
["mousemove","mousedown","keydown","touchstart","scroll","click"].forEach(evt=>{
  document.addEventListener(evt,()=>{if(user)resetInactivity();},{passive:true});
});

$("#today").textContent=now.toLocaleDateString("pt-BR");
/* ---------- animação de entrada (splash) ---------- */
const reduceMotion=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function endSplash(){const sp=$("#splash");if(sp)sp.hidden=true;$("#login").classList.remove("intro");}
function startIntro(){
  const sp=$("#splash");if(!sp)return;
  if(reduceMotion){endSplash();return;}
  const login=$("#login");login.classList.add("intro");renderLogin(true);
  const skip=()=>{
    if(sp.hidden)return;
    sp.classList.add("leave");login.classList.remove("intro");renderLogin(true);
    setTimeout(()=>{sp.hidden=true},400);
  };
  sp.addEventListener("click",skip);
  document.addEventListener("keydown",skip,{once:true});
  setTimeout(endSplash,5000);
}
(function boot(){
  let sid=null;try{sid=sessionStorage.getItem("gl_session")}catch(e){}
  const u=db.usuarios.find(x=>x.id===sid&&x.status==="Ativo");
  if(u&&firstScreenFor(u)){user=u;const sp=$("#splash");if(sp)sp.hidden=true;enterApp();}
  else{showLogin();startIntro();}
})();
})();
