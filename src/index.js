import "dotenv/config";
import { serve } from "./server.js";

const PORT = process.env.PORT;
const MEDIA_DIR = process.env.MEDIA_DIR;

let error = false;
if (!PORT) {
  console.error("Missing configuration: PORT");
  error = true;
}

if (!MEDIA_DIR) {
  console.error("Missing configuration: MEDIA_DIR");
  error = true;
}

if (!error) {
  console.log("Running media server with config: ");
  console.log("Port:", PORT);
  console.log("Media Folder:", MEDIA_DIR);

  await serve(PORT, MEDIA_DIR);
}
