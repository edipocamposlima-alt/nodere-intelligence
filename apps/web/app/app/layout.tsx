import type { ReactNode } from "react";
import PlatformSidebar from "@/components/layout/Sidebar";
import PlatformTopbar from "@/components/layout/Topbar";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

export default function PlatformAppLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="app-shell">
        <PlatformSidebar />
        <div className="app-main">
          <PlatformTopbar />
          <main className="app-content">{children}</main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
