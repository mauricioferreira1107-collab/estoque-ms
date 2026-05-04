// =====================
// CONFIGURAÇÃO DE USUÁRIOS
// =====================
// AVISO DE SEGURANÇA: este sistema é client-only. Estas credenciais ficam
// visíveis no DevTools de qualquer pessoa que abra a página. Para autenticação
// real, mova esta lista (e a verificação) para um backend.
const USUARIOS_AUTORIZADOS = [
    { usuario: 'admin', senha: 'ms2024', nome: 'Administrador', perfil: 'admin' },
    { usuario: 'jailan', senha: 'jailan123', nome: 'Jailan', perfil: 'operador' },
    { usuario: 'lucas', senha: 'lucas123', nome: 'Lucas', perfil: 'operador' },
    { usuario: 'ilmar', senha: 'ilmar123', nome: 'Ilmar', perfil: 'operador' },
    { usuario: 'valney', senha: 'valney123', nome: 'Valney', perfil: 'operador' },
];

const TEMPO_SESSAO_HORAS = 24;
const SCHEMA_VERSION = 1;
const MAX_TEXT_LEN = 200;
const MAX_LOGS = 100;

const CATEGORIAS_VALIDAS = ['EPI', 'Ferramentas', 'Consumíveis', 'Elétrico', 'Outros'];
const UNIDADES_VALIDAS = ['Unid', 'PC', 'PR', 'RL', 'SC', 'KG', 'LT'];
const STATUS_OBRA_VALIDOS = ['Em andamento', 'Ativo', 'Finalizada'];
const FUNCOES_VALIDAS = ['Motorista', 'Fiscal', 'Pintor', 'Encarregado', 'Ajudante', '-'];

// =====================
// HELPERS GERAIS
// =====================
const escHtml = (s) => {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
};

const safeParse = (raw, fallback) => {
    if (raw == null) return fallback;
    try { return JSON.parse(raw); }
    catch (e) { console.error('Falha ao ler localStorage:', e); return fallback; }
};

const debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('pt-BR'); }
    catch { return '-'; }
};

const toFiniteInt = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};

const showToast = (msg, type = 'success') => {
    const container = document.getElementById('toastContainer') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// =====================
// AUTENTICAÇÃO
// =====================
let usuarioAtual = null;

function verificarAutenticacao() {
    const dados = safeParse(localStorage.getItem('ms_sessao'), null);
    if (!dados || !dados.usuario) { mostrarLogin(); return false; }
    if (TEMPO_SESSAO_HORAS > 0 && dados.expiracao) {
        if (new Date() > new Date(dados.expiracao)) { fazerLogout(); return false; }
    }
    usuarioAtual = dados.usuario;
    mostrarSistema();
    return true;
}

function fazerLogin() {
    const usuarioInput = document.getElementById('loginUser').value.trim().toLowerCase();
    const senhaInput = document.getElementById('loginSenha').value;
    const lembrar = document.getElementById('lembrarLogin').checked;

    if (!usuarioInput || !senhaInput) {
        return mostrarErroLogin('Preencha usuário e senha');
    }

    const userEncontrado = USUARIOS_AUTORIZADOS.find((u) =>
        u.usuario.toLowerCase() === usuarioInput && u.senha === senhaInput);

    if (!userEncontrado) return mostrarErroLogin('Usuário ou senha incorretos');

    usuarioAtual = userEncontrado;
    let expiracao = null;
    if (lembrar) {
        expiracao = new Date();
        expiracao.setDate(expiracao.getDate() + 30);
    } else if (TEMPO_SESSAO_HORAS > 0) {
        expiracao = new Date();
        expiracao.setHours(expiracao.getHours() + TEMPO_SESSAO_HORAS);
    }
    try {
        localStorage.setItem('ms_sessao', JSON.stringify({
            usuario: userEncontrado,
            expiracao: expiracao ? expiracao.toISOString() : null,
            loginEm: new Date().toISOString(),
        }));
    } catch (e) {
        return mostrarErroLogin('Não foi possível salvar a sessão (armazenamento cheio?)');
    }
    registrarLog('login', `${userEncontrado.nome} entrou no sistema`);
    mostrarSistema();
    showToast(`Bem-vindo, ${userEncontrado.nome}!`);
}

function mostrarErroLogin(msg) {
    const errEl = document.getElementById('loginError');
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
    document.getElementById('loginSenha').value = '';
    document.getElementById('loginSenha').focus();
    setTimeout(() => errEl.classList.add('hidden'), 4000);
}

function fazerLogout() {
    if (usuarioAtual) registrarLog('logout', `${usuarioAtual.nome} saiu do sistema`);
    usuarioAtual = null;
    localStorage.removeItem('ms_sessao');
    mostrarLogin();
    showToast('Você saiu do sistema');
}

function mostrarLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginSenha').value = '';
    document.getElementById('loginUser').focus();
}

function mostrarSistema() {
    document.getElementById('loginScreen').classList.add('hidden');
    const nome = usuarioAtual ? usuarioAtual.nome : '';
    const elUser = document.getElementById('userLogado');
    const elUserMobile = document.getElementById('userLogadoMobile');
    if (elUser) elUser.textContent = nome;
    if (elUserMobile) elUserMobile.textContent = nome;
    if (window.lucide) lucide.createIcons();
    renderDashboard();
}

function registrarLog(tipo, mensagem) {
    let logs = safeParse(localStorage.getItem('ms_logs'), []);
    logs.push({ tipo, mensagem, usuario: usuarioAtual?.nome || 'Sistema', data: new Date().toISOString() });
    if (logs.length > MAX_LOGS) logs = logs.slice(-MAX_LOGS);
    try { localStorage.setItem('ms_logs', JSON.stringify(logs)); }
    catch (e) { /* logs são best-effort, não bloquear */ }
}

