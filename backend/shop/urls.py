from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.health),
    path("login/", views.login),
    path("checkout/", views.checkout),
    path("uploads/product-image/", views.upload_product_image),
    path("products/", views.products),
    path("products/<int:product_id>/", views.product_detail),
]
