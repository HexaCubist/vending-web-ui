# Dockerfile
FROM node:16.15.1 AS dev

WORKDIR /usr/src/app
COPY ["vending-ui/package.json", "vending-ui/package-lock.json*", "vending-ui/npm-shrinkwrap.json*", "vending-ui/yarn.lock", "./"]
RUN yarn
COPY ./vending-ui .

RUN yarn build

ENV STRIPE_KEY=$STRIPE_KEY
ENV REDIS_URL=$REDIS_URL

EXPOSE 3000
CMD ["node", "build"]
