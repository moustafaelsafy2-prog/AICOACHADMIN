'use client';

import { useState, useEffect } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: { name: string };
};

type Category = {
  id: number;
  name: string;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', categoryId: '' });
  const [newCategory, setNewCategory] = useState({ name: '' });

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          categoryId: newProduct.categoryId ? parseInt(newProduct.categoryId) : null,
        }),
      });
      if (res.ok) {
        setNewProduct({ name: '', price: '', stock: '', categoryId: '' });
        fetchData();
      } else {
         alert('حدث خطأ. تأكد من أنك تملك صلاحيات كافية.');
      }
    } catch (error) {
      console.error('Failed to add product', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.name }),
      });
      if (res.ok) {
        setNewCategory({ name: '' });
        fetchData();
      } else {
         alert('حدث خطأ. تأكد من أنك تملك صلاحيات كافية.');
      }
    } catch (error) {
      console.error('Failed to add category', error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if(!confirm('هل أنت متأكد من حذف المنتج؟')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else alert('غير مصرح لك بحذف المنتج');
    } catch (error) {
      console.error(error);
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if(!confirm('هل أنت متأكد من حذف التصنيف؟')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else alert('غير مصرح لك بحذف التصنيف');
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">إدارة المخزون</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Product Form */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">إضافة منتج جديد</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
              <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المخزون</label>
                <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <select value={newProduct.categoryId} onChange={e => setNewProduct({...newProduct, categoryId: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                <option value="">بدون تصنيف</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">إضافة منتج</button>
          </form>
        </section>

        {/* Categories Section */}
        <div className="space-y-8">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
              <h2 className="text-xl font-bold mb-4">إضافة تصنيف جديد</h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم التصنيف</label>
                  <input required type="text" value={newCategory.name} onChange={e => setNewCategory({name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition">إضافة تصنيف</button>
              </form>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold">قائمة التصنيفات</h2>
                </div>
                <ul className="divide-y divide-gray-100">
                    {categories.map(c => (
                        <li key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                            <span className="font-medium">{c.name}</span>
                            <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">حذف</button>
                        </li>
                    ))}
                    {categories.length === 0 && <li className="p-4 text-center text-gray-500">لا توجد تصنيفات</li>}
                </ul>
            </section>
        </div>
      </div>

      {/* Products Table */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold">قائمة المنتجات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">الرقم</th>
                <th className="px-6 py-3 font-medium">الاسم</th>
                <th className="px-6 py-3 font-medium">التصنيف</th>
                <th className="px-6 py-3 font-medium">السعر</th>
                <th className="px-6 py-3 font-medium">المخزون</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{p.id}</td>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-gray-500">{p.category?.name || '-'}</td>
                  <td className="px-6 py-4 text-blue-600 font-bold">{p.price} ر.س</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">حذف</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">لا توجد منتجات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
