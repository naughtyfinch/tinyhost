import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import { getTempDir, getUploadsDir, hasElements, hasText } from "./utils";
import fs from "fs-extra";

const port = process.env.PORT ?? 3000;

function createUploader() {
  const storage = multer.diskStorage({
    destination: getTempDir(),
    filename: function (_req, file, cb) {
      cb(null, getFilename(file));
    },
  });
  return multer({ storage });
}

function createApp() {
  const app = express();
  app.use(cors());
  app.options("*", cors());
  app.use("/stream", express.static(path.join(process.cwd(), "uploads")));
  return app;
}

function getValidUploadParams(body: any) {
  const { bucket, filepath } = body;
  const errors = [];
  if (!hasText(bucket)) {
    errors.push("mandatory parameter 'bucket' is missing");
  }
  const fp = hasText(filepath) ? filepath : "";
  return { errors, params: { bucket, filepath: fp } };
}

function getFilename(file: any) {
  return file ? file.originalname.toString() : null;
}

function createBadRequest(res: any, errors: string[]) {
  res.setHeader("Content-Type", "application/json");
  res.status(400).send(JSON.stringify(errors));
}

function getTempFilepath(filename: string) {
  return path.join(getTempDir(), filename);
}

function getUploadFilepath(bucket: string, filepath: string, filename: string) {
  return path.join(getUploadsDir(), bucket, filepath, filename);
}

const upload = createUploader();
const app = createApp();

app.post("/upload", upload.single("file"), (req, res) => {
  const filename = getFilename(req.file);
  if (!hasText(filename))
    return createBadRequest(res, ["mandatory parameter 'file' is missing"]);

  const tempPath = getTempFilepath(filename);
  try {
    const { errors, params } = getValidUploadParams(req.body);
    if (hasElements(errors)) return createBadRequest(res, errors);
    const finalPath = getUploadFilepath(
      params.bucket,
      params.filepath,
      filename
    );

    if (fs.pathExistsSync(finalPath))
      return createBadRequest(res, ["file already exists at destination"]);
    fs.moveSync(tempPath, finalPath);
    res.end();
  } finally {
    fs.removeSync(tempPath);
  }
});

fs.ensureDirSync(getTempDir());
fs.ensureDirSync(getUploadsDir());

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
