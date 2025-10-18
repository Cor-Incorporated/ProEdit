import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExportJob } from "@/lib/export/server";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  try {
    const job = await getExportJob(jobId, user.id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("[RenderAPI] Failed to fetch job status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch job" },
      { status: 500 }
    );
  }
}
