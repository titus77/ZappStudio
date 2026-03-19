/**
 * Delete Datasource Confirmation Dialog
 *
 * Requires user to type datasource label to confirm deletion
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

interface DeleteDatasourceDialogProps {
  isOpen: boolean;
  datasourceName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteDatasourceDialog: FC<DeleteDatasourceDialogProps> = ({
  isOpen,
  datasourceName,
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
    if (confirmText !== datasourceName) {
      setError('Le nom de la source de données ne correspond pas');
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

  const isValid = confirmText === datasourceName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Supprimer la source de données</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              <strong>Attention :</strong> Cette action est irréversible. Elle supprimera définitivement
              la source de données et toutes les données associées de la base de données vectorielle.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Veuillez saisir <strong className="font-semibold text-gray-900">{datasourceName}</strong>{' '}
              pour confirmer la suppression.
            </p>
            <Input
              fullWidth
              type="text"
              placeholder="Saisir le nom de la source de données"
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
            label={isDeleting ? 'Suppression...' : 'Supprimer la source de données'}
            handleClick={handleConfirm}
            disabled={!isValid || isDeleting}
            loading={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-100 disabled:hover:bg-gray-100 disabled:text-gray-500"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
