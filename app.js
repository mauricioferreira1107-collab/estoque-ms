// =====================
// CONFIGURAÇÃO DE USUÁRIOS
// =====================
// Adicione ou remova usuários aqui
// Formato: { usuario: 'nome', senha: 'senha123', nome: 'Nome Completo', perfil: 'admin' ou 'operador' }
const USUARIOS_AUTORIZADOS = [
    { usuario: 'admin', senha: 'ms2024', nome: 'Administrador', perfil: 'admin' },
    { usuario: 'jailan', senha: 'jailan123', nome: 'Jailan', perfil: 'operador' },
    { usuario: 'lucas', senha: 'lucas123', nome: 'Lucas', perfil: 'operador' },
    { usuario: 'ilmar', senha: 'ilmar123', nome: 'Ilmar', perfil: 'operador' },
    { usuario: 'valney', senha: 'valney123', nome: 'Valney', perfil: 'operador' },
    // Adicione mais usuários abaixo:
    // { usuario: 'novo', senha: 'senha', nome: 'Nome', perfil: 'operador' },
];

// Tempo de sessão em horas (0 = não expira)
const TEMPO_SESSAO_HORAS = 24;

// =====================
// FUNÇÕES DE LOGIN
// =====================
let usuarioAtual = null;

function verificarAutenticacao() {
    const sessao = localStorage.getItem('ms_sessao');
    if (sessao) {
        const dados = JSON.parse(sessao);
        // Verificar se a sessão expirou
        if (TEMPO_SESSAO_HORAS > 0) {
            const expiracao = new Date(dados.expiracao);
            if (new Date() > expiracao) {
                fazerLogout();
                return false;
            }
        }
        usuarioAtual = dados.usuario;
        mostrarSistema();
        return true;
    }
    mostrarLogin();
    return false;
}

function fazerLogin() {
    const usuario = document.getElementById('loginUser').value.trim().toLowerCase();
    const senha = document.getElementById('loginSenha').value;
    const lembrar = document.getElementById('lembrarLogin').checked;
    
    const userEncontrado = USUARIOS_AUTORIZADOS.find(u => 
        u.usuario.toLowerCase() === usuario && u.senha === senha
    );
    
    if (userEncontrado) {
        usuarioAtual = userEncontrado;
        
        // Calcular expiração
        let expiracao = null;
        if (TEMPO_SESSAO_HORAS > 0 && !lembrar) {
            expiracao = new Date();
            expiracao.setHours(expiracao.getHours() + TEMPO_SESSAO_HORAS);
        } else if (lembrar) {
            // Se "manter conectado", expira em 30 dias
            expiracao = new Date();
            expiracao.setDate(expiracao.getDate() + 30);
        }
        
        // Salvar sessão
        localStorage.setItem('ms_sessao', JSON.stringify({
            usuario: userEncontrado,
            expiracao: expiracao ? expiracao.toISOString() : null,
            loginEm: new Date().toISOString()
        }));
        
        // Registrar log de acesso
        registrarLog('login', `${userEncontrado.nome} entrou no sistema`);
        
        mostrarSistema();
        showToast(`Bem-vindo, ${userEncontrado.nome}!`);
    } else {
        document.getElementById('loginError').textContent = 'Usuário ou senha incorretos';
        document.getElementById('loginError').classList.remove('hidden');
        document.getElementById('loginSenha').value = '';
        
        // Esconder erro após 3 segundos
        setTimeout(() => {
            document.getElementById('loginError').classList.add('hidden');
        }, 3000);
    }
}

function fazerLogout() {
    if (usuarioAtual) {
        registrarLog('logout', `${usuarioAtual.nome} saiu do sistema`);
    }
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
    
    // Mostrar nome do usuário logado
    const nomeUser = usuarioAtual ? usuarioAtual.nome : '';
    const elUser = document.getElementById('userLogado');
    const elUserMobile = document.getElementById('userLogadoMobile');
    if (elUser) elUser.textContent = nomeUser;
    if (elUserMobile) elUserMobile.textContent = nomeUser;
    
    lucide.createIcons();
    renderDashboard();
}

