import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import routes from "./routes";
import { setupSwagger } from "./swagger";

const app = express();
app.use(express.json());
app.use(cors());

export const HLS_OUTPUT_DIR = path.join(__dirname, "..", "hls");
if (!fs.existsSync(HLS_OUTPUT_DIR)) {
  fs.mkdirSync(HLS_OUTPUT_DIR);
}
console.log("HLS", HLS_OUTPUT_DIR);
app.use("/hls", express.static(HLS_OUTPUT_DIR));

app.use("/", routes);
setupSwagger(app);
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
