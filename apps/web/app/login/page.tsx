import { LoginClient } from "./LoginClient";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-ink text-white">Carregando login...</main>}>
      <LoginClient />
    </Suspense>
  );
}
