import UpgradeScreen from "@/components/layout/UpgradeScreen";

export default async function UpgradePage({ searchParams }: { searchParams?: Promise<{ module?: string }> }) {
  const params = await searchParams;
  return <UpgradeScreen moduleCode={params?.module} />;
}
