import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Home, ShoppingBag, Grid3x3, Users, BarChart3, Settings, CreditCard, BookOpen } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  id: string;
  titleKey: string;
  icon: React.ElementType;
  descriptionKey: string;
  stepKeys: string[];
  detailKeys: string[];
  imageKey: string;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useLanguage();

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'categories',
      titleKey: 'tutorialStep1Title',
      icon: Grid3x3,
      descriptionKey: 'tutorialStep1Description',
      stepKeys: [
        'tutorialStep1Item1',
        'tutorialStep1Item2',
        'tutorialStep1Item3',
        'tutorialStep1Item4',
        'tutorialStep1Item5',
        'tutorialStep1Item6',
      ],
      detailKeys: [
        'tutorialStep1Detail1',
        'tutorialStep1Detail2',
        'tutorialStep1Detail3',
        'tutorialStep1Detail4',
        'tutorialStep1Detail5',
      ],
      imageKey: 'tutorialStep1Image',
    },
    {
      id: 'products',
      titleKey: 'tutorialStep2Title',
      icon: ShoppingBag,
      descriptionKey: 'tutorialStep2Description',
      stepKeys: [
        'tutorialStep2Item1',
        'tutorialStep2Item2',
        'tutorialStep2Item3',
        'tutorialStep2Item4',
        'tutorialStep2Item5',
        'tutorialStep2Item6',
        'tutorialStep2Item7',
        'tutorialStep2Item8',
        'tutorialStep2Item9',
        'tutorialStep2Item10',
      ],
      detailKeys: [
        'tutorialStep2Detail1',
        'tutorialStep2Detail2',
        'tutorialStep2Detail3',
        'tutorialStep2Detail4',
        'tutorialStep2Detail5',
        'tutorialStep2Detail6',
      ],
      imageKey: 'tutorialStep2Image',
    },
    {
      id: 'menu-config',
      titleKey: 'tutorialStep3Title',
      icon: Settings,
      descriptionKey: 'tutorialStep3Description',
      stepKeys: [
        'tutorialStep3Item1',
        'tutorialStep3Item2',
        'tutorialStep3Item3',
        'tutorialStep3Item4',
        'tutorialStep3Item5',
        'tutorialStep3Item6',
        'tutorialStep3Item7',
        'tutorialStep3Item8',
        'tutorialStep3Item9',
        'tutorialStep3Item10',
        'tutorialStep3Item11',
        'tutorialStep3Item12',
        'tutorialStep3Item13',
        'tutorialStep3Item14',
        'tutorialStep3Item15',
        'tutorialStep3Item16',
        'tutorialStep3Item17',
      ],
      detailKeys: [
        'tutorialStep3Detail1',
        'tutorialStep3Detail2',
        'tutorialStep3Detail3',
        'tutorialStep3Detail4',
        'tutorialStep3Detail5',
        'tutorialStep3Detail6',
        'tutorialStep3Detail7',
      ],
      imageKey: 'tutorialStep3Image',
    },
    {
      id: 'orders-manage',
      titleKey: 'tutorialStep4Title',
      icon: ShoppingBag,
      descriptionKey: 'tutorialStep4Description',
      stepKeys: [
        'tutorialStep4Item1',
        'tutorialStep4Item2',
        'tutorialStep4Item3',
        'tutorialStep4Item4',
        'tutorialStep4Item5',
        'tutorialStep4Item6',
        'tutorialStep4Item7',
        'tutorialStep4Item8',
        'tutorialStep4Item9',
        'tutorialStep4Item10',
        'tutorialStep4Item11',
        'tutorialStep4Item12',
        'tutorialStep4Item13',
        'tutorialStep4Item14',
        'tutorialStep4Item15',
        'tutorialStep4Item16',
        'tutorialStep4Item17',
        'tutorialStep4Item18',
        'tutorialStep4Item19',
      ],
      detailKeys: [
        'tutorialStep4Detail1',
        'tutorialStep4Detail2',
        'tutorialStep4Detail3',
        'tutorialStep4Detail4',
        'tutorialStep4Detail5',
        'tutorialStep4Detail6',
        'tutorialStep4Detail7',
      ],
      imageKey: 'tutorialStep4Image',
    },
    {
      id: 'public-menu',
      titleKey: 'tutorialStep5Title',
      icon: Home,
      descriptionKey: 'tutorialStep5Description',
      stepKeys: [
        'tutorialStep5Item1',
        'tutorialStep5Item2',
        'tutorialStep5Item3',
        'tutorialStep5Item4',
        'tutorialStep5Item5',
        'tutorialStep5Item6',
        'tutorialStep5Item7',
        'tutorialStep5Item8',
        'tutorialStep5Item9',
        'tutorialStep5Item10',
        'tutorialStep5Item11',
        'tutorialStep5Item12',
        'tutorialStep5Item13',
        'tutorialStep5Item14',
        'tutorialStep5Item15',
      ],
      detailKeys: [
        'tutorialStep5Detail1',
        'tutorialStep5Detail2',
        'tutorialStep5Detail3',
        'tutorialStep5Detail4',
        'tutorialStep5Detail5',
        'tutorialStep5Detail6',
        'tutorialStep5Detail7',
        'tutorialStep5Detail8',
      ],
      imageKey: 'tutorialStep5Image',
    },
    {
      id: 'analytics',
      titleKey: 'tutorialStep6Title',
      icon: BarChart3,
      descriptionKey: 'tutorialStep6Description',
      stepKeys: [
        'tutorialStep6Item1',
        'tutorialStep6Item2',
        'tutorialStep6Item3',
        'tutorialStep6Item4',
        'tutorialStep6Item5',
        'tutorialStep6Item6',
        'tutorialStep6Item7',
        'tutorialStep6Item8',
        'tutorialStep6Item9',
        'tutorialStep6Item10',
        'tutorialStep6Item11',
        'tutorialStep6Item12',
        'tutorialStep6Item13',
        'tutorialStep6Item14',
        'tutorialStep6Item15',
        'tutorialStep6Item16',
        'tutorialStep6Item17',
        'tutorialStep6Item18',
        'tutorialStep6Item19',
        'tutorialStep6Item20',
        'tutorialStep6Item21',
        'tutorialStep6Item22',
        'tutorialStep6Item23',
        'tutorialStep6Item24',
        'tutorialStep6Item25',
        'tutorialStep6Item26',
        'tutorialStep6Item27',
      ],
      detailKeys: [
        'tutorialStep6Detail1',
        'tutorialStep6Detail2',
        'tutorialStep6Detail3',
        'tutorialStep6Detail4',
        'tutorialStep6Detail5',
        'tutorialStep6Detail6',
        'tutorialStep6Detail7',
        'tutorialStep6Detail8',
      ],
      imageKey: 'tutorialStep6Image',
    },
    {
      id: 'customers',
      titleKey: 'tutorialStep7Title',
      icon: Users,
      descriptionKey: 'tutorialStep7Description',
      stepKeys: [
        'tutorialStep7Item1',
        'tutorialStep7Item2',
        'tutorialStep7Item3',
        'tutorialStep7Item4',
        'tutorialStep7Item5',
        'tutorialStep7Item6',
        'tutorialStep7Item7',
        'tutorialStep7Item8',
        'tutorialStep7Item9',
        'tutorialStep7Item10',
        'tutorialStep7Item11',
        'tutorialStep7Item12',
        'tutorialStep7Item13',
        'tutorialStep7Item14',
        'tutorialStep7Item15',
        'tutorialStep7Item16',
        'tutorialStep7Item17',
        'tutorialStep7Item18',
        'tutorialStep7Item19',
      ],
      detailKeys: [
        'tutorialStep7Detail1',
        'tutorialStep7Detail2',
        'tutorialStep7Detail3',
        'tutorialStep7Detail4',
        'tutorialStep7Detail5',
        'tutorialStep7Detail6',
        'tutorialStep7Detail7',
        'tutorialStep7Detail8',
        'tutorialStep7Detail9',
      ],
      imageKey: 'tutorialStep7Image',
    },
    {
      id: 'subscription',
      titleKey: 'tutorialStep8Title',
      icon: CreditCard,
      descriptionKey: 'tutorialStep8Description',
      stepKeys: [
        'tutorialStep8Item1',
        'tutorialStep8Item2',
        'tutorialStep8Item3',
        'tutorialStep8Item4',
        'tutorialStep8Item5',
        'tutorialStep8Item6',
        'tutorialStep8Item7',
        'tutorialStep8Item8',
        'tutorialStep8Item9',
        'tutorialStep8Item10',
        'tutorialStep8Item11',
        'tutorialStep8Item12',
        'tutorialStep8Item13',
        'tutorialStep8Item14',
        'tutorialStep8Item15',
        'tutorialStep8Item16',
        'tutorialStep8Item17',
        'tutorialStep8Item18',
        'tutorialStep8Item19',
        'tutorialStep8Item20',
        'tutorialStep8Item21',
      ],
      detailKeys: [
        'tutorialStep8Detail1',
        'tutorialStep8Detail2',
        'tutorialStep8Detail3',
        'tutorialStep8Detail4',
        'tutorialStep8Detail5',
        'tutorialStep8Detail6',
        'tutorialStep8Detail7',
      ],
      imageKey: 'tutorialStep8Image',
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="xl">
      <div className="relative">
        <button
          onClick={handleClose}
          className="absolute -top-2 right-0 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t(step.titleKey)}</h2>
              <p className="text-sm text-gray-500">
                {currentStep + 1} {t('tutorialStepOf')} {tutorialSteps.length}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-gray-700 mb-6 text-lg font-medium">{t(step.descriptionKey)}</p>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 mb-6 border-2 border-blue-200 min-h-[180px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Icon className="w-10 h-10 text-white" />
              </div>
              <p className="text-gray-700 font-medium max-w-md leading-relaxed">{t(step.imageKey)}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border-2 border-blue-200 rounded-lg p-5">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {t('tutorialStepByStepInstructions')}
              </h3>
              <ol className="space-y-3">
                {step.stepKeys.map((stepKey, index) => {
                  const stepText = t(stepKey);
                  const stepNumber = stepText.match(/^\d+/)?.[0] || (index + 1);
                  const stepContent = stepText.replace(/^\d+\.\s*/, '');
                  
                  return (
                    <li key={index} className="flex items-start gap-3 text-gray-800">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {stepNumber}
                      </span>
                      <span className="flex-1 leading-relaxed">{stepContent}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-5">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                💡 {t('tutorialImportantInfo')}
              </h3>
              <ul className="space-y-3">
                {step.detailKeys.map((detailKey, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-800">
                    <span className="text-green-600 font-bold mt-1 flex-shrink-0">✓</span>
                    <span className="text-sm leading-relaxed">{t(detailKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('tutorialPrevious')}
          </button>

          {/* Oculto en móvil, visible desde md */}
          <div className="hidden md:flex flex-wrap justify-center gap-2 flex-1 min-w-0">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600 w-10'
                    : 'bg-gray-300 hover:bg-gray-400 w-2.5'
                }`}
                aria-label={`${t('tutorialGoToStep')} ${index + 1}`}
              />
            ))}
          </div>

          {currentStep < tutorialSteps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              {t('tutorialNext')}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              {t('tutorialFinish')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
