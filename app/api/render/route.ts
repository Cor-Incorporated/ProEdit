import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ExportQuality } from "@/features/export/types";
import { processExportJob } from "@/lib/export/server";

interface RenderRequestPayload {
  projectId?: string;
  quality?: ExportQuality;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as RenderRequestPayload;
  const projectId = body.projectId;
  const quality = body.quality ?? "1080p";

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  try {
    const { data: job, error: insertError } = await supabase
      .from("export_jobs")
      .insert({
        project_id: projectId,
        status: "pending",
        settings: { quality },
        progress: 0,
      })
      .select()
      .single();

    if (insertError || !job) {
      throw new Error(insertError?.message ?? "Failed to create export job");
    }

    const result = await processExportJob({
      supabase,
      jobId: job.id,
      projectId,
      userId: user.id,
      quality,
    });

    return NextResponse.json({
      jobId: job.id,
      downloadUrl: result.downloadUrl,
      filename: result.filename,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error("[RenderAPI] Export failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
