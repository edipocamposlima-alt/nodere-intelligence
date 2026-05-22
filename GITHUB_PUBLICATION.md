# Publicar Nodere Intelligence no GitHub

Este projeto esta pronto para subir no GitHub como MVP local e tambem pode rodar no GitHub Pages como interface estatica.

## O que vai funcionar no GitHub Pages

- Interface web.
- Dashboard.
- Buscador demonstrativo.
- CRM demonstrativo.
- Admin local.
- WhatsApp por link.
- Diagnostico printavel.
- Exportacao CSV local.
- PWA basico.

## O que nao roda direto no GitHub Pages

GitHub Pages hospeda arquivos estaticos. Portanto, estas partes precisam de backend separado:

- API MVP em `backend/`.
- Supabase com service role.
- Google Places real.
- OpenAI real.
- Scanner real persistido.

Para dados reais, publique o frontend no GitHub Pages e rode a API em Render, Railway, Fly.io, Google Cloud Run ou localmente.

## Opcao 1: Publicar pelo GitHub Desktop

1. Instale GitHub Desktop: `https://desktop.github.com`.
2. Abra o GitHub Desktop.
3. Clique em `File > Add local repository`.
4. Selecione esta pasta:

```text
C:\Users\edipo\Documents\Codex\2026-05-21\crie-um-aplicativo-saas-profissional-com
```

5. Se ele disser que nao e um repositorio Git, clique em `create a repository`.
6. Nome sugerido:

```text
nodere-intelligence
```

7. Clique em `Publish repository`.
8. Escolha se sera publico ou privado.

## Opcao 2: Publicar pelo site do GitHub

1. Acesse `https://github.com/new`.
2. Crie um repositorio chamado `nodere-intelligence`.
3. No repositorio, clique em `Add file > Upload files`.
4. Arraste os arquivos desta pasta.
5. Nao envie:
   - `backend/.env`
   - `node_modules`
   - `backend/node_modules`
6. Clique em `Commit changes`.

## Ativar GitHub Pages

Se usar o workflow incluido:

1. Entre no repositorio no GitHub.
2. Va em `Settings > Pages`.
3. Em `Build and deployment`, escolha `GitHub Actions`.
4. Va em `Actions`.
5. Execute ou aguarde o workflow `Deploy static app to GitHub Pages`.
6. O GitHub vai gerar uma URL parecida com:

```text
https://SEU-USUARIO.github.io/nodere-intelligence/
```

## Rodar local depois de baixar do GitHub

Com Node instalado:

```bash
npm start
```

Depois acesse:

```text
http://localhost:4173
```

No Windows, tambem pode abrir:

```text
INICIAR_NODERE.bat
```

## Rodar a API MVP

1. Copie `.env.mvp.example` para `backend/.env`.
2. Preencha Supabase, Google Places e OpenAI.
3. Rode:

```bash
cd backend
npm install
npm run dev
```

Ou no Windows:

```text
INICIAR_API_MVP.bat
```

## Importante sobre seguranca

Nunca suba `backend/.env` para o GitHub. Esse arquivo pode conter service role do Supabase, tokens Google e chave OpenAI.
