FROM node:16-alpine3.15 as build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY ./src ./src
RUN npm run build

FROM node:16-alpine3.15 as prod
ARG BUILD_DATE=unknown
ARG BUILD_VERSION=0.0.0-development
ARG VCS_REF=not-set
ENV SONOS2MQTT_RUNNING_IN_CONTAINER=true
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /usr/src/app/lib/*.js /usr/src/app/lib/
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.description="Connecting your sonos speakers to mqtt" \
      org.label-schema.name=sonos2mqtt \
      org.label-schema.schema-version=1.0 \
      org.label-schema.url=https://github.com/svrooij/sonos2mqtt/ \
      org.label-schema.version=$BUILD_VERSION \
      org.label-schema.vcs-ref=$VCS_REF
EXPOSE 6329
CMD ["node", "./lib/index.js"]
