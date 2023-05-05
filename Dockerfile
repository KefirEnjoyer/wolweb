# docker build -t wolweb .
FROM golang:1.14-alpine AS builder

LABEL org.label-schema.vcs-url="https://github.com/komarK0X/wolweb" \
      org.label-schema.url="https://github.com/komarK0X/wolweb/blob/master/README.md"

# Install Dependecies
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    git clone --branch address https://github.com/komarK0X/wolweb . && \
    go mod init wolweb && \
    go get -d github.com/gorilla/handlers && \
    go get -d github.com/gorilla/mux && \
    go get -d github.com/ilyakaznacheev/cleanenv

# Build Source Files
RUN go build -o wolweb . 

# Create 2nd Stage final image
FROM alpine
WORKDIR /wolweb
COPY --from=builder index.html .
COPY --from=builder wolweb .
COPY --from=builder devices.json .
COPY --from=builder config.json .
COPY --from=builder static ./static

ARG WOLWEBPORT=8089

CMD ["/wolweb/wolweb"]

EXPOSE ${WOLWEBPORT}
