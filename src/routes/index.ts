import { Router } from "express";
import { getHome } from "../controllers/homeController";
import {
  startStream,
  stopStream,
  getStatus,
  getLatestImage,
} from "../controllers/streamController";

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

export default router;
