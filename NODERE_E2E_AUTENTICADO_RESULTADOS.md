# NODERE — E2E Autenticado: Resultados

Data: 2026-07-19

## Resultado automatizado

- Playwright desktop e mobile: 4 cenários aprovados.
- 2 cenários autenticados foram ignorados porque `NODERE_E2E_EMAIL` e `NODERE_E2E_PASSWORD` não existem no ambiente.
- Os testes aprovados cobrem redirecionamento de rota privada sem sessão e rejeição de sessão inválida nos dois form factors.

## Smoke autenticado de produção

Foi reutilizada uma sessão humana já autenticada, somente para leitura/navegação. Dashboard, Buscas, CRM, Empresas/Ficha, Propostas, Relatórios, Admin e Manual carregaram sem erro de aplicação e sem redirecionamento indevido ao login. Rotas client-gated permaneceram em “Validando acesso seguro” apenas durante a checagem e depois renderizaram normalmente.

Também foram confirmadas as correções visuais/funcionais:

- onboarding não mostra progresso artificial 0/3 quando existem dados;
- Integrações não marca provedores opcionais como obrigatórios pelo plano;
- Admin usa “Usuários e convites” e não expõe senha temporária.

## Por que a conta técnica não foi criada

Não existe staging fiel nem cofre/credencial operacional fornecida. Criar uma identidade descartável diretamente em produção ampliaria o estado externo e misturaria dados de teste ao único workspace, sem restore comprovado. A criação foi deliberadamente adiada.

## Especificação da conta futura

- workspace E2E isolado;
- e-mail técnico sob domínio controlado;
- papel mínimo e dados sintéticos identificáveis;
- segredo guardado no CI/Vercel, nunca no repositório;
- rotação definida e remoção recuperável;
- cleanup idempotente;
- cenários de login, Dashboard, busca, salvamento, CRM, proposta, relatório, permissões e logout.

Classificação desta frente: **PARCIALMENTE CONCLUÍDO**.
