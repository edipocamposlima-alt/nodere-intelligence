"use client";

import { FormEvent, useState } from "react";
import { getDirectApiBaseUrl } from "@/lib/apiBase";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan_interest: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setNotice("");
    try {
      const response = await fetch(`${getDirectApiBaseUrl()}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || "Erro ao enviar mensagem.");
      setStatus("sent");
      setNotice(data.message || "Mensagem enviada. Retornaremos em breve!");
      setForm({ name: "", email: "", phone: "", plan_interest: "", message: "" });
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "Erro ao enviar mensagem. Tente novamente.");
    }
  }

  return (
    <form className="site-contact-form" onSubmit={submit}>
      <label>
        <span>Nome</span>
        <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
      </label>
      <label>
        <span>E-mail</span>
        <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
      </label>
      <label>
        <span>Telefone</span>
        <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
      </label>
      <label>
        <span>Plano de interesse</span>
        <select value={form.plan_interest} onChange={(event) => setForm((current) => ({ ...current, plan_interest: event.target.value }))}>
          <option value="">Selecionar depois</option>
          <option value="Starter">Starter</option>
          <option value="Pro">Pro</option>
          <option value="Agency">Agency</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </label>
      <label className="site-contact-form__wide">
        <span>Mensagem</span>
        <textarea required rows={5} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
      </label>
      {notice && <p className={`site-contact-form__notice ${status === "error" ? "is-error" : ""}`}>{notice}</p>}
      <button className="site-primary site-contact-form__wide" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
