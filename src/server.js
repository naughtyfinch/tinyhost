import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import fs from "fs-extra";
import { customAlphabet } from "nanoid";
import { pipeline } from "node:stream";
import util from "node:util";
import axios from "axios";

const pump = util.promisify(pipeline);

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 14);

function getFilepath(fileExtension) {
  const id = nanoid();
  const filepath = path.join(
    id.substring(0, 2),
    id.substring(2, 4),
    id.substring(4)
  );

  return filepath + fileExtension;
}

export async function serve(port, mediaFolder) {
  const fastify = Fastify({
    logger: true,
  });

  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10737418240, // 10 GB
      files: 1,
    },
  });

  fastify.register(fastifyStatic, {
    root: mediaFolder,
    prefix: "/media/",
  });

  fastify.get("/health", async function (request, reply) {
    reply.send({
      service: "tinyhost",
      health: 1,
    });
  });

  fastify.post("/upload", async function (req, reply) {
    const data = await req.file();

    data.file; // stream
    data.fields; // other parsed parts
    data.fieldname;
    data.filename;
    data.encoding;
    data.mimetype;

    const extn = path.extname(data.filename);
    const filepath = getFilepath(extn);
    const absFilepath = path.join(mediaFolder, filepath);

    await fs.ensureDir(path.dirname(absFilepath));
    await pump(data.file, fs.createWriteStream(absFilepath));

    reply.send({
      path: filepath,
    });
  });

  fastify.post("/fetchFromUrl", async function (req, reply) {
    const { url } = req.body;

    const extn = path.extname(url);
    const filepath = getFilepath(extn);
    const absFilepath = path.join(mediaFolder, filepath);

    await fs.ensureDir(path.dirname(absFilepath));
    await downloadImage(url, absFilepath);

    reply.send({
      path: filepath,
    });
  });

  // Run the server!
  try {
    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

async function downloadImage(url, filepath) {
  const writer = fs.createWriteStream(filepath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}
