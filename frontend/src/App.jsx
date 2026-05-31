import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  CreditCard,
  Edit,
  ImagePlus,
  Heart,
  LogOut,
  MapPin,
  Minus,
  Moon,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  Trash,
  Truck,
  User as UserIcon,
  XCircle,
} from "lucide-react";

import { checkoutCart, createProduct, deleteProduct, getProducts, login, updateProduct, uploadProductImage } from "./api";
import { categories } from "./data/categories";


export default function App() {
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getProducts({ category: activeCategory, search: searchQuery, role: user?.role ?? "" });
        setProducts(data.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [activeCategory, searchQuery, user?.role]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));

  const handleLogin = async (email, password) => {
    try {
      const account = await login(email, password);
      setUser(account);
      setView(account.role === "ADMIN" ? "admin" : "home");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView("home");
    setCart([]);
    setWishlist([]);
  };

  const addToCart = (product) => {
    if (!user) {
      setView("login");
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.product.id === product.id);
      const currentQty = existing?.qty ?? 0;
      if (currentQty >= product.stock) {
        alert("This product is out of available stock.");
        return currentCart;
      }
      if (existing) {
        return currentCart.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...currentCart, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId, nextQty) => {
    setCart((currentCart) => {
      const cartItem = currentCart.find((item) => item.product.id === productId);
      if (nextQty <= 0) {
        return currentCart.filter((item) => item.product.id !== productId);
      }
      if (cartItem && nextQty > cartItem.product.stock) {
        alert(`Only ${cartItem.product.stock} available in stock.`);
        return currentCart;
      }
      return currentCart.map((item) => (item.product.id === productId ? { ...item, qty: nextQty } : item));
    });
  };

  const placeOrder = async (checkoutDetails) => {
    try {
      const data = await checkoutCart(cart, checkoutDetails);
      const subtotal = data.order.subtotal;
      const shipping = data.order.shipping;
      const order = {
        id: `SS-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toLocaleString(),
        details: checkoutDetails,
        items: cart,
        shipping,
        subtotal,
        total: subtotal + shipping,
        status: "Ordered",
        statusHistory: [
          { status: "Ordered", at: new Date().toLocaleString(), note: "Order placed by customer" },
        ],
      };

      setProducts(data.products);
      setSelectedProduct(null);
      setOrders((currentOrders) => [order, ...currentOrders]);
      setLatestOrder(order);
      setCart([]);
      setView("order-success");
    } catch (err) {
      alert(err.message);
      await refreshProducts();
    }
  };

  const addAddress = (address) => {
    setAddresses((currentAddresses) => [
      ...currentAddresses.map((item) => ({ ...item, isDefault: address.isDefault ? false : item.isDefault })),
      { ...address, id: Date.now(), isDefault: address.isDefault || currentAddresses.length === 0 },
    ]);
  };

  const updateAddress = (addressId, address) => {
    setAddresses((currentAddresses) =>
      currentAddresses.map((item) => {
        if (item.id === addressId) return { ...address, id: addressId };
        if (address.isDefault) return { ...item, isDefault: false };
        return item;
      })
    );
  };

  const deleteAddress = (addressId) => {
    setAddresses((currentAddresses) => {
      const remaining = currentAddresses.filter((item) => item.id !== addressId);
      if (remaining.length > 0 && !remaining.some((item) => item.isDefault)) {
        return remaining.map((item, index) => ({ ...item, isDefault: index === 0 }));
      }
      return remaining;
    });
  };

  const setDefaultAddress = (addressId) => {
    setAddresses((currentAddresses) => currentAddresses.map((item) => ({ ...item, isDefault: item.id === addressId })));
  };

  const updateOrderStatus = (orderId, status, note = "") => {
    const historyItem = { status, at: new Date().toLocaleString(), note: note || `Status changed to ${status}` };
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? { ...order, status, statusHistory: [...(order.statusHistory ?? []), historyItem] }
          : order
      )
    );
    setLatestOrder((currentOrder) =>
      currentOrder?.id === orderId
        ? { ...currentOrder, status, statusHistory: [...(currentOrder.statusHistory ?? []), historyItem] }
        : currentOrder
    );
  };

  const cancelOrder = (orderId) => {
    updateOrderStatus(orderId, "Cancelled", "Cancelled by customer");
  };

  const toggleWishlist = (productId) => {
    if (!user) {
      setView("login");
      return;
    }

    setWishlist((currentWishlist) =>
      currentWishlist.includes(productId)
        ? currentWishlist.filter((id) => id !== productId)
        : [...currentWishlist, productId]
    );
  };

  const refreshProducts = async () => {
    const data = await getProducts({ category: activeCategory, search: searchQuery, role: user?.role ?? "" });
    setProducts(data.products);
  };

  return (
    <div className="min-h-screen">
      <div className="min-h-screen bg-gray-50 transition-colors duration-200 dark:bg-gray-900">
        <Navbar
          activeCategory={activeCategory}
          cartCount={cartCount}
          searchQuery={searchQuery}
          setActiveCategory={setActiveCategory}
          setSearchQuery={setSearchQuery}
          setView={setView}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
          handleLogout={handleLogout}
        />
        <main className="pb-20">
          {(view === "home" || view === "shop") && (
            <ShopView
              activeCategory={activeCategory}
              addToCart={addToCart}
              error={error}
              isLoading={isLoading}
              products={products}
              setSelectedProduct={setSelectedProduct}
              setView={setView}
              toggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          )}
          {view === "product" && selectedProduct && (
            <ProductDetailView
              addToCart={addToCart}
              product={selectedProduct}
              setView={setView}
              toggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          )}
          {view === "cart" && <CartView cart={cart} setCart={setCart} setView={setView} updateCartQty={updateCartQty} />}
          {view === "checkout" && (
            <CheckoutView
              addresses={addresses}
              cart={cart}
              placeOrder={placeOrder}
              setView={setView}
              updateCartQty={updateCartQty}
            />
          )}
          {view === "order-success" && <OrderSuccessView order={latestOrder} setView={setView} />}
          {view === "profile" && (
            <ProfileView
              handleLogout={handleLogout}
              products={products}
              toggleWishlist={toggleWishlist}
              user={user}
              wishlist={wishlist}
              addToCart={addToCart}
              addAddress={addAddress}
              addresses={addresses}
              cancelOrder={cancelOrder}
              deleteAddress={deleteAddress}
              orders={orders}
              setDefaultAddress={setDefaultAddress}
              updateAddress={updateAddress}
            />
          )}
          {view === "admin" && user?.role === "ADMIN" && (
            <AdminDashboard
              handleLogout={handleLogout}
              products={products}
              refreshProducts={refreshProducts}
              setCart={setCart}
              setSelectedProduct={setSelectedProduct}
              orders={orders}
              updateOrderStatus={updateOrderStatus}
              user={user}
            />
          )}
          {view === "login" && <LoginView handleLogin={handleLogin} />}
        </main>
      </div>
    </div>
  );
}


function Navbar({
  activeCategory,
  cartCount,
  handleLogout,
  searchQuery,
  setActiveCategory,
  setSearchQuery,
  setView,
  theme,
  toggleTheme,
  user,
}) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-md transition-colors duration-200 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button
            className="flex items-center"
            onClick={() => {
              setView("home");
              setActiveCategory("ALL");
            }}
          >
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              SuperShop
            </span>
          </button>

          <div className="hidden max-w-md flex-1 px-8 md:flex">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search across all shops..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setView("shop");
                }}
                className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user?.role !== "ADMIN" && (
              <button
                onClick={() => setView("cart")}
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                aria-label="Cart"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView(user.role === "ADMIN" ? "admin" : "profile")}
                  className="rounded-full p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  title={user.role === "ADMIN" ? "Admin Dashboard" : "Profile"}
                >
                  <UserIcon size={20} />
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView("login")}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {user?.role !== "ADMIN" && (
        <div className="overflow-x-auto border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto flex max-w-7xl space-x-3 px-4 py-3 md:space-x-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setView("shop");
                  setSearchQuery("");
                }}
                className={`flex items-center space-x-2 whitespace-nowrap rounded-full px-3 py-1 transition-colors ${
                  activeCategory === cat.id
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                <cat.icon size={16} />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}


function ProductCard({ addToCart, product, setSelectedProduct, setView, toggleWishlist, wishlist }) {
  const openProduct = () => {
    if (!setSelectedProduct || !setView) return;
    setSelectedProduct(product);
    setView("product");
  };

  return (
    <div
      onClick={openProduct}
      className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="group relative h-48 overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage(product);
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={(event) => {
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute right-3 top-3 rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 dark:bg-black/50"
          aria-label="Toggle wishlist"
        >
          <Heart
            size={18}
            className={wishlist.includes(product.id) ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}
          />
        </button>
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs font-bold text-white">
          {product.category}
        </div>
      </div>
      <div className="flex flex-grow flex-col p-4">
        <h3 className="mb-1 truncate text-lg font-semibold text-gray-900 dark:text-white">{product.title}</h3>
        <p className="mb-4 line-clamp-2 flex-grow text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
        <p className={`mb-3 text-sm font-medium ${stockMessageClass(product.stock)}`}>
          {stockMessage(product.stock)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Rs. {product.price}</span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              addToCart(product);
            }}
            disabled={product.stock === 0}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:bg-gray-700/40"
          >
            Add <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}


function stockMessage(stock) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return `Only ${stock} left`;
  return `${stock} in stock`;
}


function stockMessageClass(stock) {
  if (stock <= 0) return "text-red-500";
  if (stock <= 5) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}


function fallbackProductImage(product) {
  const accents = {
    PUJA: ["#fef3c7", "#b45309"],
    SHOES: ["#fee2e2", "#b91c1c"],
    KAPRA: ["#dcfce7", "#15803d"],
    SHRINGAR: ["#fce7f3", "#be185d"],
  };
  const [background, foreground] = accents[product.category] ?? ["#e0e7ff", "#4338ca"];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <rect width="640" height="420" fill="${background}"/>
      <circle cx="500" cy="70" r="120" fill="${foreground}" opacity="0.12"/>
      <circle cx="115" cy="340" r="150" fill="${foreground}" opacity="0.10"/>
      <text x="50%" y="48%" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="${foreground}">${escapeSvg(product.title)}</text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="${foreground}" opacity="0.75">${escapeSvg(product.category)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}


function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


function ShopView({ activeCategory, addToCart, error, isLoading, products, setSelectedProduct, setView, toggleWishlist, wishlist }) {
  const title = activeCategory === "ALL" ? "All Products" : categories.find((category) => category.id === activeCategory)?.label;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{products.length} items</span>
      </div>

      {isLoading && <StateMessage icon={Package} message="Loading products..." />}
      {error && !isLoading && <StateMessage icon={Package} message={`Could not load products: ${error}`} />}
      {!isLoading && !error && products.length === 0 && <StateMessage icon={Package} message="No products found matching your criteria." />}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              addToCart={addToCart}
              key={product.id}
              product={product}
              setSelectedProduct={setSelectedProduct}
              setView={setView}
              toggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function StateMessage({ icon: Icon, message }) {
  return (
    <div className="py-20 text-center text-gray-500 dark:text-gray-400">
      <Icon size={48} className="mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );
}


function ProductDetailView({ addToCart, product, setView, toggleWishlist, wishlist }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button onClick={() => setView("shop")} className="mb-6 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
        Back to Products
      </button>
      <div className="grid gap-8 rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:grid-cols-[520px_1fr]">
        <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
          <img
            src={product.image}
            alt={product.title}
            onError={(event) => {
              event.currentTarget.src = fallbackProductImage(product);
            }}
            className="h-full min-h-[360px] w-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              {product.category}
            </span>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="rounded-full bg-gray-100 p-3 text-gray-600 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle wishlist"
            >
              <Heart size={22} className={wishlist.includes(product.id) ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.title}</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{product.description}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <InfoTile label="Price" value={`Rs. ${product.price}`} />
            <InfoTile label="Stock" value={product.stock <= 5 && product.stock > 0 ? `Only ${product.stock} left` : product.stock > 0 ? `${product.stock} available` : "Out of stock"} />
            <InfoTile label="Delivery" value={product.price >= 1000 ? "Free shipping" : "Rs. 99 shipping"} />
          </div>
          <div className="mt-8 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900/50 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white">Store policy</p>
            <p className="mt-1">Cash, UPI, or card on delivery. Orders are confirmed instantly in this demo store.</p>
          </div>
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <button
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Add to Cart <ShoppingCart size={18} />
            </button>
            <button
              onClick={() => {
                addToCart(product);
                if (product.stock > 0) setView("cart");
              }}
              disabled={product.stock === 0}
              className="rounded-lg border border-indigo-200 px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}


function CartView({ cart, setCart, setView, updateCartQty }) {
  const total = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = total >= 1000 || total === 0 ? 0 : 99;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Your Cart</h1>
      {cart.length === 0 ? (
        <div className="rounded-lg border border-gray-100 bg-white py-20 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="mb-4 text-gray-500 dark:text-gray-400">Your cart is empty.</p>
          <button onClick={() => setView("shop")} className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700">
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex-1 space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <img
                  src={item.product.image}
                  alt={item.product.title}
                  onError={(event) => {
                    event.currentTarget.src = fallbackProductImage(item.product);
                  }}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.product.title}</h3>
                  <p className="text-sm text-gray-500">{item.product.category}</p>
                  <div className="mt-2 font-bold text-indigo-600 dark:text-indigo-400">
                    Rs. {item.product.price}
                  </div>
                  <div className="mt-3 flex w-fit items-center rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-10 px-3 text-center text-sm font-semibold text-gray-900 dark:text-white">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                      className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setCart(cart.filter((cartItem) => cartItem.product.id !== item.product.id))}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Remove item"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="h-fit w-full rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:w-80">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Order Summary</h2>
            <div className="mb-2 flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>Rs. {total}</span>
            </div>
            <div className="mb-4 flex justify-between text-gray-600 dark:text-gray-300">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `Rs. ${shipping}`}</span>
            </div>
            <hr className="mb-4 border-gray-200 dark:border-gray-700" />
            <div className="mb-6 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>Rs. {total + shipping}</span>
            </div>
            <button
              onClick={() => setView("checkout")}
              className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function CheckoutView({ cart, placeOrder, setView, updateCartQty }) {
  const [details, setDetails] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    payment: "Cash on Delivery",
  });
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : 99;

  const submitOrder = async (event) => {
    event.preventDefault();
    await placeOrder(details);
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <CheckCircle className="mx-auto mb-4 text-indigo-500" size={54} />
        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">Your cart is ready for a fresh start</h1>
        <button onClick={() => setView("shop")} className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700">
          Shop Products
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submitOrder} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input required placeholder="Full name" value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <input required placeholder="Phone number" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <input required placeholder="City" value={details.city} onChange={(event) => setDetails({ ...details, city: event.target.value })} className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <select value={details.payment} onChange={(event) => setDetails({ ...details, payment: event.target.value })} className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option>Cash on Delivery</option>
            <option>UPI on Delivery</option>
            <option>Card on Delivery</option>
          </select>
          <textarea required placeholder="Delivery address" value={details.address} onChange={(event) => setDetails({ ...details, address: event.target.value })} rows={4} className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:col-span-2" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => setView("cart")} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">
            Back to Cart
          </button>
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">
            <CreditCard size={18} /> Place Order
          </button>
        </div>
      </form>

      <div className="h-fit rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <Truck size={20} /> Order Summary
        </h2>
        <div className="mb-5 space-y-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex gap-3">
              <img
                src={item.product.image}
                alt={item.product.title}
                onError={(event) => {
                  event.currentTarget.src = fallbackProductImage(item.product);
                }}
                className="h-14 w-14 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{item.product.title}</p>
                <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
                  <span>Qty {item.qty}</span>
                  <span>Rs. {item.product.price * item.qty}</span>
                </div>
                <div className="mt-2 flex w-fit items-center rounded border border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => updateCartQty(item.product.id, item.qty - 1)} className="px-2 py-1 text-gray-600 dark:text-gray-300">-</button>
                  <span className="px-2 text-sm">{item.qty}</span>
                  <button type="button" onClick={() => updateCartQty(item.product.id, item.qty + 1)} className="px-2 py-1 text-gray-600 dark:text-gray-300">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-gray-200 pt-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <div className="flex justify-between"><span>Subtotal</span><span>Rs. {subtotal}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `Rs. ${shipping}`}</span></div>
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white"><span>Total</span><span>Rs. {subtotal + shipping}</span></div>
        </div>
      </div>
    </div>
  );
}


function OrderSuccessView({ order, setView }) {
  if (!order) {
    return <StateMessage icon={CheckCircle} message="No recent order found." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Order Confirmed</h1>
        <p className="mb-6 text-gray-500 dark:text-gray-400">Order {order.id} has been placed successfully.</p>
        <div className="mb-6 grid gap-3 rounded-lg bg-gray-50 p-4 text-left dark:bg-gray-900/50">
          <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium text-gray-900 dark:text-white">{order.details.payment}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Delivery City</span><span className="font-medium text-gray-900 dark:text-white">{order.details.city}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-indigo-600">Rs. {order.total}</span></div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => setView("profile")} className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">View Orders</button>
          <button onClick={() => setView("shop")} className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}


function AdminDashboard({ handleLogout, products, refreshProducts, setCart, setSelectedProduct, user }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: "", price: "", stock: "10", category: "PUJA", description: "", image: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const categoryCount = new Set(products.map((product) => product.category)).size;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ title: "", price: "", stock: "10", category: "PUJA", description: "", image: "" });
  };

  const startCreate = () => {
    if (isAdding && !editingId) {
      resetForm();
      return;
    }
    setEditingId(null);
    setFormData({ title: "", price: "", stock: "10", category: "PUJA", description: "", image: "" });
    setIsAdding(true);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      title: product.title,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
      description: product.description,
      image: product.image,
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.image) {
      alert("Please upload a product image.");
      return;
    }
    if (editingId) {
      await updateProduct(editingId, formData, user.role);
    } else {
      await createProduct(formData, user.role);
    }
    resetForm();
    await refreshProducts();
    setSelectedProduct(null);
    setCart((currentCart) =>
      currentCart
        .map((item) => (item.product.id === editingId ? { ...item, product: { ...item.product, ...formData, price: Number(formData.price), stock: Number(formData.stock) } } : item))
        .filter((item) => item.qty <= item.product.stock)
    );
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const data = await uploadProductImage(file, user.role);
      setFormData((current) => ({ ...current, image: data.image }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    await deleteProduct(id, user.role);
    await refreshProducts();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={startCreate}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            {isAdding && !editingId ? "Cancel" : <><Plus size={18} /> Add Product</>}
          </button>
          <button
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 md:flex"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <AdminStat label="Products" value={products.length} />
        <AdminStat label="Categories" value={categoryCount} />
        <AdminStat label="Units in Stock" value={totalStock} />
        <AdminStat label="Low Stock" value={products.filter((product) => product.stock > 0 && product.stock <= 5).length} />
        <AdminStat label="Catalog Value" value={`Rs. ${inventoryValue}`} />
      </div>

      {isAdding && (
        <div className="mb-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">{editingId ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input required type="text" placeholder="Title" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} className="rounded border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input required type="number" placeholder="Price" value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} className="rounded border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input required min="0" type="number" placeholder="Stock quantity" value={formData.stock} onChange={(event) => setFormData({ ...formData, stock: event.target.value })} className="rounded border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <select value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="rounded border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="PUJA">Puja Saman</option>
              <option value="SHOES">Shoes Shop</option>
              <option value="KAPRA">Kapra Shop</option>
              <option value="SHRINGAR">Shringar Shop</option>
            </select>
            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-200 dark:hover:bg-gray-900">
                <ImagePlus size={18} />
                {uploadingImage ? "Uploading image..." : formData.image ? "Replace product image" : "Upload product image"}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" />
              </label>
              {formData.image && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/50">
                  <img
                    src={formData.image}
                    alt="Product preview"
                    onError={(event) => {
                      event.currentTarget.src = fallbackProductImage({ title: formData.title || "Product", category: formData.category });
                    }}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Image ready</p>
                    <p className="text-xs text-gray-500">JPG, PNG, or WebP up to 3MB</p>
                  </div>
                </div>
              )}
            </div>
            <textarea required placeholder="Description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="rounded border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white md:col-span-2" rows={3} />
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className="flex-1 rounded-lg bg-green-600 py-2 text-white hover:bg-green-700">
                {editingId ? "Update Product" : "Save Product"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-5 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <th className="p-4 font-medium">Product</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                <td className="flex items-center gap-3 p-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    onError={(event) => {
                      event.currentTarget.src = fallbackProductImage(product);
                    }}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.title}</p>
                    <p className="w-48 truncate text-xs text-gray-500">{product.description}</p>
                  </div>
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {product.category}
                  </span>
                </td>
                <td className="p-4 font-medium text-gray-900 dark:text-white">Rs. {product.price}</td>
                <td className="p-4 font-medium text-gray-900 dark:text-white">{product.stock}</td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(product)} className="mr-2 rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20" aria-label="Edit product">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Delete product">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function AdminStat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}


function ProfileView({ addToCart, handleLogout, orders, products, toggleWishlist, user, wishlist }) {
  const wishlistedProducts = useMemo(() => products.filter((product) => wishlist.includes(product.id)), [products, wishlist]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            {user.email[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.email}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customer Member</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        <Heart className="fill-red-500 text-red-500" /> Your Wishlist
      </h2>
      {wishlist.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">You have not liked any products yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {wishlistedProducts.map((product) => (
            <ProductCard
              addToCart={addToCart}
              key={product.id}
              product={product}
              toggleWishlist={toggleWishlist}
              wishlist={wishlist}
            />
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-10 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
        <Package className="text-indigo-500" /> Order History
      </h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">You have not placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{order.id}</p>
                  <p className="text-sm text-gray-500">{order.createdAt}</p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {order.items.length} item{order.items.length === 1 ? "" : "s"} - {order.details.payment} - Rs. {order.total}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function LoginView({ handleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-gray-500 dark:text-gray-400">Sign in to SuperShop</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <button type="submit" className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-700">
            Sign In
          </button>
        </form>
        
      </div>
    </div>
  );
}
