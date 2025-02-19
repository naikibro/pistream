import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { HLS_OUTPUT_DIR } from "../server";
import UsbCameraService from "../services/UsbCameraService";

let ffmpegProcess: ChildProcessWithoutNullStreams | null = null;

/**
 * POST /start
 * Starts streaming from the USB camera or falls back to color bars.
 */
export function startStream(req: Request, res: Response) {
  if (ffmpegProcess) {
    return res.status(400).json({ error: "Stream is already running" });
  }

  const cameraDevice = UsbCameraService.getCameraDevice();
  let inputSource: string;
  let inputFormat: string;
  let ffmpegArgs: string[];

  if (cameraDevice) {
    if (os.platform() === "darwin") {
      inputFormat = "avfoundation";
      inputSource = cameraDevice;
      ffmpegArgs = ["-framerate", "30"];
    } else {
      inputFormat = "v4l2";
      inputSource = cameraDevice;
      ffmpegArgs = [
        "-video_size",
        "640x480",
        "-framerate",
        "30",
        "-input_format",
        "yuyv422",
      ];
    }
  } else {
    inputFormat = "lavfi";
    inputSource = "testsrc=size=640x480:rate=30";
    ffmpegArgs = [];
  }

  console.log(
    `🎥 Streaming from: ${
      cameraDevice ? `Camera (${inputSource})` : "Test Pattern"
    }`
  );

  ffmpegArgs.push(
    "-y",
    "-f",
    inputFormat,
    "-i",
    inputSource,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-tune",
    "zerolatency",
    "-profile:v",
    "baseline",
    "-level",
    "3.0",
    "-pix_fmt",
    "yuv420p",
    "-hls_time",
    "2",
    "-hls_list_size",
    "15",
    "-hls_flags",
    "append_list+delete_segments",
    "-start_number",
    "1",
    "-hls_segment_filename",
    path.join(HLS_OUTPUT_DIR, "segment_%d.ts"),
    path.join(HLS_OUTPUT_DIR, "index.m3u8")
  );

  ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

  ffmpegProcess.stderr.on("data", (data) => {
    console.log(`[FFmpeg] ${data.toString()}`);
  });

  ffmpegProcess.on("error", (err) => {
    console.error("❌ FFmpeg failed to start:", err);
  });

  ffmpegProcess.on("close", (code) => {
    console.log(`[FFmpeg] Process exited with code ${code}`);
    ffmpegProcess = null;
  });

  return res.json({ message: "🎥 Stream started." });
}

/**
 * POST /stop
 * Stops the current stream.
 */
export function stopStream(req: Request, res: Response) {
  if (!ffmpegProcess) {
    return res.status(400).json({ error: "No stream is currently running" });
  }

  ffmpegProcess.kill("SIGINT");
  ffmpegProcess = null;
  console.log("🛑 Stream stopped.");

  return res.json({ message: "🛑 Stream stopped." });
}

/**
 * GET /status
 * Returns the current stream status.
 */
export function getStatus(req: Request, res: Response) {
  return res.json({ status: ffmpegProcess ? "running" : "stopped" });
}

/**
 * GET /image
 * Returns the latest captured image.
 */
export function getLatestImage(req: Request, res: Response) {
  const imagePath = path.join(HLS_OUTPUT_DIR, "latest.jpg");

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "No image available yet" });
  }

  res.sendFile(imagePath);
}
