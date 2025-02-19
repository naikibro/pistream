# pistream Backend

## Overview

The **pistream** backend is an Express-based API that captures an image every 3 seconds using FFmpeg and serves it via an endpoint. The captured image is continuously updated, and the API provides controls to start and stop the capture process.

## Features

- Capture an image every 3 seconds using **FFmpeg**
- Serve the latest image via an API endpoint
- Start and stop capture via HTTP requests
- API documentation using **Swagger/OpenAPI**
- Handles API connection issues with graceful error handling

## Prerequisites

Ensure you have the following installed:

- **Node.js** (>=16)
- **npm** (or **yarn**)
- **FFmpeg** (ensure it's installed and accessible in your system PATH)

### Installing FFmpeg

On macOS (Homebrew):

```sh
brew install ffmpeg
```

On Debian/Ubuntu:

```sh
sudo apt update && sudo apt install ffmpeg
```

On Windows:

- Download and install **FFmpeg** from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
- Add FFmpeg to the system `PATH`

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/pistream.git
   cd pistream
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create an `.env` file in the root directory:
   ```sh
   touch .env
   ```
   Add the following:
   ```env
   PORT=3000
   ```

## Running the Server

To start the server in development mode:

```sh
npm run dev
```

To start the server in production mode:

```sh
npm start
```

## API Endpoints

### 1. Start Image Capture

**POST** `/start`
Starts capturing an image every 3 seconds.

#### Response:

```json
{
  "message": "📸 Capturing an image every 3 seconds."
}
```

### 2. Stop Image Capture

**POST** `/stop`
Stops the image capture process.

#### Response:

```json
{
  "message": "🛑 Image capture stopped."
}
```

### 3. Get Capture Status

**GET** `/status`
Returns the current status of the image capture process.

#### Response:

```json
{
  "status": "capturing"
}
```

OR

```json
{
  "status": "stopped"
}
```

### 4. Get Latest Image

**GET** `/image`
Retrieves the most recent captured image.

#### Response:

- If an image exists, returns the image file
- If no image exists:

```json
{
  "error": "No image available yet"
}
```

## Swagger API Documentation

The API uses **Swagger/OpenAPI** for documentation.

To access the documentation, run the server and visit:

```
http://localhost:3000/api-docs
```

## Troubleshooting

### FFmpeg Not Found

Ensure FFmpeg is installed and added to your system `PATH`.
Check by running:

```sh
ffmpeg -version
```

### API Not Responding

- Ensure the backend is running (`npm run dev`)
- Check that no other process is using port `3000`
- Look for errors in the server logs

### Image Not Updating

- Ensure the backend logs show `Capturing a new image...`
- Try restarting the backend (`npm run dev`)
- Check file permissions in the `hls` folder

## License

This project is licensed under the MIT License.

## Author

Developed by **Naiki Brotherson**
