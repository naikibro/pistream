import { Request, Response } from "express";

export function getHome(req: Request, res: Response) {
  const localIp = process.env.LOCAL_IP;

  if (!localIp) {
    res.status(500).send("LOCAL_IP environment variable not set");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>HLS Test</title>
  </head>
  <body>
    <video id="video" controls></video>
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

  res.send(htmlContent);
}
