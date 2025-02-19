import { Router, Request, Response } from "express";
import { getHome } from "../controllers/homeController";
import {
  startStream,
  stopStream,
  getStatus,
  getLatestImage,
} from "../controllers/streamController";
import UsbCameraService from "../services/UsbCameraService";
import { spawn } from "child_process";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Home
 *     description: Returns a welcome message
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/", getHome);

/**
 * @swagger
 * /start:
 *   post:
 *     summary: Start capturing images
 *     description: Captures an image every 3 seconds
 *     responses:
 *       200:
 *         description: Capture started
 *       400:
 *         description: Capture is already running
 */
router.post("/start", startStream);
router.get("/start", startStream);

/**
 * @swagger
 * /stop:
 *   post:
 *     summary: Stop capturing images
 *     description: Stops the capture process
 *     responses:
 *       200:
 *         description: Capture stopped
 *       400:
 *         description: No capture is currently running
 */
router.post("/stop", stopStream);

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Get capture status
 *     description: Returns whether FFmpeg is capturing images
 *     responses:
 *       200:
 *         description: Status of the capture
 */
router.get("/status", getStatus);

/**
 * @swagger
 * /image:
 *   get:
 *     summary: Get latest captured image
 *     description: Retrieves the most recent image
 *     responses:
 *       200:
 *         description: Image retrieved
 *       404:
 *         description: No image available
 */
router.get("/image", getLatestImage);

router.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "multipart/x-mixed-replace; boundary=frame");

  const ffmpegArgs = [
    "-f",
    "v4l2",
    "-i",
    UsbCameraService.getCameraDevice() || "/dev/video0",
    "-f",
    "mjpeg",
    "pipe:1",
  ];

  const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

  ffmpegProcess.stdout.on("data", (chunk) => {
    res.write(`--frame\r\nContent-Type: image/jpeg\r\n\r\n`);
    res.write(chunk);
    res.write("\r\n");
  });

  ffmpegProcess.stderr.on("data", (data) => {
    console.error("FFmpeg error:", data.toString());
  });

  req.on("close", () => {
    ffmpegProcess.kill();
  });
});

export default router;
