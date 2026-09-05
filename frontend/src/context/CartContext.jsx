import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem("shopsense_cart");
            return saved ? JSON.parse(saved) : [
                {
                    _id: "default_jhumka_1",
                    name: "Traditional Gold Jhumka",
                    category: "jewellery",
                    price: 799,
                    quantity: 1,
                    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
                    description: "Traditional gold-tone jhumka suitable for festive occasions."
                }
            ];
        } catch (e) {
            return [];
        }
    });

    const [userBudget, setUserBudget] = useState(1500);

    useEffect(() => {
        try {
            localStorage.setItem("shopsense_cart", JSON.stringify(cartItems));
        } catch (e) {
            console.error("Cart save error:", e);
        }
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item._id === product._id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].quantity += quantity;
                return updated;
            } else {
                return [...prev, { ...product, quantity }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item._id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item._id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isOverBudget = totalAmount > userBudget;
    const remainingBudget = userBudget - totalAmount;

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                userBudget,
                setUserBudget,
                totalAmount,
                isOverBudget,
                remainingBudget
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
