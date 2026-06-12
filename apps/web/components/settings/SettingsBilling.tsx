import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function SettingsBilling() {
  const { workspace } = useWorkspace();
  const plan = workspace?.plan || workspace?.plano || "trial";

  return (
    <div className="settings-section">
      <h2>Plano e Billing</h2>
      <p className="settings-hint">Plano atual: <strong>{plan}</strong></p>
      <a href="/app/upgrade" className="btn-primary">Ver planos e fazer upgrade →</a>
    </div>
  );
}
