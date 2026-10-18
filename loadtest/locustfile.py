from locust import HttpUser, task, between

class Shopper(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(6)
    def heavy(self):            # CPU-heavy product request -> drives CPU past 60%
        self.client.get("/api/products/stress")

    @task(2)
    def products(self):
        self.client.get("/api/products")

    @task(1)
    def home(self):
        self.client.get("/")

    @task(1)
    def cart(self):
        self.client.get("/api/cart")
