import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NODERE Intelligence API",
      version: "1.0.0",
      description: "API para integração com o NODERE Intelligence. Use sua API Key no header X-NODERE-API-Key."
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
