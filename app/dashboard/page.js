"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {DB} from '../../firebaseConfig';
import { useRouter } from "next/navigation";
import ClipLoader from "react-spinners/ClipLoader";
import "../style.css";

export default function Dashboard() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [tab, setTab] = useState("catalog");

    const [brands, setBrands] = useState([]);
    const [families, setFamilies] = useState([]);
    const [models, setModels] = useState([]);
    const [orders, setOrders] = useState([]);

    const [newBrand, setNewBrand] = useState({ name: "" });
    const [brandImage, setBrandImage] = useState(null);
    const [newFamily, setNewFamily] = useState({ brandId: "", name: "" });
    const [newModel, setNewModel] = useState({ brandId: "", familyId: "", name: "" });
    const [newProduct, setNewProduct] = useState({
        brandId: "",
        familyId: "",
        modelId: "",
        name: "",
        price: "",
        reference: "",
        image: "",
    });
    const [productImage, setProductImage] = useState(null);
    const [loadingBrand, setLoadingBrand] = useState(false);
    const [loadingFamily, setLoadingFamily] = useState(false);
    const [loadingModel, setLoadingModel] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const isAdmin = localStorage.getItem("isSHPRAAdmin");

        if (isAdmin !== "true") {
            router.push("/");
            return;
        }

        setIsAuthorized(true);
        fetchData();
    }, []);

    //Fetch data
    const fetchData = async () => {
        const b = await getDocs(collection(DB, "brands"));
        const f = await getDocs(collection(DB, "families"));
        const m = await getDocs(collection(DB, "models"));
        const o = await getDocs(collection(DB, "orders"));

        setBrands(b.docs.map(d => ({ id: d.id, ...d.data() })));
        setFamilies(f.docs.map(d => ({ id: d.id, ...d.data() })));
        setModels(m.docs.map(d => ({ id: d.id, ...d.data() })));
        setOrders(o.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    //Finish Alert
    const notify = (text) => {
        const id = Date.now();

        setNotifications((prev) => [...prev, { id, text }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000);
    };

    //Add Brand
    const addBrand = async (e) => {
        e.preventDefault();

        if (!newBrand.name || !brandImage) {
            alert("Veuillez remplir tous les champs (nom + image)");
            return;
        }

        try {
            setLoadingBrand(true);
            const storage = getStorage();

            const imageRef = ref(
                storage,
                `brands/${Date.now()}_${brandImage.name}`
            );

            await uploadBytes(imageRef, brandImage);
            const imageUrl = await getDownloadURL(imageRef);

            await addDoc(collection(DB, "brands"), {
                name: newBrand.name,
                logo: imageUrl,
            });

            notify("Marque ajoutée avec succès ✅");

            setNewBrand({ name: "" });
            setBrandImage(null);
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBrand(false);
        }
    };

    //Add Family
    const addFamily = async (e) => {
        e.preventDefault();

        if (!newFamily.brandId || !newFamily.name) {
            alert("Veuillez choisir une marque et entrer un nom");
            return;
        }

        try {
            setLoadingFamily(true);

            await addDoc(collection(DB, "families"), newFamily);

            notify("Famille ajoutée avec succès ✅");

            setNewFamily({ brandId: "", name: "" });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingFamily(false);
        }
    };

    //Add Modal
    const addModel = async (e) => {
        e.preventDefault();

        if (!newModel.brandId || !newModel.familyId || !newModel.name) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        try {
            setLoadingModel(true);

            await addDoc(collection(DB, "models"), newModel);

            notify("Modèle ajouté avec succès ✅");

            setNewModel({ brandId: "", familyId: "", name: "" });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingModel(false);
        }
    };

    //Add Product
    const addProduct = async (e) => {
        e.preventDefault();

        if (
            !newProduct.brandId ||
            !newProduct.familyId ||
            !newProduct.modelId ||
            !newProduct.name ||
            !newProduct.price ||
            !newProduct.reference ||
            !productImage
        ) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        try {
            setLoadingProduct(true);
            const storage = getStorage();

            const imageRef = ref(
                storage,
                `products/${Date.now()}_${productImage.name}`
            );

            await uploadBytes(imageRef, productImage);
            const imageUrl = await getDownloadURL(imageRef);

            await addDoc(collection(DB, "products"), {
                ...newProduct,
                price: Number(newProduct.price),
                image: imageUrl,
            });

            notify("Produit ajouté avec succès ✅");

            setNewProduct({
                brandId: "",
                familyId: "",
                modelId: "",
                name: "",
                price: "",
                reference: "",
                image: "",
            });

            setProductImage(null);
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProduct(false);
        }
    };

    //Update order status
    const updateOrderStatus = async (id, status) => {
        const refDoc = doc(DB, "orders", id);
        await updateDoc(refDoc, { status });

        notify("Statut mis à jour ✅");
        fetchData();
    };

    if (!isAuthorized) return null;

    return (
        <div className="dashboard">
            <div className="dash-header">
                <h2>Admin Dashboard</h2>

                <div className="tabs">
                <button onClick={() => setTab("catalog")} className={tab === "catalog" ? "active" : ""}>Catalogue</button>
                <button onClick={() => setTab("orders")} className={tab === "orders" ? "active" : ""}>
                    Commandes ({orders.length})
                </button>
                </div>
            </div>

            {tab === "catalog" && (
                <div className="sections">

                    {/* BRAND */}
                    <div className="card">
                        <h3>Ajouter une Marque</h3>
                        <form onSubmit={addBrand} className="form-grid-3">
                            <input required placeholder="Nom" value={newBrand.name} onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}/>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setBrandImage(e.target.files[0])}
                            />
                            <button type="submit" disabled={loadingBrand}>
                                {loadingBrand ? <ClipLoader size={20} color="#fff" /> : "Ajouter"}
                            </button>
                        </form>
                    </div>

                    {/* FAMILY */}
                    <div className="card">
                        <h3>Ajouter une Famille</h3>
                        <form onSubmit={addFamily} className="form-grid-3">
                            <select required onChange={(e) => setNewFamily({...newFamily, brandId: e.target.value})}>
                                <option value="">Marque</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <input required placeholder="Nom famille" onChange={(e) => setNewFamily({...newFamily, name: e.target.value})}/>
                            <button disabled={loadingFamily}>
                                {loadingFamily ? <ClipLoader size={20} color="#fff" /> : "Ajouter"}
                            </button>
                        </form>
                    </div>

                    {/* MODEL */}
                    <div className="card">
                        <h3>Ajouter un Modèle</h3>
                        <form onSubmit={addModel} className="form-grid-4">
                            <select required onChange={(e) => setNewModel({...newModel, brandId: e.target.value})}>
                                <option>Marque</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <select required onChange={(e) => setNewModel({...newModel, familyId: e.target.value})}>
                                <option>Famille</option>
                                {families.filter(f => f.brandId === newModel.brandId).map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <input required placeholder="Nom modèle" onChange={(e) => setNewModel({...newModel, name: e.target.value})}/>
                            <button disabled={loadingModel}>
                                {loadingModel ? <ClipLoader size={20} color="#fff" /> : "Ajouter"}
                            </button>
                        </form>
                    </div>

                    {/* PRODUCT */}
                    <div className="card big">
                        <h3>Ajouter un Produit</h3>
                        <form onSubmit={addProduct} className="form-stack">

                            <div className="form-grid-3">
                                <select onChange={(e) => setNewProduct({...newProduct, brandId: e.target.value})}>
                                    <option>Marque</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>

                                <select onChange={(e) => setNewProduct({...newProduct, familyId: e.target.value})}>
                                    <option>Famille</option>
                                    {families.filter(f => f.brandId === newProduct.brandId).map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>

                                <select onChange={(e) => setNewProduct({...newProduct, modelId: e.target.value})}>
                                    <option>Modèle</option>
                                    {models.filter(m => m.familyId === newProduct.familyId).map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-grid-2">
                                <input placeholder="Nom produit" onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}/>
                            </div>

                            <div className="form-grid-3">
                                <input type="number" placeholder="Prix" onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}/>
                                <input placeholder="Reference" onChange={(e) => setNewProduct({...newProduct, reference: e.target.value})}/>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setProductImage(e.target.files[0])}
                                />
                            </div>

                            <button className="full" disabled={loadingProduct}>
                                {loadingProduct ? <ClipLoader size={20} color="#fff" /> : "Ajouter Produit"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {tab === "orders" && (
                <div className="orders-container">
                    <div className="orders-header">
                        <h3>Gestion des Commandes</h3>
                        <div className="orders-stats">
                            <span className="pending">
                                {orders.filter(o => o.status === "pending").length} En attente
                            </span>
                            <span className="total">
                                {orders.length} Total
                            </span>
                        </div>
                    </div>

                    {/* ORDERS LIST */}
                    {orders.length > 0 ? (
                        <div className="orders-grid">
                            {orders.map((order) => (
                                <div key={order.id} className="order-card-pro">
                                    <div className="order-top">
                                        <div>
                                            <h3>#{order.id}</h3>
                                            <p style={{fontSize:'12px',color:'#62748e'}}>
                                                {new Date(order.createdAt?.seconds * 1000).toLocaleString("fr-FR")}
                                            </p>
                                        </div>

                                        <div className={`status ${order.status}`}>
                                            {order.status === "pending" && "En attente"}
                                            {order.status === "approved" && "Approuvée"}
                                            {order.status === "cancelled" && "Annulée"}
                                        </div>
                                    </div>

                                    {/* CLIENT */}
                                    <div className="order-client">
                                        <p><strong>{order.customer?.name}</strong></p>
                                        <p>{order.customer?.phone}</p>
                                        <p>{order.customer?.address}</p>
                                    </div>

                                    {/* ITEMS */}
                                    <div className="order-items">
                                        {order.items.map((item, i) => (
                                            <div key={i} className="order-item">
                                                <div>
                                                    <h4>{item.name}</h4>
                                                    <span>Ref: {item.reference}</span>
                                                </div>

                                                <div className="order-item-right">
                                                    <span>x{item.qty}</span>
                                                    <span>{item.price * item.qty} TND</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* TOTAL */}
                                    <div className="order-total">
                                        <span>Total</span>
                                        <strong>{order.total} TND</strong>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="order-actions">
                                        {order.status === "pending" && (
                                            <>
                                                <button
                                                    className="cancel"
                                                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                                                >
                                                    Annuler
                                                </button>

                                                <button
                                                    className="approve"
                                                    onClick={() => updateOrderStatus(order.id, "approved")}
                                                >
                                                    Approuver
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-orders">
                            <h3>Aucune commande</h3>
                            <p>Les commandes apparaîtront ici</p>
                        </div>
                    )}
                </div>
            )}

            <div className="toast-container">
                {notifications.map((n) => (
                    <div key={n.id} className="toast">
                    {n.text}
                    </div>
                ))}
            </div>
        </div>
    );
}