# Dockerfile
FROM node:18-bullseye AS dev

WORKDIR /usr/src/app
COPY ["vending-ui/package.json", "vending-ui/package-lock.json*", "vending-ui/npm-shrinkwrap.json*", "vending-ui/yarn.lock", "./"]
RUN yarn
COPY ./vending-ui .

ARG REDIS_URL=${REDIS_URL}
ENV REDIS_URL=${REDIS_URL}
RUN echo $REDIS_URL
RUN yarn build

ENV STRIPE_KEY=${STRIPE_KEY}
ENV GOOGLE_ID=${GOOGLE_ID}
ENV GOOGLE_SECRET=${GOOGLE_SECRET}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV API_KEY=${API_KEY}
ENV ALLOWED_EMAILS=${ALLOWED_EMAILS}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV DISCORD_COMMUNITY_WEBHOOK=${DISCORD_COMMUNITY_WEBHOOK}
ENV DISCORD_WEBHOOK=${DISCORD_WEBHOOK}

EXPOSE 3000
CMD ["node", "build"]
