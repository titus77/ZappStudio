/**
 * Free Plan Upgrade Prompt
 *
 * Shows upgrade prompt for free plan users
 */

import { Button as CustomButton } from '@src/react/shared/components/ui/newDesign/button';
import { FC } from 'react';

interface FreePlanUpgradePromptProps {
  namespaceName: string;
  onUpgrade: () => void;
}

export const FreePlanUpgradePrompt: FC<FreePlanUpgradePromptProps> = ({
  namespaceName,
  onUpgrade,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="mb-4">
          <div className="inline-block px-3 py-1 mb-3 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
            Offre gratuite
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Créer un espace de données</h2>
        </div>

        {/* Provider */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
          <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
            Par défaut
          </div>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
            {namespaceName}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <CustomButton
            variant="secondary"
            label="Basique (fonctionnalités limitées)"
            className="flex-1"
            disabled
          />
          <CustomButton
            label="Passer à l'offre Startup"
            handleClick={onUpgrade}
            className="flex-1"
          />
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          Sans passer à l'offre Startup, vous ne pourrez pas utiliser les applications RAG
          ni les autres fonctionnalités avancées.
        </p>
      </div>
    </div>
  );
};

