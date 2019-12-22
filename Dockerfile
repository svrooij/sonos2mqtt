FROM node:current-alpine
ENV SONOS2MQTT_RUNNING_IN_CONTAINER=true
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 6326
CMD ["node", "./index.js"]