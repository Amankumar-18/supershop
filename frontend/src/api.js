const API_BASE_URL = "https://supershop1.vercel.app/api";


async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }
  return data;
}


async function requestForm(path, formData, role) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "X-Demo-Role": role,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }
  return data;
}


export function login(email, password) {
  return request("/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}


export function getProducts({ category = "ALL", search = "", role = "" } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("search", search);
  return request(`/products/?${params.toString()}`, {
    headers: role ? { "X-Demo-Role": role } : {},
  });
}


export function createProduct(product, role) {
  return request("/products/", {
    method: "POST",
    headers: {
      "X-Demo-Role": role,
    },
    body: JSON.stringify(product),
  });
}


export function uploadProductImage(file, role) {
  const formData = new FormData();
  formData.append("image", file);
  return requestForm("/uploads/product-image/", formData, role);
}


export function checkoutCart(cart, details) {
  return request("/checkout/", {
    method: "POST",
    body: JSON.stringify({
      details,
      items: cart.map((item) => ({
        product_id: item.product.id,
        qty: item.qty,
      })),
    }),
  });
}


export function updateProduct(productId, product, role) {
  return request(`/products/${productId}/`, {
    method: "PUT",
    headers: {
      "X-Demo-Role": role,
    },
    body: JSON.stringify(product),
  });
}


export function deleteProduct(productId, role) {
  return request(`/products/${productId}/`, {
    method: "DELETE",
    headers: {
      "X-Demo-Role": role,
    },
  });
}
