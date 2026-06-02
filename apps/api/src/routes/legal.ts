import { Router } from "express";

const router = Router();

router.get("/terms", (_req, res) => {
  res.json({
    title: "Termos de Uso NODERE",
    updatedAt: "2026-06-02",
    sections: [
      {
        title: "Uso da plataforma",
        body: "O NODERE Intelligence é uma plataforma SaaS para prospecção comercial, CRM, análise de presença digital e apoio operacional com IA. O usuário é responsável por usar os dados obtidos de fontes públicas e integrações autorizadas de forma ética e em conformidade com a legislação aplicável."
      },
      {
        title: "Credenciais e integrações",
        body: "Chaves de API, tokens e credenciais devem ser configurados apenas em ambientes seguros. O NODERE não exibe secrets completos no frontend e não deve ser usado para armazenar credenciais fora das áreas administrativas protegidas."
      },
      {
        title: "Limites, créditos e billing",
        body: "O uso da plataforma pode consumir créditos de busca, análise, IA e automações. Planos pagos são processados por provedor de pagamento externo e podem ter limites próprios de operadores, créditos e recursos."
      },
      {
        title: "Responsabilidade comercial",
        body: "Diagnósticos, mensagens, propostas e recomendações gerados por IA devem ser revisados pelo usuário antes de envio a terceiros."
      }
    ]
  });
});

router.get("/privacy", (_req, res) => {
  res.json({
    title: "Política de Privacidade NODERE",
    updatedAt: "2026-06-02",
    sections: [
      {
        title: "Dados tratados",
        body: "A plataforma armazena dados comerciais de leads, empresas, contatos, observações, tarefas, histórico operacional, preferências de layout e registros de auditoria vinculados ao workspace do usuário."
      },
      {
        title: "Isolamento por workspace",
        body: "Cada conta/workspace possui dados isolados. Usuários criados por um administrador acessam somente as informações vinculadas ao próprio workspace."
      },
      {
        title: "Segurança",
        body: "Secrets de Google, OpenAI, Stripe, Supabase e demais integrações devem ficar em variáveis de ambiente no backend. Logs e respostas públicas não retornam chaves completas."
      },
      {
        title: "Retenção e backup",
        body: "Dados podem ser exportados por usuários autorizados para backup operacional. Exclusões feitas por administradores podem remover dados do workspace conforme as permissões configuradas."
      }
    ]
  });
});

export default router;
