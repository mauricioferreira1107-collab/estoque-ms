# MS Pinturas - Controle de Estoque

Sistema web (SPA client-side) de controle de estoque para a MS Pinturas.

## Funcionalidades

- **Dashboard** — visão geral com contadores de itens em dia, para repor e críticos.
- **Estoque Geral** — busca/filtro por categoria e status; cards permitem **editar** e **excluir** materiais.
- **Registrar Entrada / Saída** — movimentações com fornecedor/NF (entrada) e obra/responsável (saída). Saída é bloqueada se não houver estoque suficiente.
- **Cadastros** — gerenciar obras, responsáveis e novos materiais. Inclui **Backup**: exportar/importar JSON com todos os dados.
- **Por Obra** — agregação de consumo por obra com data da última retirada correta.
- **PWA** — pode ser instalado no celular; service-worker faz cache do app shell para uso offline depois da primeira visita.

## ⚠️ Aviso de segurança

Esta é uma aplicação **100% client-side**. Em particular:

- **A lista de usuários e senhas está em `app.js`**, em texto puro, e é visível para qualquer pessoa que abra o DevTools. Isto **não é autenticação real** — é só um filtro de acesso para usuários de boa fé.
- Os dados ficam em `localStorage` no navegador. Se o usuário limpar dados do site, perde tudo. **Faça backup periódico** em Cadastros → Exportar.
- Para um sistema com autenticação real, persistência confiável e auditoria, é necessário um backend (ex.: Node + Postgres, ou um BaaS como Supabase/Firebase).

## Como rodar localmente

Não há build. Basta servir os arquivos estáticos:

```bash
python3 -m http.server 8080
# Abrir http://localhost:8080
```

Ou:

```bash
npm install
npm run serve
```

## Scripts npm

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint com correção automática
npm run format        # Prettier (escreve)
npm run format:check  # Prettier (somente verifica)
npm test              # Smoke tests (Playwright + Chromium)
npm run test:install  # Instala browsers do Playwright (uma vez)
```

## Hospedagem

Por ser estático, qualquer hosting de arquivos serve.

### GitHub Pages

1. Suba os 4+ arquivos para o repositório (`index.html`, `app.js`, `manifest.json`, `service-worker.js`, `icon.svg`, `README.md`).
2. Settings → Pages → Source: branch `main`.
3. Acesse `https://SEU-USUARIO.github.io/estoque-ms`.

### Netlify / Vercel

Arraste a pasta na área de deploy e pronto.

## Instalar no celular

Depois de hospedar:

- **Android (Chrome):** menu → "Adicionar à tela inicial".
- **iPhone (Safari):** compartilhar → "Adicionar à Tela de Início".

Após a primeira visita o service-worker faz cache do app — funciona offline para consulta e cadastro.

## Estrutura

```
.
├── index.html              # Estrutura, telas, modal de edição de material
├── app.js                  # Toda a lógica (auth, render, ações, export/import, SW register)
├── service-worker.js       # Cache do app shell (offline)
├── manifest.json           # Configuração PWA
├── icon.svg                # Ícone do app
├── package.json            # Scripts e devDependencies (lint/test)
├── playwright.config.js    # Config dos testes
├── tests/smoke.spec.js     # Smoke tests
└── .github/workflows/ci.yml
```

## Personalização

Para mudar o nome da empresa, edite em `index.html` (header, login, manifest descritivo) e `manifest.json`.

Para adicionar/remover usuários, edite `USUARIOS_AUTORIZADOS` no topo de `app.js` — **com a ressalva de segurança acima**.

---

Desenvolvido para MS Pinturas.
