import { redirect } from "next/navigation";
import { getUser } from "@/app/actions/auth";
import { getProject } from "@/app/actions/projects";

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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 border-b border-border">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {project.settings.width}x{project.settings.height} • {project.settings.fps}fps
            </p>
          </div>
          <p className="text-muted-foreground max-w-md">
            Start by adding media files to your timeline
          </p>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="h-80 bg-background border-t border-border">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Timeline</p>
            <p className="text-xs text-muted-foreground/60">
              Media panel and timeline controls coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
