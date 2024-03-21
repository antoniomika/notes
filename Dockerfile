FROM node:20-alpine
WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

CMD ["yarn", "run", "start", "-H", "0.0.0.0"]
