import React from 'react';
import { Button } from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

interface TermsAndConditionsProps {
  onAccept?: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onAccept }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="prose prose-sm max-w-none text-gray-700 max-h-[60vh] overflow-y-auto pr-4">
        {/* Section 1 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            1. {t('termsSection1Title')}
          </h3>
          <p>{t('termsSection1Content')}</p>
        </section>

        {/* Section 2 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            2. {t('termsSection2Title')}
          </h3>
          <p>{t('termsSection2Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection2Item1')}</li>
            <li>{t('termsSection2Item2')}</li>
            <li>{t('termsSection2Item3')}</li>
            <li>{t('termsSection2Item4')}</li>
            <li>{t('termsSection2Item5')}</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            3. {t('termsSection3Title')}
          </h3>
          <p>{t('termsSection3Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection3Item1')}</li>
            <li>{t('termsSection3Item2')}</li>
            <li>{t('termsSection3Item3')}</li>
            <li>{t('termsSection3Item4')}</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            4. {t('termsSection4Title')}
          </h3>
          <p>{t('termsSection4Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection4Item1')}</li>
            <li>{t('termsSection4Item2')}</li>
            <li>{t('termsSection4Item3')}</li>
            <li>{t('termsSection4Item4')}</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            5. {t('termsSection5Title')}
          </h3>
          <p>{t('termsSection5Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection5Item1')}</li>
            <li>{t('termsSection5Item2')}</li>
            <li>{t('termsSection5Item3')}</li>
            <li>{t('termsSection5Item4')}</li>
            <li>{t('termsSection5Item5')}</li>
            <li>{t('termsSection5Item6')}</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            6. {t('termsSection6Title')}
          </h3>
          <p>{t('termsSection6Content1')}</p>
          <p className="mt-2">{t('termsSection6Content2')}</p>
        </section>

        {/* Section 7 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            7. {t('termsSection7Title')}
          </h3>
          <p>{t('termsSection7Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection7Item1')}</li>
            <li>{t('termsSection7Item2')}</li>
            <li>{t('termsSection7Item3')}</li>
          </ul>
          <p className="mt-2">{t('termsSection7Content2')}</p>
        </section>

        {/* Section 8 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            8. {t('termsSection8Title')}
          </h3>
          <p>{t('termsSection8Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection8Item1')}</li>
            <li>{t('termsSection8Item2')}</li>
            <li>{t('termsSection8Item3')}</li>
          </ul>
          <p className="mt-2">{t('termsSection8Content2')}</p>
        </section>

        {/* Section 9 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            9. {t('termsSection9Title')}
          </h3>
          <p>{t('termsSection9Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection9Item1')}</li>
            <li>{t('termsSection9Item2')}</li>
            <li>{t('termsSection9Item3')}</li>
            <li>{t('termsSection9Item4')}</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            10. {t('termsSection10Title')}
          </h3>
          <p>{t('termsSection10Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection10Item1')}</li>
            <li>{t('termsSection10Item2')}</li>
            <li>{t('termsSection10Item3')}</li>
            <li>{t('termsSection10Item4')}</li>
          </ul>
        </section>

        {/* Section 11 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            11. {t('termsSection11Title')}
          </h3>
          <p>{t('termsSection11Content')}</p>
        </section>

        {/* Section 12 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            12. {t('termsSection12Title')}
          </h3>
          <p>{t('termsSection12Content')}</p>
        </section>

        {/* Section 13 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            13. {t('termsSection13Title')}
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>{t('termsSection13Item1Label')}:</strong> {t('termsSection13Item1')}
            </li>
            <li>
              <strong>{t('termsSection13Item2Label')}:</strong> {t('termsSection13Item2')}
            </li>
            <li>
              <strong>{t('termsSection13Item3Label')}:</strong> {t('termsSection13Item3')}
            </li>
            <li>
              <strong>{t('termsSection13Item4Label')}:</strong> {t('termsSection13Item4')}
            </li>
          </ul>
        </section>

        {/* Section 14 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            14. {t('termsSection14Title')}
          </h3>
          <p>{t('termsSection14Content')}</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('termsSection14Item1')}</li>
            <li>{t('termsSection14Item2')}</li>
          </ul>
        </section>

        {/* Footer */}
        <section className="bg-gray-50 p-4 rounded-lg mt-6">
          <p className="text-sm text-gray-600 italic">
            <strong>{t('termsLastUpdate')}:</strong> {t('termsLastUpdateDate')}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {t('termsAcceptDisclaimer')}
          </p>
        </section>
      </div>

      {onAccept && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={onAccept}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            {t('acceptTermsAndConditionsButton')}
          </Button>
        </div>
      )}
    </div>
  );
};