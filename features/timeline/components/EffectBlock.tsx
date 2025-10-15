"use client";

import { deleteEffect } from "@/app/actions/effects";
import { useTimelineStore } from "@/stores/timeline";
import { Effect, isAudioEffect, isImageEffect, isTextEffect, isVideoEffect } from "@/types/effects";
import { FileAudio, FileImage, FileVideo, Type, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { TrimHandles } from "./TrimHandles";

interface EffectBlockProps {
  effect: Effect;
}

export function EffectBlock({ effect }: EffectBlockProps) {
  const {
    zoom,
    selectedEffectIds,
    toggleEffectSelection,
    removeEffect,
    setDragging,
    trackCount,
    lockedTracks,
    snapEnabled,
    effects,
  } = useTimelineStore();
  const isTrackLocked = lockedTracks.includes(effect.track);
  const isSelected = selectedEffectIds.includes(effect.id);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({
    x: 0,
    y: 0,
    startAt: effect.start_at_position,
    track: effect.track,
  });

  // Calculate visual width based on duration and zoom
  // zoom = pixels per second, duration in ms
  const width = (effect.duration / 1000) * zoom;

  // Calculate left position based on start_at_position and zoom
  const left = (effect.start_at_position / 1000) * zoom;

  // Get color based on effect type
  const getColor = () => {
    if (isVideoEffect(effect)) return "bg-blue-500";
    if (isAudioEffect(effect)) return "bg-green-500";
    if (isImageEffect(effect)) return "bg-purple-500";
    if (isTextEffect(effect)) return "bg-yellow-500";
    return "bg-gray-500";
  };

  // Get icon based on effect type
  const getIcon = () => {
    if (isVideoEffect(effect)) return <FileVideo className="h-4 w-4" />;
    if (isAudioEffect(effect)) return <FileAudio className="h-4 w-4" />;
    if (isImageEffect(effect)) return <FileImage className="h-4 w-4" />;
    if (isTextEffect(effect)) return <Type className="h-4 w-4" />;
    return null;
  };

  // Get label
  const getLabel = (): string => {
    if (isVideoEffect(effect) || isImageEffect(effect) || isAudioEffect(effect)) {
      return effect.name || effect.media_file_id || "無題";
    }
    if (isTextEffect(effect)) {
      return effect.properties.text.substring(0, 20);
    }
    return "不明";
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      toggleEffectSelection(effect.id);
    }
  };

  // Delete handler
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    console.log("[EffectBlock] Delete button clicked for:", effect.id);

    try {
      await deleteEffect(effect.id);
      removeEffect(effect.id);
      toast.success("エフェクトを削除しました");
    } catch (error) {
      console.error("Failed to delete effect:", error);
      toast.error("エフェクトの削除に失敗しました");
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag on delete button or trim handles
    const target = e.target as HTMLElement;
    if (target.closest(".delete-button") || target.closest(".trim-handle")) {
      console.log("[EffectBlock] Ignoring mousedown on control element");
      e.stopPropagation();
      return;
    }

    if (isTrackLocked) {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    setIsDragging(false);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      startAt: effect.start_at_position,
      track: effect.track,
    };
    setDragging(true, effect.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartPos.current.x;
      const deltaY = moveEvent.clientY - dragStartPos.current.y;

      // If moved more than 5px, consider it a drag
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setIsDragging(true);
      }

      // Calculate new position (time) with optional snapping to neighbors (start/end boundaries)
      const deltaMs = (deltaX / zoom) * 1000;
      let newStartPosition = Math.max(0, dragStartPos.current.startAt + deltaMs);

      if (snapEnabled) {
        const frameMs = 1000 / 30; // fall back 30fps; could be store fps
        const snapThreshold = frameMs * 0.75;
        // Collect candidate times: neighbors' start or end on same track
        const trackNeighbors = effects.filter(
          (e) => e.track === effect.track && e.id !== effect.id
        );
        const candidates: number[] = [];
        trackNeighbors.forEach((n) => {
          candidates.push(n.start_at_position);
          candidates.push(n.start_at_position + n.duration);
        });
        // Snap if near
        let snapped = newStartPosition;
        for (const c of candidates) {
          if (Math.abs(newStartPosition - c) <= snapThreshold) {
            snapped = c;
            break;
          }
        }
        newStartPosition = Math.max(0, snapped);
      }

      // Calculate new track (vertical)
      const TRACK_HEIGHT = 48; // Must match TimelineTrack height
      const trackDelta = Math.round(deltaY / TRACK_HEIGHT);
      const newTrack = Math.max(
        0,
        Math.min(trackCount - 1, dragStartPos.current.track + trackDelta)
      ); // Dynamic track count
      if (lockedTracks.includes(newTrack)) {
        // prevent moving into locked track
        return;
      }

      // Update effect position (optimistic UI update)
      useTimelineStore.getState().updateEffect(effect.id, {
        start_at_position: newStartPosition,
        track: newTrack,
      });
    };

    const handleMouseUp = async () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setDragging(false);

      // Persist changes to database
      if (isDragging) {
        try {
          const { updateEffect: updateEffectAction } = await import("@/app/actions/effects");
          await updateEffectAction(effect.id, {
            start_at_position: effect.start_at_position,
            track: effect.track,
          });
        } catch (error) {
          console.error("Failed to persist drag:", error);
          toast.error("位置の保存に失敗しました");
          // Revert on error
          useTimelineStore.getState().updateEffect(effect.id, {
            start_at_position: dragStartPos.current.startAt,
            track: dragStartPos.current.track,
          });
        }
      }

      setTimeout(() => setIsDragging(false), 0);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`
        effect-block absolute h-10 rounded cursor-move
        flex items-center px-2 space-x-1
        transition-all hover:opacity-90
        ${getColor()}
        ${isSelected ? "ring-2 ring-white shadow-lg z-20" : "z-10"}
        ${isDragging ? "opacity-70 z-50" : ""}
        border border-black/20
      `}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 40)}px`, // Minimum 40px width for better visibility
        marginRight: "2px", // Small gap to prevent overlap
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title={`${effect.kind}: ${getLabel()}`}
    >
      {getIcon()}
      <span className="text-white text-xs truncate flex-1">{getLabel()}</span>

      {/* Delete button - shown when selected */}
      {isSelected && (
        <button
          className="delete-button ml-auto p-1 hover:bg-white/20 rounded transition-colors z-10 flex-shrink-0"
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          title="エフェクトを削除（クリックして削除）"
          type="button"
        >
          <X className="h-3 w-3 text-white pointer-events-none" />
        </button>
      )}

      {/* Phase 6: Trim handles */}
      <TrimHandles effect={effect} isSelected={isSelected} />
    </div>
  );
}
