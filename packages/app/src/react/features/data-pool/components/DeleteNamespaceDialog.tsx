/**
 * Delete Namespace Confirmation Dialog
 *
 * Requires user to type namespace label to confirm deletion
 */

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/react/shared/components/ui/dialog';
import { Input } from '@src/react/shared/components/ui/input';
import { Button as CustomButton } from '@src/react/shared/components/ui/newDesign/button';
import { ChangeEvent, FC, useEffect, useState } from 'react';

interface DeleteNamespaceDialogProps {
  isOpen: boolean;
  namespaceName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteNamespaceDialog: FC<DeleteNamespaceDialogProps> = ({
  isOpen,
  namespaceName,
  onClose,
  onConfirm,
}) => {
  const [confirmText, setConfirmText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirmTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
    setError(null);
  };

  const handleConfirm = async () => {
    if (confirmText !== namespaceName) {
      setError('Le nom de l\'espace de données ne correspond pas');
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handling is done in parent component
      setIsDeleting(false);
    }
  };

  const isValid = confirmText === namespaceName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Supprimer l'espace de données</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              <strong>Attention :</strong> Cette action est irréversible. Elle supprimera définitivement
              l'espace de données et toutes les données associées.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Veuillez saisir <strong className="font-semibold text-gray-900">{namespaceName}</strong>{' '}
              pour confirmer la suppression.
            </p>
            <Input
              fullWidth
              type="text"
              placeholder="Saisir le nom de l'espace de données"
              value={confirmText}
              onChange={handleConfirmTextChange}
              disabled={isDeleting}
              error={!!error}
              errorMessage={error || undefined}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <CustomButton
            variant="primary"
            label={isDeleting ? 'Suppression...' : 'Supprimer l\'espace de données'}
            handleClick={handleConfirm}
            disabled={!isValid || isDeleting}
            loading={isDeleting}
            // when not disabled (only when not disabled!!)
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-100 disabled:hover:bg-gray-100 disabled:text-gray-500"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
