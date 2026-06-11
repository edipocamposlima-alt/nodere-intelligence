import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5500000000000";

  return (
    <a
      className="site-whatsapp"
      href={`https://wa.me/${number}?text=${encodeURIComponent("Olá! Quero conhecer o NODERE Nexus.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com NODERE Nexus no WhatsApp"
    >
      <MessageCircle size={24} />
    </a>
  );
}
