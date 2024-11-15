FROM node:lts-alpine

WORKDIR /workshift-svc

COPY . .

RUN npm ci --omit=dev && \
    rm -rf $(npm get cache)

ENTRYPOINT ["npm", "start"]