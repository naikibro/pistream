import { execSync } from "child_process";
import os from "os";

class UsbCameraService {
  private static instance: UsbCameraService;
  private cameraDevice: string | null = null;
  private fallbackEnabled: boolean = false;

  private constructor() {
    this.detectUsbCamera();
  }

  public static getInstance(): UsbCameraService {
    if (!UsbCameraService.instance) {
      UsbCameraService.instance = new UsbCameraService();
    }
    return UsbCameraService.instance;
  }

  private detectUsbCamera(): void {
    try {
      console.log("os.platform", os.platform());
      if (os.platform() === "darwin") {
        this.detectMacCamera();
      } else {
        this.detectLinuxCamera();
      }
    } catch (error) {
      console.error("❌ Error detecting camera:", (error as Error).message);
      this.enableFallback();
    }
  }

  private detectMacCamera(): void {
    try {
      execSync("which ffmpeg", { stdio: "ignore" });

      console.log("🔍 Running FFmpeg device detection...");
      const output = execSync(
        "ffmpeg -f avfoundation -list_devices true -i '' 2>&1",
        { encoding: "utf8" }
      );

      console.log("✅ FFmpeg Camera Detection Output:\n", output);

      if (output.includes("FaceTime HD Camera")) {
        this.cameraDevice = "0";
        console.log(`🎥 MacBook Camera detected at index ${this.cameraDevice}`);
        this.fallbackEnabled = false;
        return;
      }
    } catch (error) {
      console.error(
        "❌ FFmpeg camera detection error:",
        (error as Error).message
      );
    }

    this.enableFallback();
  }

  private detectLinuxCamera(): void {
    try {
      execSync("which v4l2-ctl", { stdio: "ignore" });

      console.log("🔍 Detecting USB Cameras...");
      const output = execSync("v4l2-ctl --list-devices", { encoding: "utf8" });

      console.log("✅ v4l2 Camera Detection Output:\n", output);

      const usbMatches = output.match(
        /NGS XPRESSCAM\d+.*\n\s+\/dev\/video\d+/g
      );
      if (usbMatches && usbMatches.length > 0) {
        const usbCameras = usbMatches.map(
          (match) => match.match(/\/dev\/video\d+/)![0]
        );
        this.cameraDevice = usbCameras[0];

        console.log(`🎥 USB Camera detected at: ${this.cameraDevice}`);
        this.fallbackEnabled = false;
        return;
      } else {
        console.warn("⚠️ No valid USB camera detected.");
      }
    } catch (error) {
      console.warn("⚠️ No camera detected on Linux.");
    }

    this.enableFallback();
  }

  public getCameraDevice(): string | null {
    return this.cameraDevice;
  }

  private enableFallback(): void {
    console.warn("⚠️ No camera detected. Falling back to test pattern.");
    this.cameraDevice = null;
    this.fallbackEnabled = true;
  }

  public isFallbackEnabled(): boolean {
    return this.fallbackEnabled;
  }
}

export default UsbCameraService.getInstance();
