import { Router } from "express";

const router = Router();

const TERMS_SECTIONS = [
  ["1. ACEITAÇÃO DOS TERMOS", "Ao acessar, utilizar ou contratar qualquer serviço disponibilizado pelo NODERI Nexus (\"Plataforma\"), o usuário declara ter lido, compreendido e concordado integralmente com os presentes Termos de Uso, bem como com a Política de Privacidade e demais documentos complementares disponibilizados pela plataforma. Caso o usuário não concorde com qualquer disposição destes termos, deverá interromper imediatamente a utilização da plataforma."],
  ["2. SOBRE A PLATAFORMA", "O NODERI Nexus é uma plataforma de software como serviço (SaaS) destinada à prospecção comercial, gestão de relacionamento com clientes (CRM), análise de presença digital, automação de processos, geração de documentos, inteligência comercial e utilização de recursos de inteligência artificial. As funcionalidades podem incluir: CRM e funil de vendas; gestão de leads e oportunidades; busca e análise de empresas; integrações com APIs e serviços de terceiros; geração de propostas e contratos; gestão de tarefas e agenda; relatórios e dashboards; recursos de inteligência artificial."],
  ["3. CADASTRO E ACESSO", "O usuário é responsável por fornecer informações verdadeiras e atualizadas; manter seus dados cadastrais atualizados; preservar o sigilo de login e senha; não compartilhar credenciais de acesso com terceiros; garantir a segurança dos dispositivos utilizados. Toda atividade realizada através da conta será considerada de responsabilidade do titular."],
  ["4. USO PERMITIDO", "Gestão comercial; organização de clientes e oportunidades; prospecção empresarial; automação de processos internos; emissão de documentos comerciais; apoio à tomada de decisão. O uso deverá ocorrer em conformidade com a legislação vigente."],
  ["5. USO PROIBIDO", "Atividades ilícitas; envio de spam; violação de direitos de terceiros; engenharia reversa; cópia ou redistribuição não autorizada; acesso não autorizado a sistemas; coleta indevida de dados pessoais; compartilhamento de credenciais com terceiros não autorizados; exploração de vulnerabilidades. O descumprimento poderá resultar em suspensão ou encerramento imediato."],
  ["6. DADOS EMPRESARIAIS E FONTES PÚBLICAS", "O NODERI poderá utilizar informações provenientes de bases públicas, APIs autorizadas, diretórios empresariais, ferramentas de pesquisa e serviços contratados. O usuário reconhece que disponibilidade, precisão e atualização desses dados dependem das fontes externas. O NODERI não garante exatidão, atualização ou completude de informações de terceiros."],
  ["7. PROTEÇÃO DE DADOS E LGPD", "O tratamento de dados observará a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). O usuário é responsável pela legitimidade dos dados inseridos e por garantir conformidade com a LGPD."],
  ["8. INTELIGÊNCIA ARTIFICIAL", "A plataforma poderá utilizar modelos de IA para geração de textos, sugestões comerciais, criação de propostas, classificação de leads, automação de tarefas e análises de mercado. Os conteúdos gerados possuem caráter auxiliar e não substituem avaliação humana. O usuário é integralmente responsável pela revisão e validação de qualquer conteúdo produzido pela IA."],
  ["9. INTEGRAÇÕES COM TERCEIROS", "A plataforma poderá integrar-se a OpenAI, Apollo, Google, Google Maps, Google Business Profile, WhatsApp, Stripe, Econodata, LinkedIn e serviços de hospedagem. A disponibilidade dessas integrações depende dos respectivos fornecedores."],
  ["10. CREDENCIAIS, TOKENS E CHAVES DE API", "As credenciais são de responsabilidade do usuário. O NODERI adota práticas de segurança incluindo ocultação de secrets, controle de acesso, armazenamento seguro e restrições administrativas."],
  ["11. PLANOS, CRÉDITOS E COBRANÇAS", "Determinadas funcionalidades estarão sujeitas a planos pagos com limites de usuários, operadores, créditos de IA, consultas, armazenamento, integrações e processamentos automatizados. O processamento financeiro ocorre por provedores especializados."],
  ["12. DISPONIBILIDADE DA PLATAFORMA", "O NODERI envidará esforços razoáveis para manter a plataforma disponível, sujeita a manutenções programadas, atualizações, falhas de internet, problemas de infraestrutura, incidentes de segurança e falhas de terceiros."],
  ["13. BACKUP E RETENÇÃO DE DADOS", "Rotinas de backup poderão ser realizadas. Recomenda-se que o usuário mantenha cópias próprias de documentos críticos. A retenção de dados poderá variar conforme o plano."],
  ["14. PROPRIEDADE INTELECTUAL", "Todos os direitos relativos à plataforma pertencem ao NODERI, incluindo código-fonte, interface, layout, logotipos, marca, documentação, funcionalidades, banco de dados e conteúdo proprietário. Nenhum direito é transferido ao usuário."],
  ["15. LIMITAÇÃO DE RESPONSABILIDADE", "O NODERI não será responsável por perdas de negócios, lucros cessantes, danos indiretos, falhas de terceiros, erros em bases externas, decisões comerciais do usuário, conteúdos gerados por IA ou utilização inadequada. A responsabilidade total fica limitada ao valor efetivamente pago nos últimos 12 meses."],
  ["16. SUSPENSÃO E ENCERRAMENTO", "O acesso poderá ser suspenso por violação dos termos, fraude, inadimplência, uso abusivo, atividades ilícitas ou riscos à segurança."],
  ["17. ALTERAÇÕES DOS TERMOS", "O NODERI poderá modificar estes termos a qualquer momento. As alterações produzem efeitos após publicação. A continuidade de utilização representa concordância."],
  ["18. LEGISLAÇÃO E FORO", "Regidos pelas leis da República Federativa do Brasil. Foro da comarca de Caxias do Sul, Estado do Rio Grande do Sul."],
  ["19. CONTATO", "Dúvidas poderão ser encaminhadas pelos canais oficiais do NODERI Nexus."]
];

