import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        name: '', price: '', category: '', vtoType: 'upper-body', inventory: '', description: '', image: ''
    });

    // Fetch products on load
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();

            // Extract the array correctly from { products: [...], total: X }
            if (Array.isArray(data)) {
                setProducts(data);
            } else if (Array.isArray(data.products)) {
                setProducts(data.products);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products', error);
            setProducts([]); // Fallback to empty array on error
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                credentials: 'include', // <--- Sends cookie here as well
            });

            if (response.ok) {
                setProducts(products.filter((p) => p._id !== id));
            } else {
                const errData = await response.json();
                alert(errData.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // <--- CRITICAL FIX: Sends the HTTP-only auth cookie
                body: JSON.stringify({
                    ...formData,
                    sizes: ['S', 'M', 'L'], // Default sizes for MVP
                }),
            });

            if (response.ok) {
                const newProduct = await response.json();
                setProducts([...products, newProduct]);
                setFormData({ name: '', price: '', category: '', vtoType: 'upper-body', inventory: '', description: '', image: '' });
                alert('Product added successfully!');
            } else {
                const errData = await response.json();
                alert(errData.message || 'Failed to add product (Check if you are admin)');
            }
        } catch (error) {
            console.error('Error adding product', error);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2>Admin Dashboard</h2>

            <div style={{ marginBottom: '3rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>Add New Product</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                    <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleInputChange} required />
                    <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleInputChange} required />
                    <input type="text" name="category" placeholder="Category (e.g., Tops, Bottoms)" value={formData.category} onChange={handleInputChange} required />

                    <select name="vtoType" value={formData.vtoType} onChange={handleInputChange}>
                        <option value="upper-body">Upper Body</option>
                        <option value="lower-body">Lower Body</option>
                        <option value="dress">Dress</option>
                    </select>

                    <input type="number" name="inventory" placeholder="Stock Quantity" value={formData.inventory} onChange={handleInputChange} required />
                    <input type="text" name="image" placeholder="Image URL" value={formData.image} onChange={handleInputChange} required />

                    <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} style={{ gridColumn: 'span 2' }} required />

                    <button type="submit" style={{ gridColumn: 'span 2', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Add Product
                    </button>
                </form>
            </div>

            <h3>Current Inventory</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #000' }}>
                        <th>Name</th>
                        <th>Category</th>
                        <th>VTO Type</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product._id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem 0' }}>{product.name}</td>
                            <td>{product.category}</td>
                            <td>{product.vtoType}</td>
                            <td>${product.price}</td>
                            <td>{product.inventory}</td>
                            <td>
                                <button onClick={() => handleDelete(product._id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;