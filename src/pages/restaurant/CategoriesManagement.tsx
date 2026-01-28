import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,ArrowUp, ArrowDown, Search, Image as ImageIcon, FolderOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Category, Subscription } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const CategoriesManagement: React.FC = () => {
  const { restaurant } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; categoryId: string; categoryName: string }>({
    show: false,
    categoryId: '',
    categoryName: ''
  });
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (restaurant) {
      loadCategories();
      loadSubscription();
    }
  }, [restaurant]);

  const loadSubscription = async () => {
    if (!restaurant?.id) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error loading subscription:', error);
      return;
    }

    setCurrentSubscription(data);
  };

  const loadCategories = async () => {
    if (!restaurant?.id) return;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
      showToast('error', 'Error', 'No se pudieron cargar las categorías');
      return;
    }

    setCategories(data || []);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = async () => {
    if (!restaurant || !formData.name.trim()) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            restaurant_id: restaurant.id,
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            display_order: categories.length + 1,
            is_active: true,
          });

        if (error) throw error;
      }

      await loadCategories();
      handleCloseModal();

      showToast(
        'success',
        editingCategory ? t('categoryUpdated') : t('categoryCreated'),
        editingCategory
          ? t('messageCategoryUpdated')
          : t('messageCategoryCreated'),
        4000
      );
    } catch (error: any) {
      console.error('Error saving category:', error);
      showToast('error', 'Error', error.message || 'No se pudo guardar la categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      await loadCategories();

      showToast(
        'info',
        t('categoryDeleted'),
        t('messageCategoryDeleted'),
        4000
      );

      setDeleteConfirm({ show: false, categoryId: '', categoryName: '' });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showToast('error', 'Error', error.message || 'No se pudo eliminar la categoría');
    }
  };

  const openDeleteConfirm = (category: Category) => {
    setDeleteConfirm({
      show: true,
      categoryId: category.id,
      categoryName: category.name
    });
  };

  const toggleActive = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', categoryId);

      if (error) throw error;

      await loadCategories();

      showToast(
        'info',
        !category.is_active ? t('categoryActivated') : t('categoryDeactivated'),
        !category.is_active
          ? t('categoryActivatedDes')
          : t('categoryDeactivatedDes'),
        4000
      );
    } catch (error: any) {
      console.error('Error toggling category:', error);
      showToast('error', 'Error', error.message || 'No se pudo actualizar la categoría');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
    });
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(cat => cat.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    [newCategories[currentIndex], newCategories[newIndex]] = [newCategories[newIndex], newCategories[currentIndex]];

    try {
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      await loadCategories();
    } catch (error: any) {
      console.error('Error reordering categories:', error);
      showToast('error', 'Error', 'No se pudo reordenar las categorías');
    }
  };

  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();

    if (!draggedCategory || draggedCategory.id === targetCategory.id) {
      setDraggedCategory(null);
      return;
    }

    const draggedIndex = categories.findIndex(cat => cat.id === draggedCategory.id);
    const targetIndex = categories.findIndex(cat => cat.id === targetCategory.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    try {
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      await loadCategories();
      setDraggedCategory(null);
    } catch (error: any) {
      console.error('Error reordering categories:', error);
      showToast('error', 'Error', 'No se pudo reordenar las categorías');
      setDraggedCategory(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('categoryManagement')}</h1>
        <div className="flex gap-3">
          <a
            href={restaurant?.slug ? `/${restaurant.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!restaurant?.slug) {
                e.preventDefault();
                showToast('warning', 'No disponible', 'El menú público aún no está disponible', 3000);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            {t('viewMenu')}
          </a>
          <Button
            icon={Plus}
            onClick={() => setShowModal(true)}
          >
            {t('newCategory')}
          </Button>
        </div>
      </div>

      {/* Stats and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalCategories')}</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('activeCategories')}</p>
              <p className="text-2xl font-bold text-gray-900">{categories.filter(c => c.is_active).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
              <EyeOff className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('inactiveCategories')}</p>
              <p className="text-2xl font-bold text-gray-900">{categories.filter(c => !c.is_active).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`${t('search')} categories...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {searchTerm === '' && categories.length > 1 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
            <GripVertical className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p>
              <strong className="text-blue-700">Tip: </strong>{t('categoriesTip')}
            </p>
          </div>
        )}
      </div>

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {categories.length === 0 ? t('noCategoriesCreated') : 'No categories found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {categories.length === 0 ? t('createFirstCategory') : 'Try different search terms.'}
          </p>
          {categories.length === 0 && (
            <Button
              icon={Plus}
              onClick={() => setShowModal(true)}
            >
              {t('create')} {t('newCategory')}
            </Button>
          )}
        </div>
      ) : (
      <div className="space-y-3">
        {filteredCategories.map((category, index) => (
          <div
            key={category.id}
            draggable={searchTerm === ''}
            onDragStart={(e) => handleDragStart(e, category)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, category)}
            onDragEnd={handleDragEnd}
            className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
              searchTerm === '' ? 'cursor-move' : ''
            } ${
              draggedCategory?.id === category.id
                ? 'opacity-50 scale-95 border-blue-400'
                : 'border-gray-200 hover:shadow-md hover:border-blue-300'
            }`}
          >
            <div className="flex flex-wrap md:flex-nowrap items-center gap-4 p-4 overflow-hidden">
              {/* Drag Handle */}
              {searchTerm === '' && (
                <div className="flex-shrink-0">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              )}
      
              {/* Order Number */}
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">#{category.display_order}</span>
              </div>
      
              {/* Category Icon */}
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                {category.icon ? (
                  <span className="text-3xl">{category.icon}</span>
                ) : (
                  <FolderOpen className="w-8 h-8 text-gray-300" />
                )}
              </div>
      
              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {category.name}
                  </h3>
                  <Badge variant={category.is_active ? 'success' : 'gray'}>
                    {category.is_active ? t('active') : t('inactive')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {category.description || 'Sin descripción'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('categoriesCreated')}: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </div>
      
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end w-full md:w-auto mt-2 md:mt-0">
                <button
                  onClick={() => moveCategory(category.id, 'up')}
                  disabled={index === 0 || searchTerm !== ''}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={searchTerm !== '' ? 'Clear search to reorder' : 'Move up'}
                >
                  <ArrowUp className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={index === filteredCategories.length - 1 || searchTerm !== ''}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={searchTerm !== '' ? 'Clear search to reorder' : 'Move down'}
                >
                  <ArrowDown className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => toggleActive(category.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {category.is_active ? (
                    <EyeOff className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-600" />
                  )}
                </button>
                <button
                  onClick={() => openDeleteConfirm(category)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      )}

      {/* Category Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? `${t('edit')} ${t('category')}` : t('newCategory')}
        size="lg"
      >
        <div className="space-y-5">
          {/* Form Section */}
          <div className="space-y-4">
            <Input
              label={`${t('categoryName')}*`}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('categoriesNameDes')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder={t('categoriesDescription')}
              />
            </div>
          </div>

          {/* Icon Section */}
          <div className="bg-gray-50 rounded-lg p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-600" />
              {t('categoryAppearance')}
            </h4>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('catIconSec')}
              </label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🍕 🥤 🍰"
              />
              <p className="text-xs text-gray-500">
                {t('catIconDes')}
              </p>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {t('catObligatry')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCloseModal}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name.trim()}
              >
                {editingCategory ? t('update') : t('create')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, categoryId: '', categoryName: '' })}
        onConfirm={() => handleDelete(deleteConfirm.categoryId)}
        title={t('deleteCategoryTitle')}
        message={t('deleteCategoryMessage')}
        confirmText={t('deleteCategoryButton')}
        cancelText={t('cancel')}
        variant="danger"
        itemName={deleteConfirm.categoryName}
      />
    </div>
  );
};