function registrarLog(tipo, mensagem) {
    let logs = JSON.parse(localStorage.getItem('ms_logs') || '[]');
    logs.push({
        tipo,
        mensagem,
        usuario: usuarioAtual?.nome || 'Sistema',
        data: new Date().toISOString()
    });
    // Manter apenas últimos 100 logs
    if (logs.length > 100) logs = logs.slice(-100);
    localStorage.setItem('ms_logs', JSON.stringify(logs));
}

// =====================
// DADOS INICIAIS
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
    { id: 72, categoria: "Consumíveis", material: "Spray Preto fosco", unidade: "Unid", estoque_inicial: 6, entradas: 0, saidas: 0, estoque_atual: 6, minimo: 10 }
];

const initialObras = [
    { id: 'OBR001', nome: 'Obra Residencial Vila Mariana', endereco: 'Rua Example, 123', status: 'Em andamento' },
    { id: 'OBR002', nome: 'Obra Comercial Pinheiros', endereco: 'Av. Sample, 456', status: 'Em andamento' },
    { id: 'OBR003', nome: 'Reforma Escritório Centro', endereco: 'Rua Test, 789', status: 'Finalizada' },
    { id: 'ESC', nome: 'Escritório (uso interno)', endereco: '-', status: 'Ativo' },
    { id: 'MAN', nome: 'Manutenção Geral', endereco: '-', status: 'Ativo' },
    { id: 'SOUZAREIS', nome: 'Souza Reis', endereco: 'Rua ABC, 123', status: 'Ativo' }
];

const initialResponsaveis = [
    { id: 1, nome: 'Jailan', funcao: 'Motorista' },
    { id: 2, nome: 'Lucas', funcao: 'Fiscal' },
    { id: 3, nome: 'Ilmar', funcao: 'Fiscal' },
    { id: 4, nome: 'Valney', funcao: 'Fiscal' }
];

// =====================
// ESTADO
// =====================
let estoque = JSON.parse(localStorage.getItem('ms_estoque')) || [...initialEstoque];
let obras = JSON.parse(localStorage.getItem('ms_obras')) || [...initialObras];
let responsaveis = JSON.parse(localStorage.getItem('ms_responsaveis')) || [...initialResponsaveis];
let entradas = JSON.parse(localStorage.getItem('ms_entradas')) || [];
let saidas = JSON.parse(localStorage.getItem('ms_saidas')) || [];

// =====================
// HELPERS
// =====================
const saveData = () => {
    localStorage.setItem('ms_estoque', JSON.stringify(estoque));
    localStorage.setItem('ms_obras', JSON.stringify(obras));
    localStorage.setItem('ms_responsaveis', JSON.stringify(responsaveis));
    localStorage.setItem('ms_entradas', JSON.stringify(entradas));
    localStorage.setItem('ms_saidas', JSON.stringify(saidas));
};

const getStatus = (atual, minimo) => {
    if (minimo > 0 && atual === 0) return 'CRÍTICO';
    if (minimo > 0 && atual < minimo) return 'REPOR';
    if (atual === 0 && minimo === 0) return 'CRÍTICO';
    return 'OK';
};

const getCatClass = (cat) => ({
    'EPI': 'bg-blue-50 text-blue-700',
    'Ferramentas': 'bg-amber-50 text-amber-700',
    'Consumíveis': 'bg-emerald-50 text-emerald-700',
    'Elétrico': 'bg-yellow-50 text-yellow-700',
    'Outros': 'bg-slate-100 text-slate-700'
}[cat] || 'bg-slate-100 text-slate-700');

const getStatusClass = (status) => ({
    'OK': 'bg-emerald-100 text-emerald-700',
    'REPOR': 'bg-amber-100 text-amber-700',
    'CRÍTICO': 'bg-red-100 text-red-700'
}[status]);

const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');

// =====================
// NAVEGAÇÃO
// =====================
function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('hidden');
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active', 'bg-blue-600', 'text-white', 'shadow-lg');
        if (b.dataset.page === page) b.classList.add('active', 'bg-blue-600', 'text-white', 'shadow-lg');
    });
    document.getElementById('mobileMenu').classList.add('hidden');
    renderPage(page);
}

