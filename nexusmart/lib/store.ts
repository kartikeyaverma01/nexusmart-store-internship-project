import { create } from 'zustand';

interface CartItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartStore {
  cart: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: any) => void;
  updateQuantity: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotal: () => number;  // Calculates total price of all items in cart
  clearCart: () => void;     // Resets the cart to empty after successful checkout
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  isCartOpen: false,
  setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  
  addToCart: (product) => set((state) => {
    const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
    const existingItem = state.cart.find((item) => item.id === productId);
    
    if (existingItem) {
      return {
        cart: state.cart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        ),
        isCartOpen: true,
      };
    }
    
    return { 
      cart: [...state.cart, { 
        id: productId, 
        name: product.name, 
        price: product.price, 
        imageUrl: product.imageUrl || product.image, 
        quantity: 1 
      }], 
      isCartOpen: true 
    };
  }),
  
  updateQuantity: (id, delta) => set((state) => ({
    cart: state.cart.map((item) => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    })
  })),
  
  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter((item) => item.id !== id)
  })),

  cartTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  clearCart: () => set({ cart: [] })
}));