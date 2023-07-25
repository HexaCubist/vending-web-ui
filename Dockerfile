# Dockerfile
FROM node:16.15.1 AS dev

WORKDIR /usr/src/app
COPY ["vending-ui/package.json", "vending-ui/package-lock.json*", "vending-ui/npm-shrinkwrap.json*", "vending-ui/yarn.lock", "./"]
RUN yarn
COPY ./vending-ui .

ARG REDIS_URL=$REDIS_URL
RUN yarn build

ENV STRIPE_KEY=$STRIPE_KEY
ENV GOOGLE_ID=$GOOGLE_ID
ENV GOOGLE_SECRET=$GOOGLE_SECRET
ENV AUTH_SECRET=$AUTH_SECRET
ENV API_KEY=$API_KEY
ENV ALLOWED_EMAILS=$ALLOWED_EMAILS

EXPOSE 3000
CMD ["node", "build"]
