FROM node:lts-alpine
WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

COPY . .

CMD ["yarn", "run", "start", "-H", "0.0.0.0"]