// =====================
// DADOS INICIAIS (seed)
// =====================
const initialEstoque = [
    { id: 1, categoria: "EPI", material: "Aranha para capacete", unidade: "Unid", estoque_inicial: 98, entradas: 0, saidas: 0, estoque_atual: 98, minimo: 10 },
    { id: 2, categoria: "Elétrico", material: "Bocal", unidade: "Unid", estoque_inicial: 58, entradas: 0, saidas: 0, estoque_atual: 58, minimo: 6 },
    { id: 3, categoria: "EPI", material: "Botina número 38", unidade: "Unid", estoque_inicial: 8, entradas: 0, saidas: 0, estoque_atual: 8, minimo: 6 },
    { id: 4, categoria: "EPI", material: "Botina número 39", unidade: "Unid", estoque_inicial: 5, entradas: 0, saidas: 0, estoque_atual: 5, minimo: 6 },
    { id: 5, categoria: "EPI", material: "Botina número 40", unidade: "Unid", estoque_inicial: 9, entradas: 0, saidas: 0, estoque_atual: 9, minimo: 6 },
    { id: 6, categoria: "EPI", material: "Botina número 41", unidade: "Unid", estoque_inicial: 13, entradas: 0, saidas: 0, estoque_atual: 13, minimo: 6 },
    { id: 7, categoria: "EPI", material: "Botina número 42", unidade: "Unid", estoque_inicial: 7, entradas: 0, saidas: 0, estoque_atual: 7, minimo: 6 },
    { id: 8, categoria: "EPI", material: "Botina número 43", unidade: "Unid", estoque_inicial: 8, entradas: 0, saidas: 0, estoque_atual: 8, minimo: 6 },
    { id: 9, categoria: "EPI", material: "Botina número 44", unidade: "Unid", estoque_inicial: 3, entradas: 0, saidas: 0, estoque_atual: 3, minimo: 6 },
    { id: 10, categoria: "EPI", material: "Botina número 45", unidade: "Unid", estoque_inicial: 5, entradas: 0, saidas: 0, estoque_atual: 5, minimo: 2 },
    { id: 11, categoria: "EPI", material: "Botina número 46", unidade: "Unid", estoque_inicial: 2, entradas: 0, saidas: 0, estoque_atual: 2, minimo: 1 },
    { id: 12, categoria: "Outros", material: "Corda", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 0 },
    { id: 13, categoria: "Ferramentas", material: "Cabo Gaiola 23 cm", unidade: "Unid", estoque_inicial: 99, entradas: 0, saidas: 0, estoque_atual: 99, minimo: 200 },
    { id: 14, categoria: "Ferramentas", material: "Cabo para Gambiara", unidade: "RL", estoque_inicial: 1, entradas: 0, saidas: 0, estoque_atual: 1, minimo: 200 },
    { id: 15, categoria: "EPI", material: "Capa de Proteção cal", unidade: "Unid", estoque_inicial: 10, entradas: 0, saidas: 0, estoque_atual: 10, minimo: 0 },
    { id: 16, categoria: "EPI", material: "Capacete", unidade: "Unid", estoque_inicial: 82, entradas: 0, saidas: 0, estoque_atual: 82, minimo: 10 },
    { id: 17, categoria: "EPI", material: "Capacete branco", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 2 },
    { id: 18, categoria: "EPI", material: "Cinto de segurança", unidade: "Unid", estoque_inicial: 3, entradas: 0, saidas: 0, estoque_atual: 3, minimo: 2 },
    { id: 19, categoria: "Ferramentas", material: "Desempenadeira Grande PVC", unidade: "Unid", estoque_inicial: 33, entradas: 0, saidas: 0, estoque_atual: 33, minimo: 12 },
    { id: 20, categoria: "Ferramentas", material: "Desempenadeira Pequena PVC", unidade: "Unid", estoque_inicial: 10, entradas: 0, saidas: 0, estoque_atual: 10, minimo: 12 },
    { id: 21, categoria: "Consumíveis", material: "Estopa", unidade: "SC", estoque_inicial: 6, entradas: 0, saidas: 0, estoque_atual: 6, minimo: 12 },
    { id: 22, categoria: "Elétrico", material: "Extensor", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 2 },
    { id: 23, categoria: "Elétrico", material: "Filtro/ Régua de Tomadas", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 3 },
    { id: 24, categoria: "Consumíveis", material: "Fita 18X50", unidade: "Unid", estoque_inicial: 1440, entradas: 0, saidas: 0, estoque_atual: 1440, minimo: 480 },
    { id: 25, categoria: "Consumíveis", material: "Fita 24X50", unidade: "Unid", estoque_inicial: 806, entradas: 0, saidas: 0, estoque_atual: 806, minimo: 480 },
    { id: 26, categoria: "Consumíveis", material: "Fita 48X50", unidade: "Unid", estoque_inicial: 545, entradas: 0, saidas: 0, estoque_atual: 545, minimo: 600 },
    { id: 27, categoria: "Consumíveis", material: "Fita Zebrada", unidade: "Unid", estoque_inicial: 14, entradas: 0, saidas: 0, estoque_atual: 14, minimo: 0 },
    { id: 28, categoria: "Outros", material: "Jugular", unidade: "Unid", estoque_inicial: 3, entradas: 0, saidas: 0, estoque_atual: 3, minimo: 0 },
    { id: 29, categoria: "Elétrico", material: "Lâmpadas", unidade: "Unid", estoque_inicial: 51, entradas: 0, saidas: 0, estoque_atual: 51, minimo: 40 },
    { id: 30, categoria: "Consumíveis", material: "Lixa 100", unidade: "PC", estoque_inicial: 60, entradas: 0, saidas: 0, estoque_atual: 60, minimo: 200 },
    { id: 31, categoria: "Consumíveis", material: "Lixa 100 para ferro", unidade: "PC", estoque_inicial: 93, entradas: 0, saidas: 0, estoque_atual: 93, minimo: 80 },
    { id: 32, categoria: "Consumíveis", material: "Lixa 150", unidade: "PC", estoque_inicial: 137, entradas: 0, saidas: 0, estoque_atual: 137, minimo: 200 },
    { id: 33, categoria: "Consumíveis", material: "Lixa 180", unidade: "PC", estoque_inicial: 11, entradas: 0, saidas: 0, estoque_atual: 11, minimo: 200 },
    { id: 34, categoria: "Consumíveis", material: "Lixa 220", unidade: "PC", estoque_inicial: 4, entradas: 0, saidas: 0, estoque_atual: 4, minimo: 0 },
    { id: 35, categoria: "Consumíveis", material: "Lixa 50", unidade: "PC", estoque_inicial: 77, entradas: 0, saidas: 0, estoque_atual: 77, minimo: 20 },
    { id: 36, categoria: "Consumíveis", material: "Lixa 80", unidade: "PC", estoque_inicial: 44, entradas: 0, saidas: 0, estoque_atual: 44, minimo: 20 },
    { id: 37, categoria: "Consumíveis", material: "Lona Plastica", unidade: "RL", estoque_inicial: 34, entradas: 0, saidas: 0, estoque_atual: 34, minimo: 20 },
    { id: 38, categoria: "EPI", material: "Luva", unidade: "PR", estoque_inicial: 665, entradas: 0, saidas: 0, estoque_atual: 665, minimo: 144 },
    { id: 39, categoria: "EPI", material: "Máscara", unidade: "Unid", estoque_inicial: 328, entradas: 0, saidas: 0, estoque_atual: 328, minimo: 200 },
    { id: 40, categoria: "EPI", material: "Máscara c/ Filtro", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 1 },
    { id: 41, categoria: "Consumíveis", material: "Massa Rápida", unidade: "Unid", estoque_inicial: 2, entradas: 0, saidas: 0, estoque_atual: 2, minimo: 6 },
    { id: 42, categoria: "EPI", material: "Óculos", unidade: "Unid", estoque_inicial: 70, entradas: 0, saidas: 0, estoque_atual: 70, minimo: 10 },
    { id: 43, categoria: "Outros", material: "Papelão", unidade: "RL", estoque_inicial: 22, entradas: 0, saidas: 0, estoque_atual: 22, minimo: 12 },
    { id: 44, categoria: "Ferramentas", material: "Pincel / Trincha 1\"", unidade: "Unid", estoque_inicial: 5996, entradas: 0, saidas: 0, estoque_atual: 5996, minimo: 12 },
    { id: 45, categoria: "Ferramentas", material: "Pincel / Trincha 2\"", unidade: "Unid", estoque_inicial: 11145, entradas: 0, saidas: 0, estoque_atual: 11145, minimo: 240 },
    { id: 46, categoria: "Ferramentas", material: "Pincel / Trincha 3\"", unidade: "Unid", estoque_inicial: 1072, entradas: 0, saidas: 0, estoque_atual: 1072, minimo: 280 },
    { id: 47, categoria: "Elétrico", material: "Plug Femia", unidade: "Unid", estoque_inicial: 95, entradas: 0, saidas: 0, estoque_atual: 95, minimo: 6 },
    { id: 48, categoria: "Elétrico", material: "Plug Macho", unidade: "Unid", estoque_inicial: 94, entradas: 0, saidas: 0, estoque_atual: 94, minimo: 6 },
    { id: 49, categoria: "EPI", material: "Protetor Auricular", unidade: "Unid", estoque_inicial: 16, entradas: 0, saidas: 0, estoque_atual: 16, minimo: 10 },
    { id: 50, categoria: "Ferramentas", material: "Rolo de Acabamento 23 cm", unidade: "Unid", estoque_inicial: 16, entradas: 0, saidas: 0, estoque_atual: 16, minimo: 120 },
    { id: 51, categoria: "Ferramentas", material: "Rolo de Espuma de 15 cm", unidade: "Unid", estoque_inicial: 160, entradas: 0, saidas: 0, estoque_atual: 160, minimo: 48 },
    { id: 52, categoria: "Ferramentas", material: "Rolo de espuma de 9 cm", unidade: "Unid", estoque_inicial: 72, entradas: 0, saidas: 0, estoque_atual: 72, minimo: 72 },
    { id: 53, categoria: "Ferramentas", material: "Rolo de Lã de 9 cm", unidade: "Unid", estoque_inicial: 83, entradas: 0, saidas: 0, estoque_atual: 83, minimo: 120 },
    { id: 54, categoria: "Ferramentas", material: "Rolo de Textura 23 cm", unidade: "Unid", estoque_inicial: 40, entradas: 0, saidas: 0, estoque_atual: 40, minimo: 120 },
    { id: 55, categoria: "Ferramentas", material: "Rolo de Textura 9 cm", unidade: "Unid", estoque_inicial: 225, entradas: 0, saidas: 0, estoque_atual: 225, minimo: 0 },
    { id: 56, categoria: "Ferramentas", material: "Rolo Lâ de Carneiro 23", unidade: "Unid", estoque_inicial: 253, entradas: 0, saidas: 0, estoque_atual: 253, minimo: 120 },
    { id: 57, categoria: "Consumíveis", material: "Tela Pra Trinca", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 0 },
    { id: 58, categoria: "Outros", material: "Talabarte", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 2 },
    { id: 59, categoria: "Outros", material: "Trava-queda", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 2 },
    { id: 60, categoria: "Consumíveis", material: "Trena Fita de aço", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 0 },
    { id: 61, categoria: "EPI", material: "Uniforme G BF", unidade: "Unid", estoque_inicial: 50, entradas: 0, saidas: 0, estoque_atual: 50, minimo: 30 },
    { id: 62, categoria: "EPI", material: "Uniforme G MS", unidade: "Unid", estoque_inicial: 50, entradas: 0, saidas: 0, estoque_atual: 50, minimo: 30 },
    { id: 63, categoria: "EPI", material: "Uniforme EXG MS", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 30 },
    { id: 64, categoria: "EPI", material: "Uniforme EXG BF", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 30 },
    { id: 65, categoria: "EPI", material: "Uniforme GG BF", unidade: "Unid", estoque_inicial: 30, entradas: 0, saidas: 0, estoque_atual: 30, minimo: 20 },
    { id: 66, categoria: "EPI", material: "Uniforme GG MS", unidade: "Unid", estoque_inicial: 30, entradas: 0, saidas: 0, estoque_atual: 30, minimo: 20 },
    { id: 67, categoria: "Outros", material: "Vassoura", unidade: "Unid", estoque_inicial: 63, entradas: 0, saidas: 0, estoque_atual: 63, minimo: 20 },
    { id: 68, categoria: "Outros", material: "Cadeirinha", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 1 },
    { id: 69, categoria: "Outros", material: "Carrinho", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 0 },
    { id: 70, categoria: "Outros", material: "Cadeado gold", unidade: "Unid", estoque_inicial: 0, entradas: 0, saidas: 0, estoque_atual: 0, minimo: 0 },
    { id: 71, categoria: "Consumíveis", material: "Spray Branco", unidade: "Unid", estoque_inicial: 10, entradas: 0, saidas: 0, estoque_atual: 10, minimo: 6 },
    { id: 72, categoria: "Consumíveis", material: "Spray Preto fosco", unidade: "Unid", estoque_inicial: 6, entradas: 0, saidas: 0, estoque_atual: 6, minimo: 10 },
];

