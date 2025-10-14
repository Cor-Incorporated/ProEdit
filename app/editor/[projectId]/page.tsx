import { redirect } from "next/navigation";
import { getUser } from "@/app/actions/auth";
import { getProject } from "@/app/actions/projects";
import { EditorClient } from "./EditorClient";

interface EditorPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    redirect("/");
  }

  // Server Component delegates to Client Component for UI
  return <EditorClient project={project} />;
}
