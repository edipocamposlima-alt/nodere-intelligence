# 23 — Arquitetura do Briefing Comercial NODERE

## Fluxo canônico

`Empresa/Lead → Briefing → versão/auditoria → conclusão → Empresa + Contato + Agenda → PDF/Comunicação`

## Componentes

- UI: `/crm/briefings` e `/crm/briefings/[id]`.
- Contexto: aba Briefings na Ficha 360.
- API: `/api/briefings` com catálogo, CRUD, busca, filtros, versões, conclusão, PDF, importação, exportação e anexos.
- Dados: `commercial_briefings`, `briefing_versions`, `commercial_briefing_attachments` e `briefing_field_mappings`.
- Arquivos: bucket privado `briefing-attachments`, limite de 5 MiB, MIME controlado e SHA-256.

## Integridade

- Todo registro usa `workspace_id` e RLS forçada.
- A edição usa `expectedUpdatedAt` para impedir sobrescrita silenciosa.
- Conclusão exige os quatro campos obrigatórios e registra versão e auditoria.
- Atualizações canônicas de empresa/contato só usam o catálogo explícito de mapeamentos.
- A próxima ação pode gerar evento de agenda.

## Limites

- Não há antivírus/quarentena de anexos; há limite, MIME e checksum.
- Áudio usa reconhecimento do navegador e precisa de permissão do dispositivo.
- Importação XLSX é atômica por lote de até 2.000 linhas, sem fila assíncrona para volumes maiores.