const initialObras = [
    { id: 'OBR001', nome: 'Obra Residencial Vila Mariana', endereco: 'Rua Example, 123', status: 'Em andamento' },
    { id: 'OBR002', nome: 'Obra Comercial Pinheiros', endereco: 'Av. Sample, 456', status: 'Em andamento' },
    { id: 'OBR003', nome: 'Reforma Escritório Centro', endereco: 'Rua Test, 789', status: 'Finalizada' },
    { id: 'ESC', nome: 'Escritório (uso interno)', endereco: '-', status: 'Ativo' },
    { id: 'MAN', nome: 'Manutenção Geral', endereco: '-', status: 'Ativo' },
    { id: 'SOUZAREIS', nome: 'Souza Reis', endereco: 'Rua ABC, 123', status: 'Ativo' },
];

const initialResponsaveis = [
    { id: 1, nome: 'Jailan', funcao: 'Motorista' },
    { id: 2, nome: 'Lucas', funcao: 'Fiscal' },
    { id: 3, nome: 'Ilmar', funcao: 'Fiscal' },
    { id: 4, nome: 'Valney', funcao: 'Fiscal' },
];

// =====================
// ESTADO (com leitura segura)
// =====================
let estoque = safeParse(localStorage.getItem('ms_estoque'), null) || [...initialEstoque];
let obras = safeParse(localStorage.getItem('ms_obras'), null) || [...initialObras];
let responsaveis = safeParse(localStorage.getItem('ms_responsaveis'), null) || [...initialResponsaveis];
let entradas = safeParse(localStorage.getItem('ms_entradas'), []);
let saidas = safeParse(localStorage.getItem('ms_saidas'), []);

