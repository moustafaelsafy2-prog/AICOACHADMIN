'use client';

import { useState, useEffect } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  unit: string;
  type: string;
  category?: { name: string };
  recipeItems?: { ingredient: Product, quantity: number }[];
};

type Category = {
  id: number;
  name: string;
};

import { useSettings } from '@/contexts/SettingsContext';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const currency = settings?.currency || 'ر.س';

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', categoryId: '', imageUrl: '', type: 'STANDARD', unit: 'قطعة' });
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [recipeItems, setRecipeItems] = useState<{ingredientId: number, quantity: string}[]>([]);

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

    const formattedRecipe = recipeItems.filter(r => r.ingredientId && r.quantity).map(r => ({
      ingredientId: r.ingredientId,
      quantity: parseFloat(r.quantity)
    }));

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price) || 0,
          stock: newProduct.type === 'COMPOSITE' ? 0 : parseFloat(newProduct.stock) || 0,
          categoryId: newProduct.categoryId ? parseInt(newProduct.categoryId) : null,
          imageUrl: newProduct.imageUrl || null,
          type: newProduct.type,
          unit: newProduct.unit,
          ingredients: formattedRecipe
        }),
      });
      if (res.ok) {
        setNewProduct({ name: '', price: '', stock: '', categoryId: '', imageUrl: '', type: 'STANDARD', unit: 'قطعة' });
        setRecipeItems([]);
        fetchData();
      } else {
         alert('حدث خطأ. تأكد من أنك تملك صلاحيات كافية.');
      }
    } catch (error) {
      console.error('Failed to add product', error);
    }
  };

  const handleAddRecipeItem = () => {
    setRecipeItems([...recipeItems, { ingredientId: 0, quantity: '' }]);
  };

  const updateRecipeItem = (index: number, field: string, value: string | number) => {
    const newItems = [...recipeItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setRecipeItems(newItems);
  };

  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
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
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع المنتج</label>
                <select value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="STANDARD">منتج نهائي (قياسي)</option>
                  <option value="COMPOSITE">منتج مركب (وصفة)</option>
                  <option value="INGREDIENT">مكون خام / مادة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
                <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="قطعة">قطعة</option>
                  <option value="جرام">جرام</option>
                  <option value="كجم">كجم</option>
                  <option value="مل">مل</option>
                  <option value="لتر">لتر</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المخزون المتوفر</label>
                <input disabled={newProduct.type === 'COMPOSITE'} required={newProduct.type !== 'COMPOSITE'} type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100 disabled:text-gray-400" />
              </div>
            </div>

            {newProduct.type === 'COMPOSITE' && (
              <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-indigo-900">مكونات الوصفة</h3>
                {recipeItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select required value={item.ingredientId} onChange={e => updateRecipeItem(idx, 'ingredientId', parseInt(e.target.value))} className="w-full px-2 py-1 text-sm border rounded">
                        <option value="">اختر المكون</option>
                        {products.filter(p => p.type === 'INGREDIENT' || p.type === 'STANDARD').map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input required type="number" step="0.01" placeholder="الكمية" value={item.quantity} onChange={e => updateRecipeItem(idx, 'quantity', e.target.value)} className="w-full px-2 py-1 text-sm border rounded" />
                    </div>
                    <button type="button" onClick={() => removeRecipeItem(idx)} className="text-red-500 p-1 mb-1 hover:text-red-700">حذف</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddRecipeItem} className="text-xs text-indigo-600 font-bold bg-white px-3 py-1 rounded shadow-sm border border-indigo-100 hover:bg-indigo-50">+ إضافة مكون</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رابط الصورة (اختياري)</label>
                <input type="url" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} className="w-full px-3 py-2 border rounded-md text-left" dir="ltr" placeholder="https://example.com/image.png" />
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
                <th className="px-6 py-3 font-medium">النوع</th>
                <th className="px-6 py-3 font-medium">التصنيف</th>
                <th className="px-6 py-3 font-medium">السعر</th>
                <th className="px-6 py-3 font-medium">المخزون المتوفر</th>
                <th className="px-6 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{p.id}</td>
                  <td className="px-6 py-4 font-medium">
                    {p.name}
                    {p.type === 'COMPOSITE' && p.recipeItems && (
                       <div className="text-xs text-gray-400 mt-1">
                         {p.recipeItems.length} مكونات
                       </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                     <span className={`px-2 py-1 rounded-full font-bold ${p.type === 'COMPOSITE' ? 'bg-purple-100 text-purple-700' : p.type === 'INGREDIENT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                       {p.type === 'COMPOSITE' ? 'مركب' : p.type === 'INGREDIENT' ? 'مكون' : 'نهائي'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{p.category?.name || '-'}</td>
                  <td className="px-6 py-4 text-indigo-600 font-bold">{p.price} {currency}</td>
                  <td className="px-6 py-4">
                    {p.type === 'COMPOSITE' ? (
                        <span className="text-gray-400 text-sm">حسب المكونات</span>
                    ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock < 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {p.stock} {p.unit}
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-rose-500 hover:text-rose-700 text-sm font-medium">حذف</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">لا توجد منتجات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
