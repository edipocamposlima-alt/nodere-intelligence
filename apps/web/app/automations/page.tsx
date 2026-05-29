import { CalendarDays, CheckCircle, Mail, MessageCircle, Workflow, XCircle } from "lucide-react";
import { getSequenceTemplates, getSequenceInstances } from "@/lib/api";
import { ActivateSequenceButton } from "./ActivateSequenceButton";
import { CancelSequenceButton } from "./CancelSequenceButton";

const CHANNEL_ICON: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  email: Mail
};

export default async function AutomationsPage() {
  const [templates, instances] = await Promise.all([
    getSequenceTemplates().catch(() => []),
    getSequenceInstances().catch(() => [])
  ]);

  const active = instances.filter((i: any) => i.status === "active");
  const completed = instances.filter((i: any) => i.status === "completed");
  const cancelled = instances.filter((i: any) => i.status === "cancelled");

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Automações</h2>
        <p className="mt-1 text-sm text-slate-400">Sequências de email e WhatsApp por empresa</p>
      </div>

      {/* Templates */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Workflow className="h-4 w-4 text-cyan" />
          Templates disponíveis
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl: any) => (
            <div key={tpl.id} className="rounded-lg border border-line bg-panel/90 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{tpl.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{tpl.description}</p>
                </div>
                <span className="rounded-full bg-electric/20 px-2 py-0.5 text-[10px] text-blue-300">
                  {tpl.steps.length} steps
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {tpl.steps.map((step: any) => {
                  const Icon = CHANNEL_ICON[step.channel] ?? Mail;
                  return (
                    <div key={step.stepIndex} className="flex items-center gap-2 text-xs text-slate-400">
                      <Icon className="h-3 w-3 flex-shrink-0 text-cyan" />
                      <span className="text-slate-500">Dia {step.delayDays}:</span>
                      <span className="truncate">{step.subject ?? step.body.slice(0, 40) + "…"}</span>
                    </div>
                  );
                })}
              </div>

              <ActivateSequenceButton templateId={tpl.id} templateName={tpl.name} />
            </div>
          ))}
        </div>
      </section>

      {/* Active instances */}
      <section className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <CalendarDays className="h-4 w-4 text-cyan" />
          Sequências ativas
          <span className="rounded-full bg-electric/20 px-2 py-0.5 text-[10px] text-blue-300">{active.length}</span>
        </h3>
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma sequência ativa. Ative um template acima para começar.</p>
        ) : (
          <div className="space-y-3">
            {active.map((inst: any) => (
              <InstanceRow key={inst.id} inst={inst} showCancel />
            ))}
          </div>
        )}
      </section>

      {/* Completed + cancelled */}
      {(completed.length > 0 || cancelled.length > 0) && (
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Histórico</h3>
          <div className="space-y-3">
            {[...completed, ...cancelled].map((inst: any) => (
              <InstanceRow key={inst.id} inst={inst} showCancel={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InstanceRow({ inst, showCancel }: { inst: any; showCancel: boolean }) {
  const statusIcon = {
    active: <CalendarDays className="h-4 w-4 text-blue-400" />,
    completed: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    cancelled: <XCircle className="h-4 w-4 text-red-400" />
  }[inst.status as string] ?? null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-panel/90 px-4 py-3">
      <div className="flex items-center gap-3">
        {statusIcon}
        <div>
          <p className="text-sm font-medium text-white">{inst.companyName}</p>
          <p className="text-xs text-slate-500">{inst.templateName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>Step {inst.currentStep + 1}</span>
        {inst.nextStepAt && (
          <span>
            Próximo: {new Date(inst.nextStepAt).toLocaleDateString("pt-BR")}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {inst.completedSteps.length} concluídos
        </span>
        {showCancel && <CancelSequenceButton instanceId={inst.id} />}
      </div>
    </div>
  );
}
