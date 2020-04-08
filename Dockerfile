FROM node:current-alpine as build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY ./src ./src
RUN npm run build

FROM node:current-alpine as prod
ENV SONOS2MQTT_RUNNING_IN_CONTAINER=true
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /usr/src/app/lib/*.js /usr/src/app/lib/
EXPOSE 6329
CMD ["node", "./lib/index.js"]
