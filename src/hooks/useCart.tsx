import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
  const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  /* aqui estou colocando a lógica para sempre ir realizando o Set Item, quando o estado do carrinho mudar*/

  const prevCartRef = useRef<Product[]>();
  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue]);

  

  const addProduct = async (productId: number) => {
    try {
       const updatedCart = [...cart];
       /* updatedCart é um novo array a partir do valor que eu tenho do carrinho */
       const productExists = updatedCart.find(product => product.id === productId)
       /*updatedCart.find: verifico se o id do produto é igual ao que eu recebi na função. 
       Se for igual, o produto existe no carrinho, se não for igual o produto não existe no carrinho */

       const stock = await api.get(`/stock/${productId}`);

       const stockAmount = stock.data.amount;
       const currentAmount = productExists ? productExists.amount : 0;
       /* currentAmount é a quantidade do produto no carrinho. 
       Acima estou verificando se o produto existe no carrinho, se existir verifico o amount, se não existir o valor dele é 0 */
      const amount = currentAmount + 1; 
      /* amount é a quantidade desejada. currentAmount + 1: quantidade desejada + 1. */

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
        /*aqui dou um return para que o código abaixo não seja executado*/
      }

      if (productExists) {
        productExists.amount = amount;
        /*se o produto já existe no carrinho, vou atualizar a quantidade dele*/
      } else {
        const product = await api.get(`/products/${productId}`); /*se for um produto novo, busco ele da api*/

        const newProduct = {
          ...product.data,
          amount: 1
          /* campo amount aqui significa que é a primeira vez que esse produto está sendo adicionado ao carrinho */
        } 
        updatedCart.push(newProduct); /*só pude dar esse push aqui pois ele não está apontando para a referencia "cart", 
        e sim para updatedCart */
      }

      setCart(updatedCart);
      /*setCart para as alterações feitas acima serem salvas no carrinho*/
    } catch {
      toast.error('Erro na adição do produto'); 
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      // o find Index, se encontrar algo, efetua - 1

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        //splice remove os elementos do array
        setCart(updatedCart)
      } else {
        throw Error(); //quando dou esse comando ele pula direto paara o erro do catch
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
          productExists.amount = amount;
          setCart(updatedCart);
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');

    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
