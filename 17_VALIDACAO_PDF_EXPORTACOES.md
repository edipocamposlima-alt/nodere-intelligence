# 17 — Validação de PDF e exportações

O V3 não alterou os geradores de relatório/proposta existentes. A IA não pode afirmar que exportou ou enviou PDF: não existe tool de exportação no catálogo inicial. Qualquer futura tool de PDF deverá receber ID de recurso do workspace, gerar via backend, validar assinatura `%PDF`, tamanho/páginas e retornar recibo/link autorizado.

O renderer da rota de relatório foi extraído para `services/reportPdf.ts` sem mudar layout ou headers. O teste real gera o Buffer e valida prefixo `%PDF-`, `%%EOF`, ao menos um objeto Page e tamanho acima de 1.000 bytes. Resultado: passou em 2026-07-22. A suíte manteve quatro casos de filtros/CSV verdes.

Ainda não houve download autenticado em preview/produção nem inspeção visual página a página de proposta, contrato e ficha do cliente; esses smokes dependem de credenciais de teste e deploy.
