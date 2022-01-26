import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    const newSumAmount = {...sumAmount}; //aqui criei um novo objeto a partir do sumAmount
    newSumAmount[product.id] = product.amount; // quando faço assim: [product.id], estou pegando a informação de dentro do objeto, isso não é um array. Acessando a chave de maneira dinâmica
    return newSumAmount;
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() {

      const response = await api.get<Product[]>('products') //aqui estou pegando todos os produtos. <Product[]>: array de procutos

      const data = response.data.map(product => ({
        ...product,
        priceFormatted: formatPrice(product.price) 
      }))

      setProducts(data);
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id); //essa regra está toda no hook
  }

  return (
    <ProductList>
      {products.map(product => (
              <li key={product.id}>
              <img src={product.image} alt={product.title} />
              <strong>{product.title}</strong>
              <span>{product.priceFormatted}</span>
              <button
                type="button"
                data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
              >
                <div data-testid="cart-product-quantity">
                  <MdAddShoppingCart size={16} color="#FFF" />
                   {cartItemsAmount[product.id] || 0} 
                </div>
      
                <span>ADICIONAR AO CARRINHO</span>
              </button>
            </li>
      ))}

    </ProductList>
  );
};

export default Home;
