import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AppContent from "./app-content";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return <AppContent user={user} />;
}