// =====================
// RENDER
// =====================
function renderPage(page) {
    lucide.createIcons();
    if (page === 'dashboard') renderDashboard();
    else if (page === 'estoque') filterEstoque();
    else if (page === 'entrada') renderEntrada();
    else if (page === 'saida') renderSaida();
    else if (page === 'cadastros') renderCadastros();
    else if (page === 'porObra') renderPorObra();
}

function renderDashboard() {
    const total = estoque.length;
    const criticos = estoque.filter(i => getStatus(i.estoque_atual, i.minimo) === 'CRÍTICO').length;
    const repor = estoque.filter(i => getStatus(i.estoque_atual, i.minimo) === 'REPOR').length;
    const ok = total - criticos - repor;

    document.getElementById('statsGrid').innerHTML = `
        <div class="p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br from-slate-600 to-slate-700">
            <p class="text-sm opacity-90">Total de Itens</p>
            <p class="text-3xl font-bold mt-1">${total}</p>
        </div>
        <div onclick="navigateTo('estoque');document.getElementById('filterStatus').value='CRÍTICO';filterEstoque();" class="p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br from-red-500 to-red-600 cursor-pointer hover:scale-105 transition-transform">
            <p class="text-sm opacity-90">Críticos</p>
            <p class="text-3xl font-bold mt-1">${criticos}</p>
            <p class="text-xs opacity-70 mt-1">Compra urgente</p>
        </div>
        <div onclick="navigateTo('estoque');document.getElementById('filterStatus').value='REPOR';filterEstoque();" class="p-5 rounded-2xl text-white shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 cursor-pointer hover:scale-105 transition-transform">
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
    if (criticos > 0) { badge.textContent = criticos; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');

    const historico = [...entradas.map(e => ({...e, tipo: 'entrada'})), ...saidas.map(s => ({...s, tipo: 'saida'}))]
        .sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    document.getElementById('historicoRecente').innerHTML = historico.length === 0 
        ? '<p class="text-slate-400 text-center py-8">Nenhuma movimentação registrada</p>'
        : historico.map(m => {
            const mat = estoque.find(x => x.id === m.materialId);
            const obra = m.tipo === 'saida' ? obras.find(o => o.id === m.obraId) : null;
            return `<div class="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}">
                    <i data-lucide="${m.tipo === 'entrada' ? 'plus' : 'minus'}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-slate-800">${mat?.material || '-'}</p>
                    <p class="text-sm text-slate-500">${m.tipo === 'entrada' ? 'Entrada' : `Saída → ${obra?.nome || '-'}`}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-orange-600'}">${m.tipo === 'entrada' ? '+' : '-'}${m.quantidade}</p>
                    <p class="text-xs text-slate-400">${formatDate(m.data)}</p>
                </div>
            </div>`;
        }).join('');
    lucide.createIcons();
}

function filterEstoque() {
    const search = document.getElementById('searchEstoque').value.toLowerCase();
    const cat = document.getElementById('filterCategoria').value;
    const status = document.getElementById('filterStatus').value;
    
    const filtered = estoque.filter(i => {
        const s = getStatus(i.estoque_atual, i.minimo);
        return i.material.toLowerCase().includes(search) && (!cat || i.categoria === cat) && (!status || s === status);
    });

    document.getElementById('countItens').textContent = filtered.length;
    document.getElementById('estoqueGrid').innerHTML = filtered.map(i => {
        const s = getStatus(i.estoque_atual, i.minimo);
        const ratio = i.minimo > 0 ? i.estoque_atual / i.minimo : (i.estoque_atual > 0 ? 2 : 0);
        const pct = Math.min(ratio * 100, 100);
        const barClass = s === 'CRÍTICO' ? 'bg-red-500' : s === 'REPOR' ? 'bg-amber-500' : 'bg-emerald-500';
        return `<div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:-translate-y-1">
            <div class="flex justify-between items-start mb-4">
                <span class="px-3 py-1 rounded-lg text-xs font-medium ${getCatClass(i.categoria)}">${i.categoria}</span>
                <span class="px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusClass(s)}">${s}</span>
            </div>
            <h3 class="font-semibold text-slate-800 text-lg mb-1">${i.material}</h3>
            <p class="text-sm text-slate-500 mb-4">${i.unidade}</p>
            <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>${i.estoque_atual} ${i.minimo > 0 ? `/ mín. ${i.minimo}` : ''}</span>
                <span>${i.minimo > 0 ? Math.round(ratio * 100) + '%' : '∞'}</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full ${barClass} rounded-full transition-all" style="width: ${pct}%"></div>
            </div>
        </div>`;
    }).join('');
}

function renderEntrada() {
    document.getElementById('entradaMaterial').innerHTML = '<option value="">Selecione</option>' + 
        estoque.map(i => `<option value="${i.id}">${i.material} (${i.unidade})</option>`).join('');
    renderHistoricoEntradas();
}

function renderHistoricoEntradas() {
    const h = entradas.slice(-5).reverse();
    document.getElementById('historicoEntradas').innerHTML = h.length === 0 
        ? '<p class="text-slate-400 text-center py-4">Nenhuma entrada</p>'
        : h.map(e => {
            const m = estoque.find(x => x.id === e.materialId);
            return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div><p class="font-medium text-slate-800">${m?.material || '-'}</p><p class="text-sm text-slate-500">${e.fornecedor || '-'}</p></div>
                <div class="text-right"><p class="font-semibold text-emerald-600">+${e.quantidade}</p><p class="text-xs text-slate-400">${formatDate(e.data)}</p></div>
            </div>`;
        }).join('');
}

