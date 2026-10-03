import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { JoinShell } from "@/components/site/join-shell";
import { RegisterForm } from "./form";

export const metadata = { title: "Create your school", description: "Set up your school on EduSphere in a minute: create the principal account, then invite teachers and parents with secret links." };

export default async function RegisterSchool() {
  if (await getSession()) redirect("/dashboard");
  return (
    <JoinShell wide title="Create your school" sub="Set up your school and principal account. Next you’ll add classes, then invite teachers and parents with secret links.">
      <RegisterForm />
    </JoinShell>
  );
}
