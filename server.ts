import express, { Request, Response } from "express";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());

// Where we'll store the HLS output files
const HLS_OUTPUT_DIR = path.join(__dirname, "hls");
if (!fs.existsSync(HLS_OUTPUT_DIR)) {
  fs.mkdirSync(HLS_OUTPUT_DIR);
}

// Track the FFmpeg child process globally
let ffmpegProcess: ChildProcessWithoutNullStreams | null = null;

/**
 * POST /start
 * Spawns FFmpeg to capture video from the Pi camera or a USB camera
 * and produce HLS segments in the "hls" folder.
 */
app.post("/start", (req: Request, res: Response) => {
  if (ffmpegProcess) {
    return res.status(400).json({ error: "Stream is already running" });
  }

  // Clean out old segments, if any
  fs.readdirSync(HLS_OUTPUT_DIR).forEach((file) => {
    fs.unlinkSync(path.join(HLS_OUTPUT_DIR, file));
  });

  // You can adjust the input depending on your camera setup:
  // - Official Pi camera (libcamera): "libcamera-vid" is not a direct FFmpeg input, so you might use v4l2 or pipe from libcamera.
  // - Older raspivid-based setups: you might pipe raspivid into ffmpeg.
  // - USB camera: usually /dev/video0 with v4l2.

  // This example uses /dev/video0 with hardware h264 encoding (if available).
  // If hardware encoding doesn't work on your Pi version, you can do '-c:v libx264'.
  const ffmpegArgs = [
    "-y", // Overwrite output
    "-f",
    "v4l2",
    "-i",
    "/dev/video0",
    // Encoding
    "-c:v",
    "h264_v4l2m2m", // or 'libx264' or 'omxh264' (older Pi) if needed
    // Output to HLS
    "-f",
    "hls",
    "-hls_time",
    "2", // 2-second segments
    "-hls_list_size",
    "5",
    "-hls_segment_filename",
    path.join(HLS_OUTPUT_DIR, "segment_%03d.ts"),
    path.join(HLS_OUTPUT_DIR, "index.m3u8"),
  ];

  ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

  ffmpegProcess.stderr.on("data", (data) => {
    console.log(`[FFmpeg] ${data}`);
  });

  ffmpegProcess.on("close", (code) => {
    console.log(`[FFmpeg] Process exited with code ${code}`);
    ffmpegProcess = null;
  });

  return res.json({
    message: "HLS stream started. Files are being generated in /hls folder.",
  });
});

/**
 * POST /stop
 * Kills the running FFmpeg process.
 */
app.post("/stop", (req: Request, res: Response) => {
  if (!ffmpegProcess) {
    return res.status(400).json({ error: "No stream is currently running" });
  }
  ffmpegProcess.kill("SIGINT");
  ffmpegProcess = null;
  return res.json({ message: "Stream stopped." });
});

/**
 * GET /status
 * Returns whether FFmpeg is running or not.
 */
app.get("/status", (req: Request, res: Response) => {
  if (ffmpegProcess) {
    res.json({ status: "running" });
  } else {
    res.json({ status: "stopped" });
  }
});

// Serve the HLS files as static content.
// So clients can request http://<PI_IP>:3000/hls/index.m3u8
app.use("/hls", express.static(HLS_OUTPUT_DIR));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