function renderSaida() {
    document.getElementById('saidaMaterial').innerHTML = '<option value="">Selecione</option>' + 
        estoque.filter(i => i.estoque_atual > 0).map(i => `<option value="${i.id}">${i.material} - Disp: ${i.estoque_atual}</option>`).join('');
    document.getElementById('saidaObra').innerHTML = '<option value="">Selecione</option>' + 
        obras.filter(o => o.status !== 'Finalizada').map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
    document.getElementById('saidaResponsavel').innerHTML = '<option value="">Selecione</option>' + 
        responsaveis.map(r => `<option value="${r.id}">${r.nome} - ${r.funcao}</option>`).join('');
    renderHistoricoSaidas();
}

function renderHistoricoSaidas() {
    const h = saidas.slice(-5).reverse();
    document.getElementById('historicoSaidas').innerHTML = h.length === 0 
        ? '<p class="text-slate-400 text-center py-4">Nenhuma saída</p>'
        : h.map(s => {
            const m = estoque.find(x => x.id === s.materialId);
            const o = obras.find(x => x.id === s.obraId);
            return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div><p class="font-medium text-slate-800">${m?.material || '-'}</p><p class="text-sm text-slate-500">${o?.nome || '-'}</p></div>
                <div class="text-right"><p class="font-semibold text-orange-600">-${s.quantidade}</p><p class="text-xs text-slate-400">${formatDate(s.data)}</p></div>
            </div>`;
        }).join('');
}

function renderCadastros() {
    document.getElementById('listaObras').innerHTML = obras.map(o => `
        <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl mb-2">
            <div class="flex items-center gap-3">
                <span class="font-mono text-sm bg-slate-200 px-2 py-1 rounded">${o.id}</span>
                <div><p class="font-medium text-slate-800">${o.nome}</p><p class="text-sm text-slate-500">${o.endereco}</p></div>
            </div>
            <div class="flex items-center gap-3">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${o.status === 'Finalizada' ? 'bg-slate-200 text-slate-600' : o.status === 'Em andamento' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">${o.status}</span>
                <button onclick="deletarObra('${o.id}')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('listaResponsaveis').innerHTML = responsaveis.map(r => `
        <div class="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i data-lucide="user" class="w-5 h-5"></i></div>
                <div><p class="font-medium text-slate-800">${r.nome}</p><p class="text-sm text-slate-500">${r.funcao}</p></div>
            </div>
            <button onclick="deletarResponsavel(${r.id})" class="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderPorObra() {
    document.getElementById('selectObra').innerHTML = '<option value="">Todas as Obras</option>' + 
        obras.map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
    renderConsumoObra();
}

function renderConsumoObra() {
    const sel = document.getElementById('selectObra').value;
    const consumo = {};
    saidas.forEach(s => {
        if (!consumo[s.obraId]) consumo[s.obraId] = {};
        if (!consumo[s.obraId][s.materialId]) consumo[s.obraId][s.materialId] = { total: 0, data: null };
        consumo[s.obraId][s.materialId].total += s.quantidade;
        consumo[s.obraId][s.materialId].data = s.data;
    });

    if (!sel) {
        document.getElementById('obrasContainer').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${obras.map(o => {
                const c = consumo[o.id] || {};
                const itens = Object.keys(c).length;
                const total = Object.values(c).reduce((s, x) => s + x.total, 0);
                return `<div onclick="document.getElementById('selectObra').value='${o.id}';renderConsumoObra();" class="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:shadow-lg transition-all">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><i data-lucide="building-2" class="w-6 h-6"></i></div>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${o.status === 'Finalizada' ? 'bg-slate-100 text-slate-600' : o.status === 'Em andamento' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">${o.status}</span>
                    </div>
                    <h3 class="font-semibold text-slate-800 text-lg mb-1">${o.nome}</h3>
                    <p class="text-sm text-slate-500 mb-4">${o.endereco}</p>
                    <div class="flex justify-between pt-4 border-t border-slate-100">
                        <div><p class="text-2xl font-bold text-slate-800">${itens}</p><p class="text-xs text-slate-500">itens</p></div>
                        <div class="text-right"><p class="text-2xl font-bold text-orange-600">${total}</p><p class="text-xs text-slate-500">retirados</p></div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    } else {
        const obra = obras.find(o => o.id === sel);
        const c = consumo[sel] || {};
        document.getElementById('obrasContainer').innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-200 flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><i data-lucide="building-2" class="w-7 h-7"></i></div>
                    <div><h2 class="text-xl font-bold text-slate-800">${obra?.nome}</h2><p class="text-slate-500">${obra?.endereco}</p></div>
                </div>
                <table class="w-full">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr><th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Material</th><th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">Total</th><th class="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">Última</th></tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${Object.keys(c).length === 0 ? '<tr><td colspan="3" class="px-6 py-12 text-center text-slate-400">Nenhuma retirada registrada</td></tr>' :
                        Object.entries(c).map(([mid, data]) => {
                            const m = estoque.find(x => x.id === parseInt(mid));
                            return `<tr class="hover:bg-slate-50">
                                <td class="px-6 py-4"><p class="font-medium text-slate-800">${m?.material || '-'}</p><p class="text-sm text-slate-500">${m?.unidade || ''}</p></td>
                                <td class="px-6 py-4 text-center font-semibold text-orange-600">${data.total}</td>
                                <td class="px-6 py-4 text-center text-slate-500">${data.data ? formatDate(data.data) : '-'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }
    lucide.createIcons();
}

// =====================
// AÇÕES
// =====================
function registrarEntrada() {
    const matId = parseInt(document.getElementById('entradaMaterial').value);
    const qty = parseInt(document.getElementById('entradaQtd').value);
    if (!matId || !qty || qty <= 0) return showToast('Preencha material e quantidade', 'error');
    
    const mat = estoque.find(i => i.id === matId);
    estoque = estoque.map(i => i.id === matId ? {...i, entradas: i.entradas + qty, estoque_atual: i.estoque_atual + qty} : i);
    entradas.push({ 
        id: Date.now(), 
        materialId: matId, 
        quantidade: qty, 
        fornecedor: document.getElementById('entradaFornecedor').value, 
        nf: document.getElementById('entradaNF').value, 
        data: new Date().toISOString(),
        registradoPor: usuarioAtual?.nome || 'Sistema'
    });
    saveData();
    registrarLog('entrada', `Entrada de ${qty}x ${mat?.material}`);
    
    document.getElementById('entradaMaterial').value = '';
    document.getElementById('entradaQtd').value = '';
    document.getElementById('entradaFornecedor').value = '';
    document.getElementById('entradaNF').value = '';
    
    renderHistoricoEntradas();
    showToast('Entrada registrada!');
}

function registrarSaida() {
    const matId = parseInt(document.getElementById('saidaMaterial').value);
    const qty = parseInt(document.getElementById('saidaQtd').value);
    const obraId = document.getElementById('saidaObra').value;
    const respId = document.getElementById('saidaResponsavel').value;
    
    if (!matId || !qty || qty <= 0 || !obraId) return showToast('Preencha todos os campos obrigatórios', 'error');
    
    const mat = estoque.find(i => i.id === matId);
    if (mat.estoque_atual < qty) return showToast('Quantidade insuficiente!', 'error');
    
    const obra = obras.find(o => o.id === obraId);
    estoque = estoque.map(i => i.id === matId ? {...i, saidas: i.saidas + qty, estoque_atual: i.estoque_atual - qty} : i);
    saidas.push({ 
        id: Date.now(), 
        materialId: matId, 
        quantidade: qty, 
        obraId, 
        responsavelId: respId, 
        data: new Date().toISOString(),
        registradoPor: usuarioAtual?.nome || 'Sistema'
    });
    saveData();
    registrarLog('saida', `Saída de ${qty}x ${mat?.material} para ${obra?.nome}`);
    
    document.getElementById('saidaMaterial').value = '';
    document.getElementById('saidaQtd').value = '';
    document.getElementById('saidaObra').value = '';
    document.getElementById('saidaResponsavel').value = '';
    
    renderSaida();
    showToast('Saída registrada!');
}

function cadastrarMaterial() {
    const nome = document.getElementById('novoMaterialNome').value.trim();
    if (!nome) return showToast('Digite o nome do material', 'error');
    
    const newId = Math.max(...estoque.map(i => i.id), 0) + 1;
    const inicial = parseInt(document.getElementById('novoMaterialEstoque').value) || 0;
    estoque.push({
        id: newId,
        categoria: document.getElementById('novoMaterialCat').value,
        material: nome,
        unidade: document.getElementById('novoMaterialUnid').value,
        estoque_inicial: inicial,
        entradas: 0,
        saidas: 0,
        estoque_atual: inicial,
        minimo: parseInt(document.getElementById('novoMaterialMinimo').value) || 0
    });
    saveData();
    
    document.getElementById('novoMaterialNome').value = '';
    document.getElementById('novoMaterialEstoque').value = '0';
    document.getElementById('novoMaterialMinimo').value = '0';
    
    showToast('Material cadastrado!');
}

function cadastrarObra() {
    const id = document.getElementById('novaObraId').value.trim().toUpperCase();
    const nome = document.getElementById('novaObraNome').value.trim();
    if (!id || !nome) return showToast('Preencha código e nome', 'error');
    if (obras.find(o => o.id === id)) return showToast('Código já existe', 'error');
    
    obras.push({
        id,
        nome,
        endereco: document.getElementById('novaObraEndereco').value,
        status: document.getElementById('novaObraStatus').value
    });
    saveData();
    
    document.getElementById('novaObraId').value = '';
    document.getElementById('novaObraNome').value = '';
    document.getElementById('novaObraEndereco').value = '';
    
    renderCadastros();
    showToast('Obra cadastrada!');
}

function cadastrarResponsavel() {
    const nome = document.getElementById('novoRespNome').value.trim();
    if (!nome) return showToast('Digite o nome', 'error');
    
    const newId = Math.max(...responsaveis.map(r => r.id), 0) + 1;
    responsaveis.push({
        id: newId,
        nome,
        funcao: document.getElementById('novoRespFuncao').value || '-'
    });
    saveData();
    
    document.getElementById('novoRespNome').value = '';
    document.getElementById('novoRespFuncao').value = '';
    
    renderCadastros();
    showToast('Responsável cadastrado!');
}

function deletarObra(id) {
    if (!confirm('Excluir esta obra?')) return;
    obras = obras.filter(o => o.id !== id);
    saveData();
    renderCadastros();
    showToast('Obra excluída');
}

function deletarResponsavel(id) {
    if (!confirm('Excluir este responsável?')) return;
    responsaveis = responsaveis.filter(r => r.id !== id);
    saveData();
    renderCadastros();
    showToast('Responsável excluído');
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    verificarAutenticacao();
});
