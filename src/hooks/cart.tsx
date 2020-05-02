import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@goMarketplace:products',
      );

      if (!storedProducts) {
        return Promise.reject();
      }

      setProducts(JSON.parse(storedProducts));

      return Promise.resolve();
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.findIndex(p => p.id === product.id);
      let updatedProducts = [];

      // if product alreay exists, just increment its quantity
      // otherwise, add new product to array of products
      if (productExists !== -1) {
        const filteredProducts = products.filter(
          p => p.id !== products[productExists].id,
        );

        updatedProducts = [
          ...filteredProducts,
          {
            ...product,
            quantity: products[productExists].quantity + 1,
          },
        ];
      } else {
        updatedProducts = [
          ...products,
          {
            ...product,
            quantity: 1,
          },
        ];
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async (id: string) => {
      const updatedProducts = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const productExists = products.findIndex(p => p.id === id);
      let updatedProducts = [];

      // decrements if product exists on cart
      // if quantity if greater than 1, decrement
      // otherwise, remove product from array of products
      if (productExists !== -1 && products[productExists].quantity > 1) {
        updatedProducts = products.map(product => {
          if (product.id === id) {
            return {
              ...product,
              quantity: product.quantity - 1,
            };
          }

          return product;
        });
      } else {
        updatedProducts = products.filter(p => p.id !== id);
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@goMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
