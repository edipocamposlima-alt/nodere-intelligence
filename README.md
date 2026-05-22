# Nodere Intelligence

**Nodere Intelligence** é uma plataforma SaaS para encontrar empresas com falhas digitais e transformar esses sinais em oportunidades comerciais para Google Ads, Google Business Profile, tráfego pago e consultoria digital.

Slogan:

> Transformando falhas digitais em oportunidades comerciais.

## O que o protótipo entrega

- Dashboard executivo.
- Buscador inteligente de empresas.
- Scanner com buscas salvas e fila de auditoria.
- Google Intelligence para Ads e Perfil da Empresa.
- Tela de empresa com diagnóstico, score e playbook.
- CRM Kanban.
- Automação comercial.
- Inbox com WhatsApp/e-mail simulado.
- Copilot IA com previsão, ROI e proposta.
- Diagnóstico printável em PDF.
- Relatórios e exportação CSV.
- Admin com usuários, permissões por aba e convites.
- Planos, créditos, consumo e faturas.
- Performance comercial da equipe.
- PWA instalável.

## Como abrir

Recomendado no Windows:

```text
INICIAR_NODERE.bat
```

Isso abre `http://localhost:4173`.

Abra o arquivo:

```text
index.html
```

Ou rode um servidor local estático:

```bash
python -m http.server 4173
```

Depois acesse:

```text
http://localhost:4173
```

## Arquivos principais

- `index.html` - interface principal.
- `styles.css` - design system e responsividade.
- `app.js` - dados mockados, navegação e interações.
- `manifest.webmanifest` - configuração PWA.
- `service-worker.js` - cache básico da aplicação.
- `nodere-logo-wordmark.png` - logo oficial aplicado na interface.
- `nodere-icon.png` - ícone do app, favicon e PWA.
- `nodere-logo-source.png` - imagem original enviada como referência.
- `database-schema.sql` - schema PostgreSQL proposto.
- `API_CONTRACTS.md` - contratos REST propostos.
- `ARCHITECTURE.md` - arquitetura técnica.
- `IMPLEMENTATION_ROADMAP.md` - roadmap de produção.
- `ENTERPRISE_PLATFORM_BLUEPRINT.md` - desenho completo da versao SaaS enterprise.
- `ENTERPRISE_DATABASE_SCHEMA.sql` - schema avancado multi-tenant com geografia e scores.
- `INTEGRATION_MATRIX.md` - matriz de APIs, prioridades e credenciais.
- `.env.example` - variáveis de ambiente para backend real.

## Próxima fase recomendada

Para uso pessoal imediato, comece pelo MVP:

1. Configurar Supabase com `mvp-supabase-schema.sql`.
2. Rodar a API local em `backend/`.
3. Conectar Google Places para descoberta de empresas.
4. Rodar scanner de site.
5. Gerar diagnóstico com IA.
6. Abrir WhatsApp com mensagem pronta.
7. Controlar status no CRM e exportar CSV/PDF.

Veja o passo a passo em `MVP_INTEGRATION_GUIDE.md`.

Depois do MVP validado:

1. Migrar a interface para Next.js + TypeScript.
2. Implementar autenticação real com Supabase Auth, Firebase Auth ou Auth.js.
3. Conectar Google Business Profile e Google Ads APIs.
4. Conectar WhatsApp Cloud API.
5. Implementar filas, créditos, billing e auditoria de segurança.

## GitHub

O projeto esta preparado para GitHub e GitHub Pages.

- `package.json` inclui scripts locais.
- `.gitignore` protege `.env` e `node_modules`.
- `.github/workflows/pages.yml` publica a interface estatica no GitHub Pages.
- `GITHUB_PUBLICATION.md` explica o passo a passo de publicacao.

## Observação

Este pacote é um protótipo navegável e funcional em modo local, com dados simulados. As integrações reais exigem backend, credenciais oficiais, permissões dos provedores e validação jurídica/comercial.
