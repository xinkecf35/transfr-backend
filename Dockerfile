FROM node:10.15.3-alpine
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --no-cache --virtual deps \
  python \
  build-base \
  && npm install \
  && apk del deps

RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 8800
CMD npm start