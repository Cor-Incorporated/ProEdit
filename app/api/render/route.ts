import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ExportQuality } from "@/features/export/types";
import { enqueueExportJob, MAX_CONCURRENT_EXPORTS, MAX_CONCURRENT_EXPORTS_PER_USER } from "@/lib/export/queue";

export const runtime = "nodejs";

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
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError) {
      throw new Error(projectError.message);
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { count: userActiveCount, error: userCountError } = await supabase
      .from("export_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"]);

    if (userCountError) {
      throw new Error(userCountError.message);
    }

    if ((userActiveCount ?? 0) >= MAX_CONCURRENT_EXPORTS_PER_USER) {
      return NextResponse.json({ error: "Too many concurrent exports" }, { status: 429 });
    }

    const { count: totalActiveCount, error: totalCountError } = await supabase
      .from("export_jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing"]);

    if (totalCountError) {
      throw new Error(totalCountError.message);
    }

    if ((totalActiveCount ?? 0) >= MAX_CONCURRENT_EXPORTS) {
      return NextResponse.json({ error: "Export service is busy" }, { status: 429 });
    }

    const { data: job, error: insertError } = await supabase
      .from("export_jobs")
      .insert({
        project_id: projectId,
        user_id: user.id,
        status: "pending",
        settings: { quality },
        progress: 0,
      })
      .select()
      .single();

    if (insertError || !job) {
      throw new Error(insertError?.message ?? "Failed to create export job");
    }

    enqueueExportJob({
      jobId: job.id,
      userId: user.id,
      projectId,
      quality,
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error("[RenderAPI] Failed to enqueue export:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export request failed" },
      { status: 500 }
    );
  }
}
