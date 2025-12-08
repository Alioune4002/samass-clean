'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { submitContactForm } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  is_active: boolean;
  image: string;
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [isShopActive, setIsShopActive] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialProducts: Product[] = [
      {
        id: 1,
        name: 'Huile à l’Arnica – Récupération musculaire',
        description: 'Huile naturelle à base d’arnica macéré, idéale pour soulager les tensions et courbatures après l’effort.',
        price: '18.00',
        stock: 50,
        is_active: true,
        image: '/images/arnica-oil.png',
      },
      {
        id: 2,
        name: 'Huile à la Lavande – Détente & relaxation',
        description: 'Huile douce à la lavande vraie pour un massage apaisant favorisant le sommeil et la détente.',
        price: '16.00',
        stock: 50,
        is_active: true,
        image: '/images/lavender-oil.png',
      },
      {
        id: 3,
        name: 'Huile de Massage – Base neutre personnalisable',
        description: 'Huile 100 % naturelle, douce et nourrissante, parfaite pour les massages ou comme base pour huiles essentielles.',
        price: '14.00',
        stock: 50,
        is_active: true,
        image: '/images/neutral-massage-oil.png',
      },
    ];
    setProducts(initialProducts);
    setIsShopActive(initialProducts.some((product) => product.stock > 0 && product.is_active));
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock > 0 && product.is_active) {
      setCart((prevCart) => [...prevCart, product]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, product) => total + parseFloat(product.price), 0).toFixed(2);
  };

  const handleSubmitOrder = async () => {
    if (isSubmitting || !userName || !userEmail || cart.length === 0) {
      setMessage('Veuillez remplir votre nom, email et ajouter au moins un produit.');
      return;
    }

    setIsSubmitting(true);
    const total = calculateTotal();
    const orderDetails = cart.map(item => `${item.name} - ${item.price} €`).join('\n');
    const messageBody = `Nouvelle commande de ${userName} (Email: ${userEmail}):\n\nProduits :\n${orderDetails}\n\nTotal : ${total} €\n\nMerci de contacter ${userName} pour proposer un mode de paiement et de livraison.`;

    try {
      await submitContactForm({
        name: userName,
        email: userEmail,
        message: messageBody,
      });
      setMessage('Votre panier a été envoyé à Sammy. Il vous recontactera rapidement pour proposer un moyen de paiement et un mode de livraison.');
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (error) {
      setMessage(`Erreur lors de l'envoi. Vérifiez votre connexion ou contactez Sammy à <a href="mailto:samassbysam@gmail.com">samassbysam@gmail.com</a>.`);
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-100 to-emerald-50 text-gray-900 font-poppins">
      <Head>
        <title>Boutique SAMASS - Huiles de massage</title>
        <meta name="description" content="Achetez des huiles de massage de qualité pour soulager vos muscles." />
      </Head>

      <main className="flex-grow">
        {isShopActive ? (
          <motion.section
            className="container mx-auto py-4 px-2 sm:px-4 md:py-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold text-emerald-900 mb-6 sm:mb-10 text-center">Ma P'tite Boutique</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  className={`bg-white rounded-lg shadow-md p-2 sm:p-4 ${product.stock === 0 || !product.is_active ? 'opacity-50 grayscale' : 'hover:shadow-lg transition-shadow'}`}
                  whileHover={product.stock > 0 && product.is_active ? { scale: 1.05 } : {}}
                >
                  <img
                    src={product.image ? product.image : '/images/about1.jpg'}
                    alt={product.name}
                    className={`w-full h-32 sm:h-48 object-cover rounded-t-lg ${product.stock === 0 || !product.is_active ? 'blur-sm' : ''}`}
                  />
                  <h3 className="text-lg sm:text-xl font-medium text-emerald-800 mt-2 sm:mt-4">{product.name}</h3>
                  <p className="text-gray-600 mt-1 sm:mt-2 text-sm">{product.description}</p>
                  <p className="mt-2 sm:mt-4 font-semibold text-emerald-600">{product.price} € (100 ml)</p>
                  {product.stock === 0 || !product.is_active ? (
                    <p className="mt-2 text-red-500 font-semibold">Rupture de stock</p>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-2 sm:mt-4 w-full bg-emerald-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm sm:text-base"
                    >
                      Ajouter au panier
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            <div className="mt-6 sm:mt-8 text-center">
              <h3 className="text-xl sm:text-2xl font-semibold text-emerald-900">Panier</h3>
              {cart.length > 0 ? (
                <>
                  <ul className="mt-4 space-y-2 text-gray-700 text-left mx-auto max-w-xs sm:max-w-md">
                    {cart.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span className="text-sm sm:text-base">{item.name}</span>
                        <span className="text-sm sm:text-base">{item.price} €</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-gray-600 text-sm sm:text-base">Total : {calculateTotal()} €</p>
                  {!isCheckoutOpen ? (
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="mt-4 w-full max-w-xs sm:max-w-md bg-emerald-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm sm:text-base"
                    >
                      Valider le panier
                    </button>
                  ) : (
                    <div className="mt-4 max-w-xs sm:max-w-md mx-auto text-left">
                      <input
                        type="text"
                        placeholder="Votre nom"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full p-2 mb-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Votre email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full p-2 mb-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                        required
                      />
                      <button
                        onClick={handleSubmitOrder}
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer la commande'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm sm:text-base">Votre panier est vide.</p>
              )}
              {message && <p className="mt-4 text-center text-emerald-600" dangerouslySetInnerHTML={{ __html: message }}></p>}
            </div>
          </motion.section>
        ) : (
          <section className="container mx-auto py-8 px-2 sm:px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-emerald-900 mb-4">Boutique Indisponible</h2>
            <p className="text-lg sm:text-xl text-gray-600">La boutique n’est pas disponible pour le moment, veuillez revenir plus tard.</p>
          </section>
        )}
      </main>
    </div>
  );
}
