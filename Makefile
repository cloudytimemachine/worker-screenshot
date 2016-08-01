build:
	docker build -t quay.io/cloudytimemachine/worker-screenshot .

minikube:
	@minikube version
	@minikube status
	@minikube start
	@echo 'Copy/Paste the following command into your shell:'
	@echo 'eval $$(minikube docker-env) && export DOCKER_API_VERSION=1.23'
	@export DOCKER_API_VERSION=1.23

minikube-context:
	@kubectl config use-context minikube

minikube-create: minikube-context
	kubectl create -f kube/worker-screenshot.configmap.yml
	kubectl create -f kube/worker-screenshot.deployment.yml

minikube-delete: minikube-context
	kubectl delete -f ../infrastructure/secrets/gcloud-bucket.secret.yml
	kubectl delete -f kube/worker-screenshot.configmap.yml
	kubectl delete -f kube/worker-screenshot.deployment.yml

minikube-apply: minikube-context
	kubectl apply -f kube/worker-screenshot.configmap.yml
	kubectl apply -f kube/worker-screenshot.deployment.yml
	kubectl delete pod -l app=worker-screenshot

minikube-update: build minikube-apply
