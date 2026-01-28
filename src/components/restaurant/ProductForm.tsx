import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Upload, Image as ImageIcon, DollarSign } from 'lucide-react';
import { Category, Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ProductFormProps {
  categories: Category[];
  product?: Product | null;
  onSave: (productData: any) => void;
  onCancel: () => void;
}

interface ProductVariation {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
}

interface ProductIngredient {
  id: string;
  name: string;
  optional: boolean;
  extra_cost?: number;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  categories,
  product,
  onSave,
  onCancel
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    status: 'active' as const,
    sku: '',
    image: ''
  });
  const [variations, setVariations] = useState<ProductVariation[]>([
    { id: '1', name: 'Default', price: 0 }
  ]);
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        status: product.status,
        sku: product.sku || '',
        image: product.images?.[0] || ''
      });
      setVariations(product.variations.length > 0 ? product.variations : [
        { id: '1', name: 'Default', price: 0 }
      ]);
      setIngredients(product.ingredients || []);
    }
  }, [product]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVariationChange = (index: number, field: string, value: any) => {
    setVariations(prev => prev.map((variation, i) => 
      i === index ? { ...variation, [field]: value } : variation
    ));
  };

  const addVariation = () => {
    setVariations(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', price: 0 }
    ]);
  };

  const removeVariation = (index: number) => {
    if (variations.length > 1) {
      setVariations(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    setIngredients(prev => prev.map((ingredient, i) => 
      i === index ? { ...ingredient, [field]: value } : ingredient
    ));
  };

  const addIngredient = () => {
    setIngredients(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', optional: false, extra_cost: 0 }
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category_id || variations.length === 0) {
      alert(t('fillRequiredFields'));
      return;
    }

    const { image, ...formDataWithoutImage } = formData;

    const productData = {
      ...formDataWithoutImage,
      images: image ? [image] : [],
      variations: variations.filter(v => v.name.trim() && v.price >= 0),
      ingredients: ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ing.optional ? ing : { ...ing, extra_cost: undefined })
    };

    onSave(productData);
  };

  const getMinPrice = () => {
    const validVariations = variations.filter(v => v.price > 0);
    return validVariations.length > 0 ? Math.min(...validVariations.map(v => v.price)) : 0;
  };

  const getMaxPrice = () => {
    const validVariations = variations.filter(v => v.price > 0);
    return validVariations.length > 0 ? Math.max(...validVariations.map(v => v.price)) : 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('productName')} *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('enterProductName')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('category')} *
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => handleInputChange('category_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">{t('selectCategory')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('description')}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder={t('enterProductDescription')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU
          </label>
          <Input
            type="text"
            value={formData.sku}
            onChange={(e) => handleInputChange('sku', e.target.value)}
            placeholder={t('productSKU')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('status')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="active">{t('active')}</option>
            <option value="out_of_stock">{t('outOfStock')}</option>
            <option value="archived">{t('archived')}</option>
          </select>
        </div>
      </div>

      {/* Product Image */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <label className="block text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          {t('productImage')}
        </label>

        {/* Add Image from Device */}
        <div className="mb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert(`${file.name} ${t('fileTooLarge')}`);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({
                          ...prev,
                          image: reader.result as string
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="product-image"
                  disabled={!!formData.image}
                />
                <span className={`inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium transition-all shadow-sm w-full justify-center ${
                  formData.image ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}>
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.image ? t('uploadedImage') : t('uploadImageFromDevice')}
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">ℹ</span>
              <span>{t('uploadHighQualityImage')}</span>
            </p>
          </div>
        </div>

        {/* Image Preview */}
        {formData.image ? (
          <div className="flex items-center gap-4 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="relative group flex-shrink-0">
              <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={formData.image}
                  alt={t('productPreview')}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleImageRemove}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">{t('productImage')}</p>
              <p className="text-xs text-gray-500">{t('imageWillShowInMenu')}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">{t('noImageAdded')}</p>
            <p className="text-xs text-gray-400">{t('uploadImageToShow')}</p>
          </div>
        )}
      </div>

      {/* Product Variations */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            {t('variationsAndPrices')} *
          </label>
          <div className="flex items-center gap-4 text-sm">
            {variations.length > 1 && (
              <>
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg shadow-sm">
                  <span className="text-gray-600">{t('from')}:</span>
                  <span className="font-bold text-green-700">${getMinPrice().toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg shadow-sm">
                  <span className="text-gray-600">{t('to')}:</span>
                  <span className="font-bold text-green-700">${getMaxPrice().toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={addVariation}
          >
            {t('addVariation')}
          </Button>
        </div>

        <div className="space-y-3">
          {variations.map((variation, index) => (
            <div key={variation.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    value={variation.name}
                    onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                    placeholder={t('variationNamePlaceholder')}
                  />
                </div>
                {variations.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeVariation(index)}
                    className="text-red-600 hover:text-red-700"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('priceRequired')} *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={variation.price}
                      onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('comparePrice')}</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      value={variation.compare_at_price || ''}
                      onChange={(e) => handleVariationChange(index, 'compare_at_price', parseFloat(e.target.value) || undefined)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('priceBeforeDiscount')}</p>
                </div>
              </div>

              {variation.compare_at_price && variation.compare_at_price > variation.price && (
                <div className="mt-3 pl-11 flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                    {Math.round(((variation.compare_at_price - variation.price) / variation.compare_at_price) * 100)}% OFF
                  </span>
                  <span className="text-gray-600">
                    {t('savings')}: <span className="font-medium text-green-600">${(variation.compare_at_price - variation.price).toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('ingredientsLabel')}
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={addIngredient}
          >
            {t('addIngredient')}
          </Button>
        </div>
        
        {ingredients.length > 0 && (
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div key={ingredient.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    placeholder={t('ingredientName')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ingredient.optional}
                    onChange={(e) => handleIngredientChange(index, 'optional', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{t('optionalLabel')}</span>
                </div>
                {ingredient.optional && (
                  <div className="w-32">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        value={ingredient.extra_cost || 0}
                        onChange={(e) => handleIngredientChange(index, 'extra_cost', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="pl-8"
                      />
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => removeIngredient(index)}
                  className="text-red-600 hover:text-red-700"
                />
              </div>
            ))}
          </div>
        )}
        
        {ingredients.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 text-sm">{t('noIngredientsAdded')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('ingredientsAreOptional')}</p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          icon={X}
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          icon={Save}
        >
          {product ? t('updateProduct') : t('createProduct')}
        </Button>
      </div>
    </form>
  );
};
