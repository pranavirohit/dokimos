FROM --platform=linux/amd64 node:22-alpine

USER root

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 8080

CMD ["npx", "ts-node", "src/index.ts"]
