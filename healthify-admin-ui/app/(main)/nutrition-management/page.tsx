'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { CrudLayout } from '@/components/CrudLayout';
import { uploadImage } from '@/lib/upload';
import { FaEdit, FaTrashAlt, FaSpinner, FaImage, FaUpload, FaTimes, FaUtensils, FaClock, FaFire, FaListUl, FaFileAlt } from 'react-icons/fa';

interface NutritionItem {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  type: 'Recipe' | 'Plan' | 'Tip' | string;
  image?: string;
  calories: number;
  prepTime: number;
  ingredients: string[];
  instructions: string;
  createdAt: string;
}

interface NutritionFormProps {
  onSuccess: () => void;
  initialData: NutritionItem | null;
  onClose: () => void;
}

const NutritionForm: React.FC<NutritionFormProps> = ({ onSuccess, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: (initialData?.type as string) || 'Recipe',
    calories: initialData?.calories?.toString() || '',
    prepTime: initialData?.prepTime?.toString() || '',
    ingredientsText: initialData?.ingredients?.join('\n') || '',
    instructions: initialData?.instructions || '',
    image: initialData?.image || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initialData;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const result = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: result.url }));
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const ingredients = formData.ingredientsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        type: formData.type,
        image: formData.image,
        calories: Number(formData.calories) || 0,
        prepTime: Number(formData.prepTime) || 0,
        ingredients,
        instructions: formData.instructions,
      };

      const method: 'POST' | 'PUT' = isEdit ? 'PUT' : 'POST';
      const endpoint = isEdit ? `/nutrition/${initialData!._id}` : '/nutrition';

      await apiFetch(endpoint, method, payload);

      alert(`Nutrition item ${isEdit ? 'updated' : 'created'} successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} nutrition item.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
          <FaUtensils className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Edit Recipe' : 'Create New Recipe'}
          </h3>
          <p className="text-sm text-gray-500">Fill in the details below</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FaTimes className="text-red-500 text-xs" />
          </div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Grilled Salmon Bowl"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
            />
          </div>

          {/* Type and Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaFileAlt className="inline mr-1 text-gray-400" /> Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              >
                <option value="Recipe">Recipe</option>
                <option value="Plan">Plan</option>
                <option value="Tip">Tip</option>
              </select>
            </div>

            {/* Calories */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaFire className="inline mr-1 text-orange-400" /> Calories
              </label>
              <input
                type="number"
                name="calories"
                value={formData.calories}
                onChange={handleChange}
                min={0}
                placeholder="420"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              />
            </div>

            {/* Prep Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FaClock className="inline mr-1 text-blue-400" /> Prep (min)
              </label>
              <input
                type="number"
                name="prepTime"
                value={formData.prepTime}
                onChange={handleChange}
                min={0}
                placeholder="25"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="A brief description of the recipe..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaImage className="inline mr-1 text-gray-400" /> Recipe Image
            </label>

            {formData.image ? (
              <div className="relative group">
                <img
                  src={formData.image}
                  alt="Recipe preview"
                  className="w-full h-48 object-cover rounded-xl border border-gray-200"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaUpload className="text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  relative h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                  ${dragActive
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                  }
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {uploading ? (
                    <>
                      <FaSpinner className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                      <p className="text-sm text-gray-500">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <FaUpload className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        Drop image here or click to upload
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WebP up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Ingredients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FaListUl className="inline mr-1 text-gray-400" /> Ingredients
              <span className="font-normal text-gray-400 ml-1">(one per line)</span>
            </label>
            <textarea
              name="ingredientsText"
              value={formData.ingredientsText}
              onChange={handleChange}
              rows={6}
              placeholder="2 salmon fillets&#10;1 cup quinoa&#10;2 cups mixed greens&#10;1 avocado, sliced&#10;2 tbsp olive oil"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white resize-none font-mono text-sm"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={8}
              placeholder="1. Preheat grill to medium-high heat.&#10;2. Season salmon with salt and pepper.&#10;3. Grill for 4-5 minutes per side.&#10;4. Cook quinoa according to package directions.&#10;5. Assemble bowls with quinoa, greens, and salmon.&#10;6. Top with avocado and drizzle with olive oil."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/25"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{isEdit ? 'Update Recipe' : 'Create Recipe'}</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default function NutritionManagementPage() {
  const [items, setItems] = useState<NutritionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NutritionItem | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const limit = 10;
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', String(limit));
      if (search.trim()) {
        query.set('q', search.trim());
      }

      const data = await apiFetch<{
        page: number;
        pages: number;
        data: NutritionItem[];
      }>(`/nutrition?${query.toString()}`, 'GET');

      setItems(data.data);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load nutrition items.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleEdit = (item: NutritionItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this nutrition item? This cannot be undone.')) return;

    try {
      await apiFetch(`/nutrition/${id}`, 'DELETE');
      alert('Nutrition item deleted successfully!');
      fetchItems();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleCloseForm = () => {
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Recipe':
        return 'bg-emerald-100 text-emerald-700';
      case 'Plan':
        return 'bg-blue-100 text-blue-700';
      case 'Tip':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const tableContent = (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Recipe</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Calories</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prep Time</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={7} className="text-center py-12">
                <FaSpinner className="animate-spin inline mr-2 text-emerald-500" />
                <span className="text-gray-500">Loading recipes...</span>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-red-500">{error}</td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaUtensils className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No recipes found</p>
                  <p className="text-gray-400 text-sm mt-1">Click 'Add New' to create your first recipe</p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
                  {(page - 1) * 10 + index + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FaUtensils className="text-gray-300" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-gray-400 truncate max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(item.type)}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <FaFire className="text-orange-400" />
                    <span>{item.calories} cal</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <FaClock className="text-blue-400" />
                    <span>{item.prepTime || 0} min</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <CrudLayout
      title="Nutrition Management"
      subtitle="Manage recipes, meal plans, and nutrition tips for your users."
      onRefresh={fetchItems}
      searchValue={search}
      onSearchChange={handleSearchChange}
      showForm={showForm}
      setShowForm={setShowForm}
      form={
        <NutritionForm
          onSuccess={fetchItems}
          initialData={editingItem}
          onClose={handleCloseForm}
        />
      }
    >
      {tableContent}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Page <span className="font-semibold">{totalPages === 0 ? 0 : page}</span> of <span className="font-semibold">{totalPages}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => (p >= totalPages ? p : p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </CrudLayout>
  );
}
