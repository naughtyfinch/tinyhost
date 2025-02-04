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
  app.use("/stream", express.static(getUploadsDir()));
  app.use(express.json());
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
  res.status(400).json(errors);
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

app.post("/delete", (req, res) => {
  const bucket = req.query.bucket;
  const filepath = req.query.filepath;
  if (!hasText(bucket))
    return createBadRequest(res, ["mandatory parameter 'bucket' is missing"]);
  if (!hasText(filepath))
    return createBadRequest(res, ["mandatory parameter 'filepath' is missing"]);
  const fullpath = path.join(getUploadsDir(), bucket, filepath);
  if (!fs.pathExistsSync(fullpath)) {
    res.status(404).send();
  } else {
    fs.rmSync(fullpath);
    res.end();
  }
});

app.post("/move", (req, res) => {
  const bucket = req.body.bucket;
  const source = req.body.source;
  const destination = req.body.destination;
  if (!hasText(bucket))
    return createBadRequest(res, ["mandatory parameter 'bucket' is missing"]);
  if (!hasText(source))
    return createBadRequest(res, ["mandatory parameter 'source' is missing"]);
  if (!hasText(destination))
    return createBadRequest(res, [
      "mandatory parameter 'destination' is missing",
    ]);
  const fullSourcePath = path.join(getUploadsDir(), bucket, source);
  const fullDestinationPath = path.join(getUploadsDir(), bucket, destination);
  if (!fs.pathExistsSync(fullSourcePath)) {
    res.status(404).send();
  } else if (fs.pathExistsSync(fullDestinationPath)) {
    createBadRequest(res, ["file already exists at destination"]);
  } else {
    fs.ensureDirSync(path.dirname(fullDestinationPath));
    fs.moveSync(fullSourcePath, fullDestinationPath);
    res.end();
  }
});

fs.ensureDirSync(getTempDir());
fs.ensureDirSync(getUploadsDir());

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
