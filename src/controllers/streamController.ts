import { spawn } from "child_process";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { HLS_OUTPUT_DIR } from "../server";

let captureInterval: NodeJS.Timeout | null = null;
let frameCounter = 0;

/**
 * POST /start
 * Captures **one image every 3 seconds** with an incrementing frame counter.
 */
export function startStream(req: Request, res: Response) {
  if (captureInterval) {
    return res.status(400).json({ error: "Capture is already running" });
  }

  console.log("📸 Starting image capture every 3 seconds...");

  fs.readdirSync(HLS_OUTPUT_DIR).forEach((file) => {
    if (file.endsWith(".jpg")) {
      fs.unlinkSync(path.join(HLS_OUTPUT_DIR, file));
    }
  });

  const captureImage = () => {
    frameCounter++;

    const tempImagePath = path.join(HLS_OUTPUT_DIR, "temp.jpg");
    const finalImagePath = path.join(HLS_OUTPUT_DIR, "latest.jpg");
    console.log(`📷 Capturing a new image... Frame: ${frameCounter}`);

    const ffmpegArgs = [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc=size=640x480:rate=1",
      "-frames:v",
      "1",
      "-q:v",
      "2",
      "-vf",
      `drawtext=text='Frame\\: ${frameCounter}': fontcolor=white: fontsize=48: x=50: y=50`,
      tempImagePath,
    ];

    const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

    ffmpegProcess.stderr.on("data", (data) => {
      console.log(`[FFmpeg] ${data}`);
    });

    ffmpegProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`❌ FFmpeg process exited with code ${code}`);
      } else {
        try {
          if (fs.existsSync(tempImagePath)) {
            fs.renameSync(tempImagePath, finalImagePath);
            console.log("✅ Image updated successfully with frame counter!");
          }
        } catch (error) {
          console.error("❌ Failed to update latest.jpg:", error);
        }
      }
    });
  };

  captureImage();
  captureInterval = setInterval(captureImage, 3000);

  return res.json({
    message:
      "📸 Capturing an image every 3 seconds with an incrementing number.",
  });
}

/**
 * POST /stop
 * Stops capturing images.
 */
export function stopStream(req: Request, res: Response) {
  if (!captureInterval) {
    return res.status(400).json({ error: "No capture is currently running" });
  }

  clearInterval(captureInterval);
  captureInterval = null;
  console.log("🛑 Image capture stopped.");
  frameCounter = 0;

  return res.json({ message: "🛑 Image capture stopped." });
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

/**
 * GET /status
 * Returns whether FFmpeg is capturing images or not.
 */
export function getStatus(req: Request, res: Response) {
  return res.json({ status: captureInterval ? "capturing" : "stopped" });
}
