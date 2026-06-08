import nodemailer from "nodemailer";
import { config } from "../config.js";
import { EmailSequenceTemplate, SequenceInstance, SequenceStep } from "../types.js";
import { sendAutomationEmail } from "./emailSender.js";

// Built-in sequence templates
export const SEQUENCE_TEMPLATES: EmailSequenceTemplate[] = [
  {
    id: "cold_prospecting",
    name: "Prospecção Fria",
    description: "3 toques em 7 dias para abertura de oportunidade comercial",
    steps: [
      {
        stepIndex: 0,
        delayDays: 0,
        channel: "email",
        subject: "Diagnostico digital gratuito para {empresa}",
        body: "Ola,\n\nRealizei uma analise da presenca digital de {empresa} e identifiquei oportunidades de crescimento que podem impactar diretamente na captacao de clientes.\n\nVoce teria 15 minutos para uma conversa rapida esta semana?\n\nAtenciosamente"
      },
      {
        stepIndex: 1,
        delayDays: 3,
        channel: "whatsapp",
        body: "Ola! Enviei um email sobre um diagnostico digital para {empresa}. Conseguiu ver? Podemos conversar rapidamente?"
      },
      {
        stepIndex: 2,
        delayDays: 7,
        channel: "email",
        subject: "Ultimo contato — {empresa}",
        body: "Ola,\n\nEstou encerrando meu contato com {empresa} por ora, mas queria deixar registrado que identificamos oportunidades de crescimento digital que podem ser exploradas a qualquer momento.\n\nQualquer duvida, estou a disposicao.\n\nAtenciosamente"
      }
    ]
  },
  {
    id: "proposal_followup",
    name: "Follow-up de Proposta",
    description: "3 lembretes apos envio de proposta comercial",
    steps: [
      {
        stepIndex: 0,
        delayDays: 1,
        channel: "whatsapp",
        body: "Ola! Ontem enviei a proposta para {empresa}. Conseguiu dar uma olhada? Tenho disponibilidade para tirar duvidas quando quiser."
      },
      {
        stepIndex: 1,
        delayDays: 3,
        channel: "email",
        subject: "Proposta {empresa} — alguma duvida?",
        body: "Ola,\n\nPassaram alguns dias desde que enviei a proposta para {empresa}. Gostaria de saber se surgiu alguma duvida ou se precisa de algum ajuste nos valores ou no escopo.\n\nEstou a disposicao para uma chamada rapida.\n\nAtenciosamente"
      },
      {
        stepIndex: 2,
        delayDays: 10,
        channel: "email",
        subject: "Ultima oportunidade — {empresa}",
        body: "Ola,\n\nEstou encerrando o prazo da proposta enviada para {empresa}. Caso queira reativar, e so entrar em contato.\n\nAtenciosamente"
      }
    ]
  },
  {
    id: "reengagement",
    name: "Reengajamento",
    description: "2 toques para leads que pararam de responder",
    steps: [
      {
        stepIndex: 0,
        delayDays: 7,
        channel: "whatsapp",
        body: "Ola! Passaram alguns dias desde nosso ultimo contato sobre {empresa}. Ainda tem interesse em conhecer nossa solucao de trafego pago?"
      },
      {
        stepIndex: 1,
        delayDays: 30,
        channel: "email",
        subject: "Novidades para {empresa}",
        body: "Ola,\n\nFaz um tempo desde nosso ultimo contato. O mercado de {categoria} esta cada vez mais competitivo no digital, e queríamos compartilhar um case recente.\n\nPodemos retomar nossa conversa?\n\nAtenciosamente"
      }
    ]
  }
];

const instances = new Map<string, SequenceInstance>();

function instanceId(): string {
  return `seq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nextStepDate(delayDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + delayDays);
  return d.toISOString();
}

function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export function activateSequence(
  companyId: string,
  companyName: string,
  templateId: string,
  companyEmail?: string
): SequenceInstance {
  const template = SEQUENCE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const firstStep = template.steps[0];
  const id = instanceId();
  const instance: SequenceInstance = {
    id,
    companyId,
    companyName,
    companyEmail,
    templateId,
    templateName: template.name,
    activatedAt: new Date().toISOString(),
    currentStep: 0,
    nextStepAt: firstStep ? nextStepDate(firstStep.delayDays) : null,
    completedSteps: [],
    status: "active"
  };
  instances.set(id, instance);
  return instance;
}

export function getInstancesByCompany(companyId: string): SequenceInstance[] {
  return [...instances.values()].filter((i) => i.companyId === companyId);
}

export function listInstances(): SequenceInstance[] {
  return [...instances.values()];
}

export function cancelInstance(instanceId: string): boolean {
  const inst = instances.get(instanceId);
  if (!inst) return false;
  inst.status = "cancelled";
  return true;
}

export function getDueInstances(): Array<{ instance: SequenceInstance; step: SequenceStep }> {
  const now = Date.now();
  const due: Array<{ instance: SequenceInstance; step: SequenceStep }> = [];
  for (const inst of instances.values()) {
    if (inst.status !== "active" || !inst.nextStepAt) continue;
    if (new Date(inst.nextStepAt).getTime() > now) continue;
    const template = SEQUENCE_TEMPLATES.find((t) => t.id === inst.templateId);
    const step = template?.steps[inst.currentStep];
    if (step) due.push({ instance: inst, step });
  }
  return due;
}

export function advanceInstance(instanceId: string): void {
  const inst = instances.get(instanceId);
  if (!inst) return;
  const template = SEQUENCE_TEMPLATES.find((t) => t.id === inst.templateId);
  if (!template) return;

  inst.completedSteps.push(inst.currentStep);
  inst.currentStep += 1;

  const nextStep = template.steps[inst.currentStep];
  if (nextStep) {
    inst.nextStepAt = nextStepDate(nextStep.delayDays);
  } else {
    inst.status = "completed";
    inst.nextStepAt = null;
  }
}

let smtpTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) return null;
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass }
    });
  }
  return smtpTransporter;
}

export async function sendSequenceEmail(
  to: string,
  step: SequenceStep,
  vars: Record<string, string>
): Promise<{ sent: boolean; reason?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: "SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS" };
  }
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: fillTemplate(step.subject ?? "Contato comercial", vars),
    text: fillTemplate(step.body, vars)
  });
  return { sent: true };
}

// Run due sequence steps — call periodically from server
export async function processDueSteps(): Promise<void> {
  const due = getDueInstances();
  for (const { instance, step } of due) {
    if (step.channel === "email") {
      const recipient = instance.companyEmail;
      if (!recipient) {
        console.warn(`[sequences] email step skipped for ${instance.companyName}: lead has no email.`);
      } else {
        const result = await sendAutomationEmail({
          to: recipient,
          subject: fillTemplate(step.subject ?? "Contato comercial", { empresa: instance.companyName }),
          body: fillTemplate(step.body, { empresa: instance.companyName })
        });
        console.log(`[sequences] email step ${step.stepIndex} for ${instance.companyName}: ${result.sent ? "sent" : result.reason}`);
      }
    }
    advanceInstance(instance.id);
    console.log(`[sequences] processed step ${step.stepIndex} (${step.channel}) for ${instance.companyName}`);
  }
}
