import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleStripeReturn = async () => {
      // Check for Stripe checkout result
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');
      
      if (success) {
        setSuccessMessage("Payment successful! Your order has been created.");
        
        // Check if we have items from before Stripe checkout
        const itemsBeforeCheckout = localStorage.getItem('stripeCheckoutItems');
        if (itemsBeforeCheckout) {
          localStorage.removeItem('stripeCheckoutItems');
          
          // For Stripe checkout, we need to create the order manually since webhook might not work
          console.log('Stripe checkout completed, creating order manually...');
          
          try {
            // Create order manually with Stripe payment method
            const response = await api.post("/cart/checkout", { paymentMethod: 'stripe' });
            console.log('Order created manually:', response.data);
            
            // Clear cart
            setCartItems([]);
            
            // Redirect to orders page
            setTimeout(() => {
              navigate('/orders?fromCheckout=true');
            }, 2000);
          } catch (err) {
            console.error('Failed to create order manually:', err);
            // Still clear cart and redirect
            setCartItems([]);
            setTimeout(() => {
              navigate('/orders?fromCheckout=true');
            }, 2000);
          }
        } else {
          // Regular fetch for direct checkout
          fetchCart();
          setTimeout(() => {
            navigate('/orders?fromCheckout=true');
          }, 2000);
        }
      }
      
      if (canceled) {
        setCancelMessage("Checkout was canceled. Your cart items are still here.");
      }
      
      fetchCart();
    };

    handleStripeReturn();
  }, [searchParams]);

  const fetchCart = async () => {
    try {
      const response = await api.get("/cart");
      setCartItems(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      setCartItems(cartItems.filter(item => item.product_id !== productId));
    } catch (err) {
      setError(err.message);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      // Remove current item and add with new quantity
      await api.delete(`/cart/${productId}`);
      if (newQuantity > 0) {
        await api.post("/cart/add", { product_id: productId, quantity: newQuantity });
      }
      fetchCart(); // Refresh cart
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await api.post("/cart/checkout");
      
      // Clear cart items immediately
      setCartItems([]);
      
      // Show success message
      setSuccessMessage(`Order created successfully! Order ID: ${response.data.order_id}`);
      
      // Redirect to orders page after a short delay
      setTimeout(() => {
        navigate('/orders?fromCheckout=true');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setCheckoutLoading(true);
    setError(null);
    
    try {
      const response = await api.post("/cart/create-checkout-session");
      
      // Store cart items count for verification after return
      localStorage.setItem('stripeCheckoutItems', cartItems.length.toString());
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (err) {
      if (err.response?.data?.message?.includes('not available') || 
          err.response?.data?.message?.includes('not configured')) {
        setError('Stripe checkout is not configured. Please use direct checkout instead.');
      } else {
        setError(err.response?.data?.message || err.message);
      }
      setCheckoutLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
      
      {/* Success/Cancel Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      
      {cancelMessage && (
        <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          {cancelMessage}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">Your cart is empty</div>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Items */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.cart_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src="https://via.placeholder.com/80"
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-gray-600">${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || cartItems.length === 0}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {checkoutLoading ? 'Processing...' : 'Complete Order (Recommended)'}
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <button
                onClick={handleStripeCheckout}
                disabled={checkoutLoading || cartItems.length === 0}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {checkoutLoading ? 'Processing...' : 'Pay with Stripe (Optional)'}
              </button>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 text-center">
                  <span className="font-medium">💡 For testing:</span> Use "Complete Order" above. 
                  Stripe requires API keys to be configured in the backend.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
