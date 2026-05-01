"use client";
import { useState,useEffect } from "react";
import { collection, getDocs, query, where,addDoc } from "firebase/firestore";
import { DB } from "../firebaseConfig";
import { useRouter } from "next/navigation";
import ClipLoader from "react-spinners/ClipLoader";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { FiPackage } from "react-icons/fi";
import { GoGear } from "react-icons/go";
import { LuCar,LuShoppingCart } from "react-icons/lu";
import { IoIosArrowForward,IoMdArrowBack,IoLogoWhatsapp } from "react-icons/io";
import "./style.css";

export default function Page() {
  const router = useRouter();

  const [brands, setBrands] = useState([]);
  const [families, setFamilies] = useState([]);
  const [models, setModels] = useState([]);
  const [products, setProducts] = useState([]);
  const [brand, setBrand] = useState(null);
  const [family, setFamily] = useState(null);
  const [model, setModel] = useState(null);
  const [view, setView] = useState("catalog");
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState({ name: "", phone: "", address: "" });
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginInput, setShowLoginInput] = useState(false);
  const [adminCode, setAdminCode] = useState("");

  useEffect(() => {
    fetchBrands();

    const saved = localStorage.getItem("isSHPRAAdmin");
    if (saved === "true") {
      setIsAdmin(true);
    }
  }, []);

  //Login function
  const handleAdminLogin = () => {
    if (adminCode === "hedi203") {
      setIsAdmin(true);
      localStorage.setItem("isSHPRAAdmin", "true");
      setShowLoginInput(false);
      setAdminCode("");
    } else {
      alert("Code incorrect");
    }
  };

  //Logout function
  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem("isSHPRAAdmin");
  };

  const fetchBrands = async () => {
    const snap = await getDocs(collection(DB, "brands"));
    setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  //Select brand
  const handleBrandClick = async (b) => {
    setBrand(b);
    setFamily(null);
    setModel(null);

    const q = query(
      collection(DB, "families"),
      where("brandId", "==", b.id)
    );

    const snap = await getDocs(q);
    setFamilies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  //Select family
  const handleFamilyClick = async (f) => {
    setFamily(f);
    setModel(null);

    const q = query(
      collection(DB, "models"),
      where("familyId", "==", f.id)
    );

    const snap = await getDocs(q);
    setModels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  //Select model
  const handleModelClick = async (m) => {
    setModel(m);

    const q = query(
      collection(DB, "products"),
      where("modelId", "==", m.id)
    );

    const snap = await getDocs(q);
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* CART LOGIC */
  const addToCart = (part) => {
    setCart((prev) => {
      const exist = prev.find((i) => i.id === part.id);
      if (exist) {
        return prev.map((i) =>
          i.id === part.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          ...part,
          qty: 1,
          modelName: model?.name || "",
        },
      ];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((i) =>i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const count = cart.reduce((a, i) => a + i.qty, 0);

  //Confirm order
  const submitOrder = async (e) => {
    e.preventDefault();

    if (!order.name || !order.phone || !order.address) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    if (cart.length === 0) {
      alert("Votre panier est vide");
      return;
    }

    try {
      setLoadingOrder(true);

      const items = cart.map((item) => ({
        name: item.name,
        model: item.modelName,
        reference: item.reference,
        qty: item.qty,
        price: item.price,
      }));

      await addDoc(collection(DB, "orders"), {
        customer: {
          name: order.name,
          phone: order.phone,
          address: order.address,
        },
        items,
        total,
        status: "pending",
        createdAt: new Date(),
      });

      setCart([]);
      setOrder({ name: "", phone: "", address: "" });
      setView("success");

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la commande");
    } finally {
      setLoadingOrder(false);
    }
  };

  const reset = () => {
    setBrand(null);
    setFamily(null);
    setModel(null);
    setView("catalog");
  };

  const CartView = ({ cart, total, updateQty, removeItem, setView }) => {
    if (cart.length === 0) return (
      <div className="empty-cart-box">
        <h2 style={{margin:'0px'}}>Votre panier est vide</h2>
        <p style={{color:'#6b7280',margin:'0px'}}>Parcourez notre catalogue pour trouver les pièces dont vous avez besoin.</p>
        <div className="empty-cart-box-button" onClick={reset}>
          <h4>Voir le catalogue</h4>
        </div>
      </div>
    );

    return (
      <> 
        <div className="top-bar"> 
          <h2>Votre Panier</h2>
          <button onClick={() => setView("catalog")}> 
            <IoMdArrowBack /> Retour 
          </button> 
        </div>

        <div className="cart-grid">
          <div>
            {cart.map((item,index) => (
              <div key={index} className="cart-item">
                <img src={item.image} />

                <div className="cart-info">
                  <div className="cart-info-name">
                    <h4>{item.name}</h4>
                    <p>Ref: {item.reference}</p>
                  </div>
          
                  <div className="qty">
                    <button onClick={() => updateQty(item.id, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>

                  <div className="price">
                    <h5>{item.price * item.qty} TND</h5>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="remove"
                  >
                    Supprimer
                  </button>
                </div>

                
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Total</h3>
            <h2>{total} TND</h2>

            <button onClick={() => setView("checkout")}>
              Continuer
            </button>
          </div>
        </div>
      </>
    );
  };

  const SuccessView = ({ reset }) => {
    return ( 
      <div className="success"> 
        <h2>Commande envoyée ✅</h2> 
        <p>nous allons vous appeler bientôt.</p> 
        <button className="order-sent-back-button" onClick={reset}>Retour</button> 
      </div>
    );
  };

  return (
    <div>
      {/* HEADER */}
      <header className="header">
        <div className="container header-inner">
          <div className="logo" onClick={reset}>
            <img src="/icon.png" alt="SHPRA Logo"/>
          </div>

          <div className="right">
              {!isAdmin ? (
                <div className="admin-box">
                  {!showLoginInput ? (
                    <div
                      className="admin-icon"
                      onClick={() => setShowLoginInput(true)}
                    >
                      <GoGear size={22} />
                    </div>
                  ) : (
                    <div className="admin-login">
                      <input
                        type="password"
                        placeholder="Code"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                      />
                      <button onClick={handleAdminLogin}>OK</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="admin-logged">
                  <button onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </button>
                </div>
              )}
            <div className="cart" onClick={() => setView("cart")}>
              <LuShoppingCart size={22} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container brands-list-box">

        {/* ================= CART ================= */}
        {view === "cart" && (
          <CartView
            cart={cart}
            total={total}
            updateQty={updateQty}
            removeItem={removeItem}
            setView={setView}
          />
        )}

        {/* ================= CHECKOUT ================= */}
        {view === "checkout" && (
          <CheckoutView
            order={order}
            setOrder={setOrder}
            setView={setView}
            cart={cart}
            total={total}
            submitOrder={submitOrder}
            loadingOrder={loadingOrder}
          />
        )}

        {/* ================= SUCCESS ================= */}
        {view === "success" && (
          <SuccessView
            reset={reset}
          />
        )}

        {/* ================= CATALOG ================= */}
        {view === "catalog" && (
          <>
            <div className="breadcrumb">
              <span onClick={reset}>Marques</span>
              {brand && <> › <span onClick={() => { setFamily(null); setModel(null); }}>{brand.name}</span></>}
              {family && <> › <span onClick={() => setModel(null)}>{family.name}</span></>}
              {model && <> › <b>{model.name}</b></>}
            </div>

            {/* 🔥 BRANDS */}
            {!brand && (
              <>
                <div className="section-header">
                  <h1>Vente de pièces automobiles en ligne</h1>
                  <p>Sélectionnez la marque</p>
                </div>

                <div className="brands-grid">
                  {brands.map((b) => (
                    <div key={b.id} className="brand-card" onClick={() => handleBrandClick(b)}>
                      <img src={b.logo} />
                      <span>{b.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 🔥 FAMILIES */}
            {brand && !family && (
              <>
                <div className="top-bar">
                  <h2>{brand.name}</h2>
                  <div className="top-bar-button-div">
                    <button onClick={reset}>Retour</button>
                    <IoMdArrowBack color="#2563eb"/>
                  </div>
                </div>

                <div className="list-grid">
                  {families.map((f) => (
                    <div key={f.id} className="list-card" onClick={() => handleFamilyClick(f)}>
                      <h3>{f.name}</h3>
                      <IoIosArrowForward />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 🔥 MODELS */}
            {family && !model && (
              <>
                <div className="top-bar">
                  <h2>{family.name}</h2>
                  <div className="top-bar-button-div">
                    <button onClick={() => setFamily(null)}>Retour</button>
                    <IoMdArrowBack color="#2563eb"/>
                  </div>
                </div>

                <div className="list-grid">
                  {models.map((m) => (
                    <div key={m.id} className="list-card" onClick={() => handleModelClick(m)}>
                      <p>{m.name}</p>
                      <IoIosArrowForward />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 🔥 PARTS */}
            {model && (
              <>
                <div className="top-bar">
                  <h2 style={{marginBottom:'10px'}}>{model.name}</h2>
                  <div className="top-bar-button-div">
                    <button onClick={() => setModel(null)}>Retour</button>
                    <IoMdArrowBack color="#2563eb"/>
                  </div>
                </div>

                {products.length > 0 ? (
                  <div className="parts-grid">
                    {products.map((p) => (
                      <div key={p.id} className="part-card">
                        <img src={p.image} />
                        <h4>{p.name}</h4>
                        <p style={{fontSize:'13px',color:'#6b7280'}}>
                          Ref: {p.reference}
                        </p>

                        <div className="price-container">
                          <div className="price-container-numbers">
                            <h4>{p.price}</h4>
                            <p style={{fontSize:'14px'}}>TND</p>
                          </div>

                          <div
                            className="price-container-button"
                            onClick={() => addToCart(p)}
                          >
                            <LuShoppingCart size={22} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Aucune pièce disponible</p>
                )}
              </>
            )}
          </>
        )}
      </main>

      <section className="features">
        <div className="container features-grid">

          <div className="feature">
            <div className="icon">
              <MdOutlineVerifiedUser size={30} color="#00c951"/>
            </div>
            <div className="feature-paragraph">
              <h4>Qualité Certifiée</h4>
              <p>Pièces d'origine et adaptables de haute qualité.</p>
            </div>          
          </div>

          <div className="feature">
            <div className="icon">
              <FiPackage size={30} color="#2b7fff"/>
            </div>
            <div className="feature-paragraph">
              <h4>Livraison Rapide</h4>
              <p>Livraison sur tout le territoire tunisien sous 24/48h.</p>
            </div>  
          </div>

          <div className="feature">
            <div className="icon">
              <GoGear size={30}/>
            </div>
            <div className="feature-paragraph">
              <h4>Support Technique</h4>
              <p>Conseillers disponibles par téléphone pour vous aider.</p>
            </div>
          </div>

        </div>
      </section>

      <footer className="footer">
        <div className="container footer-grid">

          <div className="footer-grid-box">
            <h3>SHP<span>RA</span></h3>
            <p className="footer-paragraph">
              Votre partenaire de confiance pour toutes vos pièces de rechange au meilleur prix en Tunisie.
            </p>
            {/* 🔥 SIGNATURE */}
            <div className="footer-signature">
              <p>Développé par</p>
              <div className="footer-actions">
                <h5>Site Pro Tunisie</h5>
                <a
                  href="https://wa.me/21651510183"
                  target="_blank"
                  className="whatsapp"
                >
                  <IoLogoWhatsapp size={18} color="#22c55e"/>
                </a>
              </div>
            </div>
          </div>

          <div className="footer-grid-box">
            <h4>A propos</h4>
            <ul>
              <li>Qui sommes-nous</li>
              <li>Modes de livraison</li>
              <li>Conditions de vente</li>
            </ul>
          </div>

          <div className="footer-grid-box">
            <h4>Contact</h4>
            <ul>
              <li>Tunis, Tunisie</li>
              <li>contact@shrpa.tn</li>
              <li>+(216) 50 853 171</li>
            </ul>
          </div>

        </div>

        <div className="copyright">
          © 2026 SHPRA Tunisie. Tous droits réservés.
        </div>
      </footer>

    </div>
  );
}

function CheckoutView({ order, setOrder, setView, cart, total, submitOrder, loadingOrder }) {
  return (
    <>
      <div className="top-bar">
        <h2>Informations de livraison</h2>
        <button onClick={() => setView("cart")}>
          <IoMdArrowBack /> Retour
        </button>
      </div>

      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submitOrder}>
          <h3>Informations client</h3>

          <div className="form-group">
            <label>Nom complet</label>
            <input
              value={order.name}
              onChange={(e) =>
                setOrder((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>

          <div className="form-group">
            <label>Téléphone</label>
            <input
              value={order.phone}
              onChange={(e) =>
                setOrder((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
            />
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <textarea
              value={order.address}
              onChange={(e) =>
                setOrder((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
            />
          </div>

          <button type="submit" className="confirm-btn" disabled={loadingOrder}>
            {loadingOrder ? (
              <ClipLoader size={20} color="#fff" />
            ) : (
              "Confirmer la commande"
            )}
          </button>
        </form>

        <div className="checkout-summary">
          {cart.map((item, i) => (
            <div key={i}>
              {item.name} x{item.qty}
            </div>
          ))}
          <strong>{total} TND</strong>
        </div>
      </div>
    </>
  );
}