export default function SettingsNotifications() {
  return (
    <div className="settings-section">
      <h2>Notificações</h2>
      <p className="settings-hint">Preferências de alertas comerciais, follow-ups e vencimento do trial.</p>
      <label className="check-row"><input type="checkbox" defaultChecked /> Alertar quando leads ficarem parados no funil</label>
      <label className="check-row"><input type="checkbox" defaultChecked /> Receber resumo diário de oportunidades</label>
    </div>
  );
}
