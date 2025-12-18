FROM alpine:3.18
RUN apk add --no-cache bash
COPY ./smoke-entry.sh /usr/local/bin/smoke-entry.sh
RUN chmod +x /usr/local/bin/smoke-entry.sh
CMD ["/usr/local/bin/smoke-entry.sh"]
