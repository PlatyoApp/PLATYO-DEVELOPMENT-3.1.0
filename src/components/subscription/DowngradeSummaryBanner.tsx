import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Archive, FolderX, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

interface PlanChangeLog {
  id: string;
  old_plan_name: string;
  new_plan_name: string;
  old_max_products: number;
  new_max_products: number;
  old_max_categories: number;
  new_max_categories: number;
  products_archived: number;
  categories_deactivated: number;
  affected_product_ids: string[];
  affected_category_ids: string[];
  change_reason: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface DowngradeSummaryBannerProps {
  restaurantId: string;
  onViewArchived?: () => void;
}

export function DowngradeSummaryBanner({ restaurantId, onViewArchived }: DowngradeSummaryBannerProps) {
  const { t } = useLanguage();
  const [latestChange, setLatestChange] = useState<PlanChangeLog | null>(null);
  const [affectedProducts, setAffectedProducts] = useState<Product[]>([]);
  const [affectedCategories, setAffectedCategories] = useState<Category[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestPlanChange();
  }, [restaurantId]);

  const loadLatestPlanChange = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: changes, error } = await supabase
        .from('plan_change_logs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (changes && (changes.products_archived > 0 || changes.categories_deactivated > 0)) {
        setLatestChange(changes);

        if (changes.affected_product_ids && changes.affected_product_ids.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, sku')
            .in('id', changes.affected_product_ids);

          if (products) setAffectedProducts(products);
        }

        if (changes.affected_category_ids && changes.affected_category_ids.length > 0) {
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', changes.affected_category_ids);

          if (categories) setAffectedCategories(categories);
        }
      }
    } catch (error) {
      console.error('Error loading plan change log:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !latestChange || dismissed) {
    return null;
  }

  const isDowngrade = latestChange.new_max_products < latestChange.old_max_products ||
                      latestChange.new_max_categories < latestChange.old_max_categories;

  if (!isDowngrade) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-lg shadow-md mb-6">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {t('planChangeDetected')}
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                {t('planChangedFrom')} <span className="font-semibold">{latestChange.old_plan_name}</span> {t('to')} <span className="font-semibold">{latestChange.new_plan_name}</span>.
              </p>

              <div className="flex flex-wrap gap-4 mb-3">
                {latestChange.products_archived > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                    <Archive className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600">{t('productsArchived')}</p>
                      <p className="text-lg font-bold text-gray-900">{latestChange.products_archived}</p>
                    </div>
                  </div>
                )}
                {latestChange.categories_deactivated > 0 && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                    <FolderX className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600">{t('categoriesDeactivated')}</p>
                      <p className="text-lg font-bold text-gray-900">{latestChange.categories_deactivated}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-orange-700 hover:text-orange-800 font-medium flex items-center gap-1"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {t('hideDetails')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {t('viewDetails')}
                    </>
                  )}
                </button>
                {onViewArchived && (
                  <button
                    onClick={onViewArchived}
                    className="text-sm text-blue-700 hover:text-blue-800 font-medium"
                  >
                    {t('manageArchivedItems')}
                  </button>
                )}
              </div>

              {showDetails && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  {affectedProducts.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {t('archivedProducts')}:
                      </p>
                      <ul className="space-y-1">
                        {affectedProducts.map((product) => (
                          <li key={product.id} className="text-sm text-gray-700 flex items-center gap-2">
                            <Archive className="w-3 h-3 text-orange-600" />
                            {product.name} {product.sku && <span className="text-gray-500">({product.sku})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {affectedCategories.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {t('deactivatedCategories')}:
                      </p>
                      <ul className="space-y-1">
                        {affectedCategories.map((category) => (
                          <li key={category.id} className="text-sm text-gray-700 flex items-center gap-2">
                            <FolderX className="w-3 h-3 text-orange-600" />
                            {category.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>{t('note')}:</strong> {t('downgradeSummaryNote')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
