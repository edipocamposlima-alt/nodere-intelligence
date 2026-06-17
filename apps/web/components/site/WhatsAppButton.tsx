import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000";

  return (
    <a
      className="site-whatsapp"
      href={`https://wa.me/${number}?text=${encodeURIComponent("Olá! Quero saber mais sobre o NODERI Nexus.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com NODERI Nexus no WhatsApp"
    >
      <MessageCircle size={24} />
    </a>
  );
}
