# Guia rapido de uso - Nodere Intelligence

Este pacote esta liberado para uso local como MVP pessoal.

## Abrir o aplicativo

Opcao mais simples:

```text
INICIAR_NODERE.bat
```

Ou abra diretamente:

```text
index.html
```

## Entrar

Use a tela de login demonstrativa e entre como Owner.

O acesso atual ainda e local, salvo no navegador. Para uso com outros usuarios em producao, use a etapa de backend/autenticacao descrita no roadmap.

## Fluxo diario recomendado

1. Abra o Dashboard para acompanhar oportunidades.
2. Va em Buscador.
3. Use os filtros de cidade, segmento e palavra-chave.
4. Clique em "Localizar oportunidades" para usar a base demonstrativa.
5. Com a API configurada, clique em "Buscar via Google Places".
6. Abra uma empresa.
7. Salve o lead.
8. Rode o scanner real.
9. Gere o diagnostico com IA.
10. Abra o WhatsApp com a mensagem pronta.
11. Atualize a etapa do CRM.
12. Registre notas e follow-ups.
13. Exporte CSV ou salve o diagnostico em PDF.

## Usar integracoes reais

1. Configure Supabase com `mvp-supabase-schema.sql`.
2. Preencha `backend/.env`.
3. Rode:

```text
INICIAR_API_MVP.bat
```

4. No app, va em Admin > MVP local > Conexao com API.
5. Configure:
   - URL da API: `http://localhost:3333`
   - Token pessoal: o valor de `MVP_OWNER_TOKEN`
6. Clique em "Testar conexao".

## O que ja esta pronto

- Interface web responsiva.
- Logo oficial aplicado.
- Dashboard.
- Buscador.
- CRM Kanban.
- Tela de empresa.
- WhatsApp por link.
- Diagnostico printavel em PDF.
- Exportacao CSV.
- Admin com permissoes por abas.
- API MVP para Google Places, Supabase, scanner, IA, CRM e historico.

## O que depende de chaves

- Busca real no Google Places.
- Salvamento real no Supabase.
- Diagnostico real com OpenAI.
- Scanner real persistido no banco.

Sem essas chaves, o app continua funcionando como demonstracao local.