// =====================
// PERSISTÊNCIA
// =====================
const saveData = () => {
    try {
        localStorage.setItem('ms_schema', String(SCHEMA_VERSION));
        localStorage.setItem('ms_estoque', JSON.stringify(estoque));
        localStorage.setItem('ms_obras', JSON.stringify(obras));
        localStorage.setItem('ms_responsaveis', JSON.stringify(responsaveis));
        localStorage.setItem('ms_entradas', JSON.stringify(entradas));
        localStorage.setItem('ms_saidas', JSON.stringify(saidas));
        return true;
    } catch (e) {
        console.error('saveData falhou:', e);
        if (e && e.name === 'QuotaExceededError') {
            showToast('Armazenamento cheio. Faça um Backup (Cadastros → Exportar) e libere espaço.', 'error');
        } else {
            showToast('Erro ao salvar dados: ' + (e?.message || e), 'error');
        }
        return false;
    }
};

// =====================
// CLASSIFICAÇÃO DE ESTOQUE
// =====================
const getStatus = (atual, minimo) => {
    if (!Number.isFinite(minimo) || minimo <= 0) return 'OK';
    if (atual <= 0) return 'CRÍTICO';
    if (atual < minimo) return 'REPOR';
    return 'OK';
};

const getCatClass = (cat) => ({
    'EPI': 'bg-blue-50 text-blue-700',
    'Ferramentas': 'bg-amber-50 text-amber-700',
    'Consumíveis': 'bg-emerald-50 text-emerald-700',
    'Elétrico': 'bg-yellow-50 text-yellow-700',
    'Outros': 'bg-slate-100 text-slate-700',
}[cat] || 'bg-slate-100 text-slate-700');

const getStatusClass = (status) => ({
    'OK': 'bg-emerald-100 text-emerald-700',
    'REPOR': 'bg-amber-100 text-amber-700',
    'CRÍTICO': 'bg-red-100 text-red-700',
}[status] || 'bg-slate-100 text-slate-700');

// =====================
// NAVEGAÇÃO
// =====================
function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('hidden');
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (!target) return;
    target.classList.add('active');
    document.querySelectorAll('.nav-btn').forEach((b) => {
        b.classList.remove('active', 'bg-blue-600', 'text-white', 'shadow-lg');
        if (b.dataset.page === page) b.classList.add('active', 'bg-blue-600', 'text-white', 'shadow-lg');
    });
    document.getElementById('mobileMenu').classList.add('hidden');
    renderPage(page);
}

function renderPage(page) {
    if (window.lucide) lucide.createIcons();
    if (page === 'dashboard') renderDashboard();
    else if (page === 'estoque') filterEstoque();
    else if (page === 'entrada') renderEntrada();
    else if (page === 'saida') renderSaida();
    else if (page === 'cadastros') renderCadastros();
    else if (page === 'porObra') renderPorObra();
}

