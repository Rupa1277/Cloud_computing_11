# Assignment 11: 3-microservice app, HTTP Load Balancer, MIG autoscaling
Services: web (React+nginx), product-service, order-service (cart+payment). See architecture.png.
Images: us-central1-docker.pkg.dev/<PROJECT>/shop-docker/{web,product,order}:v1
Load test: docker run --rm -p 8089:8089 -v "${PWD}/loadtest:/mnt/locust" locustio/locust -f /mnt/locust/locustfile.py --host http://<LB_IP>
