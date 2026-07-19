import { notFound } from "next/navigation";
import { getAdminLoginKey } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;

  // Hide the login page from anyone without the secret key.
  if (!key || key !== getAdminLoginKey()) {
    notFound();
  }

  return <AdminLoginForm />;
}