// =====================
// RENDER: DASHBOARD
// =====================
function renderDashboard() {
    const total = estoque.length;
    const criticos = estoque.filter((i) => getStatus(i.estoque_atual, i.minimo) === 'CRÍTICO').length;
    const repor = estoque.filter((i) => getStatus(i.estoque_atual, i.minimo) === 'REPOR').length;
    const ok = total - criticos - repor;

    document.getElementById('statsGrid').innerHTML = `
        <div class="p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br from-slate-600 to-slate-700">
            <p class="text-sm opacity-90">Total de Itens</p>
            <p class="text-3xl font-bold mt-1">${total}</p>
        </div>
        <div data-action="filter-criticos" class="p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br from-red-500 to-red-600 cursor-pointer hover:scale-105 transition-transform" role="button" tabindex="0" aria-label="Ver itens críticos">
            <p class="text-sm opacity-90">Críticos</p>
            <p class="text-3xl font-bold mt-1">${criticos}</p>
            <p class="text-xs opacity-70 mt-1">Compra urgente</p>
        </div>
        <div data-action="filter-repor" class="p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 cursor-pointer hover:scale-105 transition-transform" role="button" tabindex="0" aria-label="Ver itens para repor">
            <p class="text-sm opacity-90">Para Repor</p>
            <p class="text-3xl font-bold mt-1">${repor}</p>
            <p class="text-xs opacity-70 mt-1">Abaixo do mínimo</p>
        </div>
        <div class="p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <p class="text-sm opacity-90">Em Dia</p>
            <p class="text-3xl font-bold mt-1">${ok}</p>
            <p class="text-xs opacity-70 mt-1">Estoque adequado</p>
        </div>
    `;

    const badge = document.getElementById('badgeCriticos');
    if (criticos > 0) { badge.textContent = String(criticos); badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');

    const historico = [
        ...entradas.map((e) => ({ ...e, tipo: 'entrada' })),
        ...saidas.map((s) => ({ ...s, tipo: 'saida' })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    document.getElementById('historicoRecente').innerHTML = historico.length === 0
        ? '<p class="text-slate-400 text-center py-8">Nenhuma movimentação registrada</p>'
        : historico.map((m) => {
            const mat = estoque.find((x) => x.id === m.materialId);
            const obra = m.tipo === 'saida' ? obras.find((o) => o.id === m.obraId) : null;
            const resp = m.tipo === 'saida' ? responsaveis.find((r) => String(r.id) === String(m.responsavelId)) : null;
            const matLabel = mat ? escHtml(mat.material) : '<span class="text-red-500">[material removido]</span>';
            const obraLabel = m.tipo === 'saida'
                ? `Saída → ${obra ? escHtml(obra.nome) : '<span class="text-red-500">[obra removida]</span>'}${resp ? ' · ' + escHtml(resp.nome) : ''}`
                : `Entrada${m.fornecedor ? ' · ' + escHtml(m.fornecedor) : ''}`;
            return `<div class="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}">
                    <i data-lucide="${m.tipo === 'entrada' ? 'plus' : 'minus'}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-slate-800">${matLabel}</p>
                    <p class="text-sm text-slate-500">${obraLabel}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-orange-600'}">${m.tipo === 'entrada' ? '+' : '-'}${escHtml(m.quantidade)}</p>
                    <p class="text-xs text-slate-400">${escHtml(formatDate(m.data))}</p>
                </div>
            </div>`;
        }).join('');
    if (window.lucide) lucide.createIcons();
}

// =====================
// RENDER: ESTOQUE
// =====================
function filterEstoque() {
    const search = document.getElementById('searchEstoque').value.toLowerCase();
    const cat = document.getElementById('filterCategoria').value;
    const status = document.getElementById('filterStatus').value;

    const filtered = estoque.filter((i) => {
        const s = getStatus(i.estoque_atual, i.minimo);
        return i.material.toLowerCase().includes(search)
            && (!cat || i.categoria === cat)
            && (!status || s === status);
    });

    document.getElementById('countItens').textContent = String(filtered.length);
    document.getElementById('estoqueGrid').innerHTML = filtered.map((i) => {
        const s = getStatus(i.estoque_atual, i.minimo);
        const ratio = i.minimo > 0 ? i.estoque_atual / i.minimo : 1;
        const pct = Math.max(0, Math.min(ratio * 100, 100));
        const barClass = s === 'CRÍTICO' ? 'bg-red-500' : s === 'REPOR' ? 'bg-amber-500' : 'bg-emerald-500';
        const minLabel = i.minimo > 0 ? `/ mín. ${escHtml(i.minimo)}` : '';
        const pctLabel = i.minimo > 0 ? `${Math.round(ratio * 100)}%` : '∞';
        return `<div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:-translate-y-1 relative">
            <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100">
                <button data-action="edit-material" data-id="${escHtml(i.id)}" class="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg" aria-label="Editar material"><i data-lucide="pencil" class="w-4 h-4 pointer-events-none"></i></button>
                <button data-action="delete-material" data-id="${escHtml(i.id)}" class="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg" aria-label="Excluir material"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button>
            </div>
            <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 rounded-lg text-xs font-medium ${getCatClass(i.categoria)}">${escHtml(i.categoria)}</span>
                <span class="px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusClass(s)}">${escHtml(s)}</span>
            </div>
            <h3 class="font-semibold text-slate-800 text-lg mb-1">${escHtml(i.material)}</h3>
            <p class="text-sm text-slate-500 mb-4">${escHtml(i.unidade)}</p>
            <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>${escHtml(i.estoque_atual)} ${minLabel}</span>
                <span>${pctLabel}</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full ${barClass} rounded-full transition-all" style="width: ${pct}%"></div>
            </div>
            <div class="mt-3 flex gap-2">
                <button data-action="edit-material" data-id="${escHtml(i.id)}" class="flex-1 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Editar</button>
                <button data-action="delete-material" data-id="${escHtml(i.id)}" class="flex-1 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200">Excluir</button>
            </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

const filterEstoqueDebounced = debounce(filterEstoque, 200);

// =====================
// RENDER: ENTRADA
// =====================
function renderEntrada() {
    document.getElementById('entradaMaterial').innerHTML = '<option value="">Selecione</option>'
        + estoque.map((i) => `<option value="${escHtml(i.id)}">${escHtml(i.material)} (${escHtml(i.unidade)})</option>`).join('');
    renderHistoricoEntradas();
}

function renderHistoricoEntradas() {
    const h = [...entradas].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);
    document.getElementById('historicoEntradas').innerHTML = h.length === 0
        ? '<p class="text-slate-400 text-center py-4">Nenhuma entrada</p>'
        : h.map((e) => {
            const m = estoque.find((x) => x.id === e.materialId);
            const matLabel = m ? escHtml(m.material) : '<span class="text-red-500">[material removido]</span>';
            return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div><p class="font-medium text-slate-800">${matLabel}</p><p class="text-sm text-slate-500">${escHtml(e.fornecedor || '-')}</p></div>
                <div class="text-right"><p class="font-semibold text-emerald-600">+${escHtml(e.quantidade)}</p><p class="text-xs text-slate-400">${escHtml(formatDate(e.data))}</p></div>
            </div>`;
        }).join('');
}

// =====================
// RENDER: SAÍDA
// =====================
function renderSaida() {
    document.getElementById('saidaMaterial').innerHTML = '<option value="">Selecione</option>'
        + estoque.filter((i) => i.estoque_atual > 0)
            .map((i) => `<option value="${escHtml(i.id)}">${escHtml(i.material)} - Disp: ${escHtml(i.estoque_atual)}</option>`).join('');
    document.getElementById('saidaObra').innerHTML = '<option value="">Selecione</option>'
        + obras.filter((o) => o.status !== 'Finalizada')
            .map((o) => `<option value="${escHtml(o.id)}">${escHtml(o.nome)}</option>`).join('');
    document.getElementById('saidaResponsavel').innerHTML = '<option value="">Selecione</option>'
        + responsaveis.map((r) => `<option value="${escHtml(r.id)}">${escHtml(r.nome)} - ${escHtml(r.funcao)}</option>`).join('');
    renderHistoricoSaidas();
}

function renderHistoricoSaidas() {
    const h = [...saidas].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);
    document.getElementById('historicoSaidas').innerHTML = h.length === 0
        ? '<p class="text-slate-400 text-center py-4">Nenhuma saída</p>'
        : h.map((s) => {
            const m = estoque.find((x) => x.id === s.materialId);
            const o = obras.find((x) => x.id === s.obraId);
            const r = responsaveis.find((x) => String(x.id) === String(s.responsavelId));
            const matLabel = m ? escHtml(m.material) : '<span class="text-red-500">[material removido]</span>';
            const obraLabel = o ? escHtml(o.nome) : '<span class="text-red-500">[obra removida]</span>';
            const respLabel = r ? ` · ${escHtml(r.nome)}` : '';
            return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div><p class="font-medium text-slate-800">${matLabel}</p><p class="text-sm text-slate-500">${obraLabel}${respLabel}</p></div>
                <div class="text-right"><p class="font-semibold text-orange-600">-${escHtml(s.quantidade)}</p><p class="text-xs text-slate-400">${escHtml(formatDate(s.data))}</p></div>
            </div>`;
        }).join('');
}

// =====================
// RENDER: CADASTROS
// =====================
function renderCadastros() {
    document.getElementById('listaObras').innerHTML = obras.map((o) => `
        <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-2">
            <div class="flex items-center gap-3 min-w-0">
                <span class="font-mono text-sm bg-slate-200 px-2 py-1 rounded shrink-0">${escHtml(o.id)}</span>
                <div class="min-w-0"><p class="font-medium text-slate-800 truncate">${escHtml(o.nome)}</p><p class="text-sm text-slate-500 truncate">${escHtml(o.endereco)}</p></div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${o.status === 'Finalizada' ? 'bg-slate-200 text-slate-600' : o.status === 'Em andamento' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">${escHtml(o.status)}</span>
                <button data-action="delete-obra" data-id="${escHtml(o.id)}" class="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Excluir obra"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button>
            </div>
        </div>
    `).join('');

    document.getElementById('listaResponsaveis').innerHTML = responsaveis.map((r) => `
        <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><i data-lucide="user" class="w-5 h-5"></i></div>
                <div class="min-w-0"><p class="font-medium text-slate-800 truncate">${escHtml(r.nome)}</p><p class="text-sm text-slate-500">${escHtml(r.funcao)}</p></div>
            </div>
            <button data-action="delete-responsavel" data-id="${escHtml(r.id)}" class="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Excluir responsável"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

// =====================
// RENDER: POR OBRA
// =====================
function renderPorObra() {
    document.getElementById('selectObra').innerHTML = '<option value="">Todas as Obras</option>'
        + obras.map((o) => `<option value="${escHtml(o.id)}">${escHtml(o.nome)}</option>`).join('');
    renderConsumoObra();
}

function renderConsumoObra() {
    const sel = document.getElementById('selectObra').value;
    const consumo = {};
    saidas.forEach((s) => {
        if (!consumo[s.obraId]) consumo[s.obraId] = {};
        if (!consumo[s.obraId][s.materialId]) consumo[s.obraId][s.materialId] = { total: 0, data: null };
        consumo[s.obraId][s.materialId].total += s.quantidade;
        const cur = consumo[s.obraId][s.materialId].data;
        if (!cur || new Date(s.data) > new Date(cur)) {
            consumo[s.obraId][s.materialId].data = s.data;
        }
    });

    if (!sel) {
        document.getElementById('obrasContainer').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${obras.map((o) => {
                const c = consumo[o.id] || {};
                const itens = Object.keys(c).length;
                const total = Object.values(c).reduce((s, x) => s + x.total, 0);
                return `<div data-action="select-obra" data-id="${escHtml(o.id)}" class="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:shadow-lg transition-all" role="button" tabindex="0" aria-label="Ver consumo de ${escHtml(o.nome)}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><i data-lucide="building-2" class="w-6 h-6"></i></div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${o.status === 'Finalizada' ? 'bg-slate-100 text-slate-600' : o.status === 'Em andamento' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">${escHtml(o.status)}</span>
                    </div>
                    <h3 class="font-semibold text-slate-800 text-lg mb-1">${escHtml(o.nome)}</h3>
                    <p class="text-sm text-slate-500 mb-4">${escHtml(o.endereco)}</p>
                    <div class="flex justify-between pt-4 border-t border-slate-100">
                        <div><p class="text-2xl font-bold text-slate-800">${itens}</p><p class="text-xs text-slate-500">itens</p></div>
                        <div class="text-right"><p class="text-2xl font-bold text-orange-600">${total}</p><p class="text-xs text-slate-500">retirados</p></div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    } else {
        const obra = obras.find((o) => o.id === sel);
        const c = consumo[sel] || {};
        document.getElementById('obrasContainer').innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-200 flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><i data-lucide="building-2" class="w-7 h-7"></i></div>
                    <div><h2 class="text-xl font-bold text-slate-800">${obra ? escHtml(obra.nome) : '[obra removida]'}</h2><p class="text-slate-500">${obra ? escHtml(obra.endereco) : ''}</p></div>
                </div>
                <div class="overflow-x-auto"><table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr><th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Material</th><th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">Total</th><th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">Última</th></tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${Object.keys(c).length === 0 ? '<tr><td colspan="3" class="px-6 py-12 text-center text-slate-400">Nenhuma retirada registrada</td></tr>' :
                        Object.entries(c).map(([mid, data]) => {
                            const m = estoque.find((x) => x.id === parseInt(mid, 10));
                            const matLabel = m ? escHtml(m.material) : '<span class="text-red-500">[material removido]</span>';
                            return `<tr class="hover:bg-slate-50">
                                <td class="px-6 py-4"><p class="font-medium text-slate-800">${matLabel}</p><p class="text-sm text-slate-500">${m ? escHtml(m.unidade) : ''}</p></td>
                                <td class="px-6 py-4 text-center font-semibold text-orange-600">${escHtml(data.total)}</td>
                                <td class="px-6 py-4 text-center text-slate-500">${escHtml(data.data ? formatDate(data.data) : '-')}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table></div>
            </div>`;
    }
    if (window.lucide) lucide.createIcons();
}

// =====================
// AÇÕES: ENTRADA / SAÍDA
// =====================
function registrarEntrada() {
    const matId = toFiniteInt(document.getElementById('entradaMaterial').value);
    const qty = toFiniteInt(document.getElementById('entradaQtd').value);
    const fornecedor = (document.getElementById('entradaFornecedor').value || '').trim().slice(0, MAX_TEXT_LEN);
    const nf = (document.getElementById('entradaNF').value || '').trim().slice(0, MAX_TEXT_LEN);

    if (!matId || !qty || qty <= 0) return showToast('Preencha material e quantidade (positiva)', 'error');

    const mat = estoque.find((i) => i.id === matId);
    if (!mat) return showToast('Material selecionado não existe mais', 'error');

    const before = JSON.parse(JSON.stringify({ estoque, entradas }));
    estoque = estoque.map((i) => i.id === matId
        ? { ...i, entradas: i.entradas + qty, estoque_atual: i.estoque_atual + qty }
        : i);
    entradas.push({
        id: Date.now(), materialId: matId, quantidade: qty, fornecedor, nf,
        data: new Date().toISOString(), registradoPor: usuarioAtual?.nome || 'Sistema',
    });

    if (!saveData()) { estoque = before.estoque; entradas = before.entradas; return; }
    registrarLog('entrada', `Entrada de ${qty}x ${mat.material}`);

    document.getElementById('entradaMaterial').value = '';
    document.getElementById('entradaQtd').value = '';
    document.getElementById('entradaFornecedor').value = '';
    document.getElementById('entradaNF').value = '';

    renderEntrada();
    showToast('Entrada registrada!');
}

function registrarSaida() {
    const matId = toFiniteInt(document.getElementById('saidaMaterial').value);
    const qty = toFiniteInt(document.getElementById('saidaQtd').value);
    const obraId = (document.getElementById('saidaObra').value || '').trim();
    const respId = (document.getElementById('saidaResponsavel').value || '').trim();

    if (!matId || !qty || qty <= 0 || !obraId) return showToast('Preencha todos os campos obrigatórios', 'error');

    const mat = estoque.find((i) => i.id === matId);
    if (!mat) return showToast('Material selecionado não existe mais', 'error');
    if (mat.estoque_atual < qty) return showToast(`Estoque insuficiente (disponível: ${mat.estoque_atual})`, 'error');

    const obra = obras.find((o) => o.id === obraId);
    if (!obra) return showToast('Obra selecionada não existe mais', 'error');
    if (respId && !responsaveis.find((r) => String(r.id) === String(respId))) {
        return showToast('Responsável selecionado não existe mais', 'error');
    }

    const before = JSON.parse(JSON.stringify({ estoque, saidas }));
    estoque = estoque.map((i) => i.id === matId
        ? { ...i, saidas: i.saidas + qty, estoque_atual: i.estoque_atual - qty }
        : i);
    saidas.push({
        id: Date.now(), materialId: matId, quantidade: qty, obraId, responsavelId: respId || null,
        data: new Date().toISOString(), registradoPor: usuarioAtual?.nome || 'Sistema',
    });

    if (!saveData()) { estoque = before.estoque; saidas = before.saidas; return; }
    registrarLog('saida', `Saída de ${qty}x ${mat.material} para ${obra.nome}`);

    document.getElementById('saidaMaterial').value = '';
    document.getElementById('saidaQtd').value = '';
    document.getElementById('saidaObra').value = '';
    document.getElementById('saidaResponsavel').value = '';

    renderSaida();
    showToast('Saída registrada!');
}

// =====================
// AÇÕES: CADASTROS
// =====================
function cadastrarMaterial() {
    const nome = (document.getElementById('novoMaterialNome').value || '').trim().slice(0, MAX_TEXT_LEN);
    const categoria = document.getElementById('novoMaterialCat').value;
    const unidade = document.getElementById('novoMaterialUnid').value;
    const inicial = toFiniteInt(document.getElementById('novoMaterialEstoque').value) ?? 0;
    const minimo = toFiniteInt(document.getElementById('novoMaterialMinimo').value) ?? 0;

    if (!nome) return showToast('Digite o nome do material', 'error');
    if (inicial < 0) return showToast('Estoque inicial não pode ser negativo', 'error');
    if (minimo < 0) return showToast('Estoque mínimo não pode ser negativo', 'error');
    if (!CATEGORIAS_VALIDAS.includes(categoria)) return showToast('Categoria inválida', 'error');
    if (!UNIDADES_VALIDAS.includes(unidade)) return showToast('Unidade inválida', 'error');
    if (estoque.some((i) => i.material.trim().toLowerCase() === nome.toLowerCase())) {
        return showToast('Já existe um material com esse nome', 'error');
    }

    const newId = Math.max(...estoque.map((i) => i.id), 0) + 1;
    const before = [...estoque];
    estoque.push({
        id: newId, categoria, material: nome, unidade,
        estoque_inicial: inicial, entradas: 0, saidas: 0, estoque_atual: inicial, minimo,
    });
    if (!saveData()) { estoque = before; return; }

    document.getElementById('novoMaterialNome').value = '';
    document.getElementById('novoMaterialEstoque').value = '0';
    document.getElementById('novoMaterialMinimo').value = '0';
    showToast('Material cadastrado!');
}

function abrirEdicaoMaterial(id) {
    const mat = estoque.find((i) => i.id === id);
    if (!mat) return showToast('Material não encontrado', 'error');
    document.getElementById('editMaterialId').value = mat.id;
    document.getElementById('editMaterialNome').value = mat.material;
    document.getElementById('editMaterialCat').value = mat.categoria;
    document.getElementById('editMaterialUnid').value = mat.unidade;
    document.getElementById('editMaterialMinimo').value = mat.minimo;
    document.getElementById('editMaterialEstoque').value = mat.estoque_atual;
    const modal = document.getElementById('editMaterialModal');
    modal.classList.remove('hidden');
    modal.querySelector('input, select')?.focus();
}

function fecharEdicaoMaterial() {
    document.getElementById('editMaterialModal').classList.add('hidden');
}

function salvarEdicaoMaterial() {
    const id = toFiniteInt(document.getElementById('editMaterialId').value);
    const nome = (document.getElementById('editMaterialNome').value || '').trim().slice(0, MAX_TEXT_LEN);
    const categoria = document.getElementById('editMaterialCat').value;
    const unidade = document.getElementById('editMaterialUnid').value;
    const minimo = toFiniteInt(document.getElementById('editMaterialMinimo').value) ?? 0;
    const novoAtual = toFiniteInt(document.getElementById('editMaterialEstoque').value);

    if (!id) return showToast('ID inválido', 'error');
    if (!nome) return showToast('Nome obrigatório', 'error');
    if (minimo < 0) return showToast('Mínimo não pode ser negativo', 'error');
    if (novoAtual == null || novoAtual < 0) return showToast('Estoque atual inválido', 'error');
    if (!CATEGORIAS_VALIDAS.includes(categoria)) return showToast('Categoria inválida', 'error');
    if (!UNIDADES_VALIDAS.includes(unidade)) return showToast('Unidade inválida', 'error');
    if (estoque.some((i) => i.id !== id && i.material.trim().toLowerCase() === nome.toLowerCase())) {
        return showToast('Já existe outro material com esse nome', 'error');
    }

    const before = [...estoque];
    estoque = estoque.map((i) => i.id === id
        ? { ...i, material: nome, categoria, unidade, minimo, estoque_atual: novoAtual }
        : i);
    if (!saveData()) { estoque = before; return; }
    registrarLog('edicao', `Material ${id} editado`);
    fecharEdicaoMaterial();
    filterEstoque();
    showToast('Material atualizado!');
}

function deletarMaterial(id) {
    const mat = estoque.find((i) => i.id === id);
    if (!mat) return;
    const refsEntrada = entradas.filter((e) => e.materialId === id).length;
    const refsSaida = saidas.filter((s) => s.materialId === id).length;
    let msg = `Excluir o material "${mat.material}"?`;
    if (refsEntrada || refsSaida) {
        msg += `\n\nAtenção: este material aparece em ${refsEntrada} entrada(s) e ${refsSaida} saída(s). Os históricos manterão a referência marcada como "[material removido]".`;
    }
    if (!confirm(msg)) return;

    const before = [...estoque];
    estoque = estoque.filter((i) => i.id !== id);
    if (!saveData()) { estoque = before; return; }
    registrarLog('exclusao', `Material ${id} (${mat.material}) excluído`);
    filterEstoque();
    showToast('Material excluído');
}

function cadastrarObra() {
    const id = (document.getElementById('novaObraId').value || '').trim().toUpperCase().slice(0, 50);
    const nome = (document.getElementById('novaObraNome').value || '').trim().slice(0, MAX_TEXT_LEN);
    const endereco = (document.getElementById('novaObraEndereco').value || '').trim().slice(0, MAX_TEXT_LEN);
    const status = document.getElementById('novaObraStatus').value;

    if (!id || !nome) return showToast('Preencha código e nome', 'error');
    if (!/^[A-Z0-9_-]+$/.test(id)) return showToast('Código deve conter apenas letras, números, _ e -', 'error');
    if (!STATUS_OBRA_VALIDOS.includes(status)) return showToast('Status inválido', 'error');
    if (obras.find((o) => o.id === id)) return showToast('Código já existe', 'error');

    const before = [...obras];
    obras.push({ id, nome, endereco, status });
    if (!saveData()) { obras = before; return; }

    document.getElementById('novaObraId').value = '';
    document.getElementById('novaObraNome').value = '';
    document.getElementById('novaObraEndereco').value = '';

    renderCadastros();
    showToast('Obra cadastrada!');
}

function cadastrarResponsavel() {
    const nome = (document.getElementById('novoRespNome').value || '').trim().slice(0, MAX_TEXT_LEN);
    const funcao = document.getElementById('novoRespFuncao').value || '-';

    if (!nome) return showToast('Digite o nome', 'error');
    if (!FUNCOES_VALIDAS.includes(funcao)) return showToast('Função inválida', 'error');

    const newId = Math.max(...responsaveis.map((r) => r.id), 0) + 1;
    const before = [...responsaveis];
    responsaveis.push({ id: newId, nome, funcao });
    if (!saveData()) { responsaveis = before; return; }

    document.getElementById('novoRespNome').value = '';
    document.getElementById('novoRespFuncao').value = '';

    renderCadastros();
    showToast('Responsável cadastrado!');
}

function deletarObra(id) {
    const obra = obras.find((o) => o.id === id);
    if (!obra) return;
    const refs = saidas.filter((s) => s.obraId === id).length;
    let msg = `Excluir a obra "${obra.nome}"?`;
    if (refs > 0) msg += `\n\nAtenção: existem ${refs} saída(s) registradas para esta obra. O histórico manterá a referência marcada como "[obra removida]".`;
    if (!confirm(msg)) return;

    const before = [...obras];
    obras = obras.filter((o) => o.id !== id);
    if (!saveData()) { obras = before; return; }
    registrarLog('exclusao', `Obra ${id} (${obra.nome}) excluída`);
    renderCadastros();
    showToast('Obra excluída');
}

function deletarResponsavel(id) {
    const r = responsaveis.find((x) => x.id === id);
    if (!r) return;
    const refs = saidas.filter((s) => String(s.responsavelId) === String(id)).length;
    let msg = `Excluir o responsável "${r.nome}"?`;
    if (refs > 0) msg += `\n\nAtenção: ${refs} saída(s) referenciam este responsável. O histórico manterá a referência removida.`;
    if (!confirm(msg)) return;

    const before = [...responsaveis];
    responsaveis = responsaveis.filter((x) => x.id !== id);
    if (!saveData()) { responsaveis = before; return; }
    registrarLog('exclusao', `Responsável ${id} (${r.nome}) excluído`);
    renderCadastros();
    showToast('Responsável excluído');
}

// =====================
// EXPORT / IMPORT
// =====================
function exportarDados() {
    const data = {
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        estoque, obras, responsaveis, entradas, saidas,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ms-estoque-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup exportado!');
}

function importarDados(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data.estoque) || !Array.isArray(data.obras)) {
                throw new Error('Arquivo de backup inválido');
            }
            const ts = data.exportedAt ? formatDate(data.exportedAt) : '?';
            if (!confirm(`Substituir TODOS os dados atuais pelo conteúdo do arquivo (gerado em ${ts})? Esta ação não pode ser desfeita.`)) return;
            const before = { estoque, obras, responsaveis, entradas, saidas };
            estoque = data.estoque;
            obras = data.obras;
            responsaveis = Array.isArray(data.responsaveis) ? data.responsaveis : [];
            entradas = Array.isArray(data.entradas) ? data.entradas : [];
            saidas = Array.isArray(data.saidas) ? data.saidas : [];
            if (!saveData()) {
                estoque = before.estoque; obras = before.obras;
                responsaveis = before.responsaveis; entradas = before.entradas; saidas = before.saidas;
                return;
            }
            registrarLog('import', `Backup importado (${ts})`);
            renderPage('dashboard');
            navigateTo('dashboard');
            showToast('Dados importados!');
        } catch (err) {
            console.error(err);
            showToast('Erro ao importar: ' + (err?.message || err), 'error');
        }
    };
    reader.onerror = () => showToast('Erro ao ler arquivo', 'error');
    reader.readAsText(file);
}

// =====================
// EVENT DELEGATION
// =====================
function setupDelegation() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action === 'filter-criticos') {
            navigateTo('estoque');
            document.getElementById('filterStatus').value = 'CRÍTICO';
            filterEstoque();
        } else if (action === 'filter-repor') {
            navigateTo('estoque');
            document.getElementById('filterStatus').value = 'REPOR';
            filterEstoque();
        } else if (action === 'select-obra') {
            document.getElementById('selectObra').value = id;
            renderConsumoObra();
        } else if (action === 'edit-material') {
            abrirEdicaoMaterial(parseInt(id, 10));
        } else if (action === 'delete-material') {
            deletarMaterial(parseInt(id, 10));
        } else if (action === 'delete-obra') {
            deletarObra(id);
        } else if (action === 'delete-responsavel') {
            deletarResponsavel(parseInt(id, 10));
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const target = e.target.closest('[data-action][role="button"]');
        if (!target) return;
        e.preventDefault();
        target.click();
    });

    // Fechar modal com Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('editMaterialModal');
            if (modal && !modal.classList.contains('hidden')) fecharEdicaoMaterial();
        }
    });
}

// =====================
// SERVICE WORKER
// =====================
function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.protocol !== 'file:') return;
    if (location.protocol === 'file:') return; // SW não roda em file://
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .catch((err) => console.warn('SW registration failed:', err));
    });
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    setupDelegation();
    registrarServiceWorker();
    verificarAutenticacao();
});

// Exporta para window (compat com onclick inline e testes)
Object.assign(window, {
    fazerLogin, fazerLogout, toggleMenu, navigateTo, filterEstoque, filterEstoqueDebounced,
    registrarEntrada, registrarSaida, cadastrarMaterial, cadastrarObra, cadastrarResponsavel,
    deletarObra, deletarResponsavel, deletarMaterial, abrirEdicaoMaterial, fecharEdicaoMaterial,
    salvarEdicaoMaterial, exportarDados, importarDados, renderConsumoObra,
});
