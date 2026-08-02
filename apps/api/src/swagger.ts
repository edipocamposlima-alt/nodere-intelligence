import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NODERE API",
      version: "1.5.0",
      description: "API para integração com o NODERE. Use sua API Key no header X-NODERE-API-Key."
    },
    servers: [{ url: "https://nodere-api.onrender.com", description: "Produção" }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-NODERE-API-Key" }
      }
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      "/api/health": {
        get: {
          summary: "Verifica saúde pública do backend",
          security: [],
          responses: { 200: { description: "Backend operacional" } }
        }
      },
      "/api/companies": {
        get: {
          summary: "Lista empresas do workspace",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer", default: 1 } },
            { in: "query", name: "limit", schema: { type: "integer", default: 25 } }
          ],
          responses: { 200: { description: "Lista de empresas" } }
        },
        post: {
          summary: "Cria empresa/lead manualmente",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    phone: { type: "string" },
                    website: { type: "string" }
                  }
                }
              }
            }
          },
          responses: { 201: { description: "Empresa criada" } }
        }
      },
      "/api/searches": {
        post: {
          summary: "Executa busca real de empresas via integrações configuradas",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    companyName: { type: "string" },
                    segment: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    keyword: { type: "string" },
                    limit: { type: "integer", default: 20 }
                  }
                }
              }
            }
          },
          responses: { 201: { description: "Busca salva e resultados retornados" } }
        }
      },
      "/api/reports/operators": {
        get: {
          summary: "Retorna métricas automáticas de operadores",
          responses: { 200: { description: "Ranking e métricas por usuário" } }
        }
      },
      "/api/briefings/fields": {
        get: {
          summary: "Retorna o catálogo canônico dos 47 campos do Briefing Comercial",
          responses: { 200: { description: "Catálogo de campos" }, 401: { description: "Sessão ausente ou inválida" } }
        }
      },
      "/api/briefings": {
        get: {
          summary: "Lista e filtra briefings do workspace",
          responses: { 200: { description: "Lista de briefings" } }
        },
        post: {
          summary: "Cria um briefing vinculado a uma empresa",
          responses: { 201: { description: "Briefing criado" }, 403: { description: "Perfil sem permissão de escrita" } }
        }
      },
      "/api/briefings/{id}/complete": {
        post: {
          summary: "Conclui o briefing, aplica mapeamentos aprovados e registra versão/auditoria",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { 200: { description: "Briefing concluído" }, 409: { description: "Conflito de versão ou cadastro" } }
        }
      },
      "/api/communications-center/status": {
        get: {
          summary: "Informa os modos efetivos de e-mail, Gmail e WhatsApp",
          responses: { 200: { description: "Estado das integrações" } }
        }
      },
      "/api/communications-center/compose": {
        post: {
          summary: "Cria saída idempotente após consentimento explícito",
          responses: { 201: { description: "Saída criada" }, 422: { description: "Consentimento ou conteúdo inválido" } }
        }
      },
      "/v1/leads": {
        get: {
          summary: "API pública: lista leads",
          responses: { 200: { description: "Leads retornados" } }
        },
        post: {
          summary: "API pública: cria lead",
          responses: { 201: { description: "Lead criado" } }
        }
      },
      "/v1/search": {
        get: {
          summary: "API pública: busca empresas",
          responses: { 200: { description: "Resultados de busca" } }
        }
      }
    }
  },
  apis: []
});
