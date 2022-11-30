# Repro code for graphql-sse issue #


### Contents ###
Contains two servers:
<br>a. `graphqlServer` a graphql server written using Netflix DGS that has a simple subscription that will emit a Stock update per second.
<br>This runs on port `4100`.

b. `stitching` a gateway layer ontop of the backend service using schema stitching. This will have multiple schemas but here for a minimal example we just have the service mentioned in a.<br>This runs on port 4200.

### Startup ###
Just run `./start.sh` this will start both the services in the background and show logs from both services on the console.

Hit Ctrl+C to exit and the script will kill both the services as well.

### Curl commands for subscriptions ####
This is the curl to the stitching layer.
```
curl 'http://localhost:4200/subscriptions' \
-H 'Connection: keep-alive' \
-H 'Content-Type: text/plain;charset=UTF-8' \
-H 'accept: text/event-stream' \
--data-raw '{"query":"subscription{stocks{name price}}","variables":{}}'

```

The above should produce errors in the stitching/gateway layer.

This the curl command that can be run against the graphqlServer.
```
curl 'http://localhost:4100/subscriptions' \
-H 'Connection: keep-alive' \
-H 'Content-Type: text/plain;charset=UTF-8' \
-H 'accept: text/event-stream' \
--data-raw '{"query":"subscription{stocks{name price}}","variables":{}}'
```

This should keep giving updates.
