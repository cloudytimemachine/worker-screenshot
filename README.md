# worker-screenshot microservice

Before doing anything, run `make minikube`.

This launches minikube and then prompts with a line to copy/paste:

```
eval $$(minikube docker-env) && export DOCKER_API_VERSION=1.23
```

To build and then deploy this service to your minikube, run:

```
make minikube-create
```

If you make changes, build & deploy them with

```
make minikube-update
```

## HTTP API

### GET /version
Returns the current version string (from package.json)

### GET /healthz
Returns 200 with no content if healthy
Returns 500 with error message if not healthy

### GET /?url=https://github.com/rosskukulinski

Requests a new screenshot of the specified page.  The png image
is uploaded to Google Storage Engine and the public URL is returned
along with the timestamp.
