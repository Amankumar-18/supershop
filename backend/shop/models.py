from django.db import models


class Product(models.Model):
    class Category(models.TextChoices):
        PUJA = "PUJA", "Puja Saman"
        SHOES = "SHOES", "Shoes Shop"
        KAPRA = "KAPRA", "Kapra Shop"
        SHRINGAR = "SHRINGAR", "Shringar Shop"

    title = models.CharField(max_length=160)
    price = models.PositiveIntegerField()
    stock = models.PositiveIntegerField(default=10)
    category = models.CharField(max_length=20, choices=Category.choices)
    image = models.URLField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "price": self.price,
            "stock": self.stock,
            "category": self.category,
            "image": self.image,
            "description": self.description,
        }
