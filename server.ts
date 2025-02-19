import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { Request, Response } from "express";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

// Where we'll store the HLS output files
const HLS_OUTPUT_DIR = path.join(__dirname, "hls");
if (!fs.existsSync(HLS_OUTPUT_DIR)) {
  fs.mkdirSync(HLS_OUTPUT_DIR);
}

app.get("/", (req, res) => {
  const localIp = process.env.LOCAL_IP || "localhost"; // fallback if not set

  // Construct an HTML string with the IP inserted
  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>HLS Test</title>
  </head>
  <body>
    <video id="video" controls autoplay></video>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <script>
      const video = document.getElementById("video");

      if (Hls.isSupported()) {
        const hls = new Hls();
        // Use the env var IP here
        hls.loadSource("http://${localIp}:3000/hls/index.m3u8");
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          video.play();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari fallback
        video.src = "http://${localIp}:3000/hls/index.m3u8";
      }
    </script>
  </body>
</html>
  `;

  // Send the constructed HTML to the browser
  res.send(htmlContent);
});

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

  // Clean out old segments
  fs.readdirSync(HLS_OUTPUT_DIR).forEach((file) => {
    fs.unlinkSync(path.join(HLS_OUTPUT_DIR, file));
  });

  // --------------------------------------------
  // Use testsrc for color bars instead of /dev/video0
  // --------------------------------------------
  const ffmpegArgs = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=640x480:rate=30",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-f",
    "hls",
    "-hls_time",
    "2",
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
    message: "HLS stream started. Now generating color bars in /hls folder.",
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
