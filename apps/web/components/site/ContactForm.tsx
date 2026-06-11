"use client";

import { FormEvent, useMemo, useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [sent, setSent] = useState(false);

  const mailto = useMemo(() => {
    const body = [
      `Nome: ${form.name}`,
      `E-mail: ${form.email}`,
      `Telefone: ${form.phone || "Não informado"}`,
      `Empresa: ${form.company || "Não informada"}`,
      "",
      form.message
    ].join("\n");
    return `mailto:comercial@nodere.com.br?subject=${encodeURIComponent("Contato pelo site NODERE Nexus")}&body=${encodeURIComponent(body)}`;
  }, [form]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.location.href = mailto;
    setSent(true);
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
        <span>Empresa</span>
        <input value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
      </label>
      <label className="site-contact-form__wide">
        <span>Mensagem</span>
        <textarea required rows={5} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
      </label>
      {sent && <p className="site-contact-form__notice">Seu aplicativo de e-mail foi aberto com a mensagem preenchida.</p>}
      <button className="site-primary site-contact-form__wide" type="submit">Enviar mensagem</button>
    </form>
  );
}
