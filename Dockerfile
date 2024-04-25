FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY ./src ./src

ENV PORT 3000
ENV MEDIA_DIR /data

EXPOSE 3000

CMD ["npm", "run", "serve"]