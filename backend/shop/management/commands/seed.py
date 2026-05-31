from django.core.management.base import BaseCommand

from shop.models import Product


PRODUCTS = [
    {
        "title": "Premium Agarbatti Set",
        "price": 120,
        "stock": 42,
        "category": "PUJA",
        "image": "https://images.unsplash.com/photo-1605370215750-60b64bead865?auto=format&fit=crop&w=600&q=80",
        "description": "Hand-rolled natural incense sticks for daily prayers.",
    },
    {
        "title": "Brass Diya",
        "price": 450,
        "stock": 18,
        "category": "PUJA",
        "image": "https://images.unsplash.com/photo-1603792984594-e5932a93322a?auto=format&fit=crop&w=600&q=80",
        "description": "Traditional heavy brass oil lamp.",
    },
    {
        "title": "Running Sneakers",
        "price": 2500,
        "stock": 24,
        "category": "SHOES",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        "description": "Lightweight, breathable sports shoes.",
    },
    {
        "title": "Leather Loafers",
        "price": 3200,
        "stock": 12,
        "category": "SHOES",
        "image": "https://images.unsplash.com/photo-1614252339460-e17631cc71ce?auto=format&fit=crop&w=600&q=80",
        "description": "Premium leather formal loafers.",
    },
    {
        "title": "Cotton Kurta Set",
        "price": 1800,
        "stock": 30,
        "category": "KAPRA",
        "image": "https://images.unsplash.com/photo-1583391733959-f18305f63969?auto=format&fit=crop&w=600&q=80",
        "description": "Comfortable pure cotton traditional wear.",
    },
    {
        "title": "Designer Saree",
        "price": 5500,
        "stock": 5,
        "category": "KAPRA",
        "image": "https://images.unsplash.com/photo-1610189013233-0498175d654a?auto=format&fit=crop&w=600&q=80",
        "description": "Elegant silk saree with intricate embroidery.",
    },
    {
        "title": "Bridal Makeup Kit",
        "price": 4200,
        "stock": 15,
        "category": "SHRINGAR",
        "image": "https://images.unsplash.com/photo-1522337360788-8b13fee7a328?auto=format&fit=crop&w=600&q=80",
        "description": "Complete cosmetic set for special occasions.",
    },
    {
        "title": "Gold-Plated Bangles",
        "price": 850,
        "stock": 36,
        "category": "SHRINGAR",
        "image": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80",
        "description": "Beautiful ethnic bangles for daily or party wear.",
    },
]


class Command(BaseCommand):
    help = "Seed demo products."

    def handle(self, *args, **options):
        for data in PRODUCTS:
            Product.objects.update_or_create(title=data["title"], defaults=data)

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(PRODUCTS)} products."))
