import json
import uuid

from django.db import transaction
from django.http import JsonResponse
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Product


def health(request):
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    payload = json.loads(request.body or "{}")
    email = payload.get("email")
    password = payload.get("password")

    accounts = {
        ("admin@shop.com", "admin"): "ADMIN",
        ("user@shop.com", "user"): "USER",
    }
    role = accounts.get((email, password))

    if not role:
        return JsonResponse({"message": "Invalid credentials"}, status=401)

    return JsonResponse({"email": email, "role": role, "token": role.lower()})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def products(request):
    if request.method == "GET":
        category = request.GET.get("category")
        search = request.GET.get("search", "").strip()
        queryset = Product.objects.all()

        if request.headers.get("X-Demo-Role") != "ADMIN":
            queryset = queryset.filter(stock__gt=0)

        if category and category != "ALL":
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(description__icontains=search)

        return JsonResponse({"products": [product.to_dict() for product in queryset.distinct()]})

    if request.headers.get("X-Demo-Role") != "ADMIN":
        return JsonResponse({"message": "Admin access required"}, status=403)

    payload = json.loads(request.body or "{}")
    product = Product.objects.create(
        title=payload["title"],
        price=int(payload["price"]),
        stock=int(payload.get("stock", 10)),
        category=payload["category"],
        image=payload["image"],
        description=payload["description"],
    )
    return JsonResponse({"product": product.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def upload_product_image(request):
    if request.headers.get("X-Demo-Role") != "ADMIN":
        return JsonResponse({"message": "Admin access required"}, status=403)

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"message": "No image uploaded"}, status=400)

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    extension = allowed_types.get(image.content_type)
    if not extension:
        return JsonResponse({"message": "Upload a JPG, PNG, or WebP image"}, status=400)
    if image.size > 3 * 1024 * 1024:
        return JsonResponse({"message": "Image must be 3MB or smaller"}, status=400)

    filename = f"product_images/{uuid.uuid4().hex}{extension}"
    saved_path = default_storage.save(filename, ContentFile(image.read()))
    image_url = request.build_absolute_uri(default_storage.url(saved_path))
    return JsonResponse({"image": image_url})


@csrf_exempt
@require_http_methods(["POST"])
def checkout(request):
    payload = json.loads(request.body or "{}")
    items = payload.get("items", [])

    if not items:
        return JsonResponse({"message": "Cart is empty"}, status=400)

    with transaction.atomic():
        product_ids = [item["product_id"] for item in items]
        products_by_id = {
            product.id: product
            for product in Product.objects.select_for_update().filter(id__in=product_ids)
        }

        subtotal = 0
        for item in items:
            product = products_by_id.get(item["product_id"])
            qty = int(item.get("qty", 0))

            if not product or qty <= 0:
                return JsonResponse({"message": "Invalid cart item"}, status=400)
            if product.stock < qty:
                return JsonResponse({"message": f"Only {product.stock} units available for {product.title}"}, status=409)

            subtotal += product.price * qty

        for item in items:
            product = products_by_id[item["product_id"]]
            product.stock -= int(item["qty"])
            product.save(update_fields=["stock"])

    shipping = 0 if subtotal >= 1000 else 99
    return JsonResponse({
        "order": {
            "subtotal": subtotal,
            "shipping": shipping,
            "total": subtotal + shipping,
        },
        "products": [product.to_dict() for product in Product.objects.all()],
    })


@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def product_detail(request, product_id):
    if request.headers.get("X-Demo-Role") != "ADMIN":
        return JsonResponse({"message": "Admin access required"}, status=403)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"message": "Product not found"}, status=404)

    if request.method == "PUT":
        payload = json.loads(request.body or "{}")
        product.title = payload["title"]
        product.price = int(payload["price"])
        product.stock = int(payload.get("stock", product.stock))
        product.category = payload["category"]
        product.image = payload["image"]
        product.description = payload["description"]
        product.save()
        return JsonResponse({"product": product.to_dict()})

    product.delete()
    return JsonResponse({"deleted": True})
