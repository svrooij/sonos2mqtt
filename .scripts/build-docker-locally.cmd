docker buildx build --platform linux/arm/v7 --push -f .\Dockerfile -t svrooij/sonos2mqtt:ha-beta --build-arg BUILD_DATE=2022-03-22 --build-arg BUILD_VERSION=3.3.0-alpha .