const PRIVACY_SECTIONS = [
  ["1. APRESENTAÇÃO", "Esta Política de Privacidade explica como o NODERI Nexus coleta, usa, armazena, protege e compartilha dados tratados na plataforma SaaS de prospecção, CRM, inteligência comercial, automações, relatórios e integrações."],
  ["2. DADOS COLETADOS", "Podemos tratar dados de cadastro, dados comerciais de empresas e leads, contatos e decisores, observações, histórico operacional, agenda, tarefas, propostas, contratos, arquivos, dados técnicos de acesso, logs de auditoria, preferências de tema/layout e dados obtidos de fontes públicas ou APIs autorizadas."],
  ["3. FINALIDADES DO TRATAMENTO", "Os dados são utilizados para autenticação, operação do CRM, busca de empresas, enriquecimento comercial, geração de documentos, relatórios, IA, notificações, suporte, segurança, billing, auditoria e melhoria da plataforma."],
  ["4. BASES LEGAIS", "O tratamento pode ocorrer com base em execução de contrato, legítimo interesse, cumprimento de obrigação legal, exercício regular de direitos e consentimento quando aplicável, sempre observando a LGPD."],
  ["5. ISOLAMENTO POR WORKSPACE", "Os dados são separados por workspace/empresa. Usuários de uma empresa não devem visualizar movimentações, leads, notas, arquivos ou configurações de outra empresa."],
  ["6. CONTROLE DE ACESSO", "Papéis como Owner, Admin, Operador e Visualizador controlam permissões de leitura, edição, exportação, auditoria, faturamento e administração de usuários."],
  ["7. INTELIGÊNCIA ARTIFICIAL", "Dados de leads e contexto operacional podem ser enviados a provedores de IA pelo backend seguro para gerar diagnósticos, mensagens, resumos e propostas. O usuário deve revisar todo conteúdo gerado antes de uso externo."],
  ["8. INTEGRAÇÕES COM TERCEIROS", "A plataforma pode se integrar com Google, OpenAI, Anthropic, Apollo, Econodata, WhatsApp, Stripe, RD Station, Bling, Supabase, serviços de e-mail e hospedagem. Cada integração depende das permissões e políticas do respectivo fornecedor."],
  ["9. SEGURANÇA DA INFORMAÇÃO", "Adotamos HTTPS, variáveis de ambiente, mascaramento de secrets, logs sem chaves completas, CORS controlado, escopo por workspace, validação de entrada e auditoria de atividades relevantes."],
  ["10. CREDENCIAIS E VARIÁVEIS DE AMBIENTE", "Chaves de API, tokens e secrets devem ser mantidos apenas no backend/Render ou serviço equivalente. O frontend não deve armazenar credenciais sensíveis."],
  ["11. COMPARTILHAMENTO DE DADOS", "Dados podem ser compartilhados com subprocessadores estritamente necessários à operação da plataforma, integrações configuradas pelo usuário, provedores de infraestrutura, pagamentos, IA, e-mail e APIs autorizadas."],
  ["12. RETENÇÃO", "Os dados são mantidos enquanto a conta estiver ativa ou enquanto necessários para obrigações legais, auditoria, segurança, backup e execução contratual."],
  ["13. BACKUP E RECUPERAÇÃO", "Rotinas de backup podem ser utilizadas para continuidade operacional. Recomenda-se que o usuário mantenha cópias próprias de documentos críticos gerados ou anexados."],
  ["14. EXCLUSÃO DE DADOS", "Administradores podem solicitar exclusão de dados conforme permissões e regras contratuais. Exclusões podem afetar histórico, arquivos, propostas, contratos e relatórios associados."],
  ["15. DIREITOS DOS TITULARES", "Titulares podem solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, informação sobre compartilhamento e revisão de decisões automatizadas, conforme LGPD."],
  ["16. COOKIES", "Usamos cookies e armazenamento local para sessão, preferências visuais, segurança e funcionamento da experiência. Cookies essenciais são necessários para autenticação."],
  ["17. INCIDENTES DE SEGURANÇA", "Em caso de incidente relevante, adotaremos medidas técnicas e administrativas proporcionais e comunicaremos autoridades e titulares quando exigido pela legislação."],
  ["18. ALTERAÇÕES DESTA POLÍTICA", "Esta política pode ser atualizada para refletir melhorias, mudanças legais, novas integrações ou alterações operacionais. A versão vigente ficará disponível na plataforma."],
  ["19. CONTATO E ENCARREGADO", "Dúvidas ou solicitações sobre privacidade e LGPD podem ser encaminhadas pelos canais oficiais do NODERI Nexus."]
];

router.get("/terms", (_req, res) => {
  res.json({
    title: "TERMOS DE USO – NODERI Nexus",
    updatedAt: "2026-06-02",
    subtitle: "Última atualização: 02 de junho de 2026",
    sections: TERMS_SECTIONS.map(([title, body]) => ({ title, body }))
  });
});

router.get("/privacy", (_req, res) => {
  res.json({
    title: "POLÍTICA DE PRIVACIDADE – NODERI Nexus",
    updatedAt: "2026-06-02",
    subtitle: "Última atualização: 02 de junho de 2026",
    sections: PRIVACY_SECTIONS.map(([title, body]) => ({ title, body }))
  });
});

export default router;
