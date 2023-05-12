# docker build -t wolweb .
FROM golang:1.19-alpine AS builder

RUN mkdir /wolweb
WORKDIR /wolweb

LABEL org.label-schema.vcs-url="https://github.com/komarK0X/wolweb" \
      org.label-schema.url="https://github.com/komarK0X/wolweb/blob/master/README.md"

# Install Dependecies
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    git clone --branch rebuild https://github.com/komarK0X/wolweb . && \
    go mod init wolweb && \
    go get -d github.com/gorilla/handlers && \
    go get -d github.com/gorilla/mux && \
    go get -d github.com/ilyakaznacheev/cleanenv

# Build Source Files
RUN go build -o wolweb . 

# Create 2nd Stage final image
FROM alpine
WORKDIR /wolweb
COPY --from=builder /wolweb/index.html .
COPY --from=builder /wolweb/wolweb .
COPY --from=builder /wolweb/devices.json .
COPY --from=builder /wolweb/config.json .
COPY --from=builder /wolweb/static ./static

ARG WOLWEBPORT=8089

CMD ["/wolweb/wolweb"]

EXPOSE ${WOLWEBPORT}
