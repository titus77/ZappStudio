import { deleteAccount } from '@src/react/features/account/clients';
import { Input as CustomInput } from '@src/react/shared/components/ui/input';
import Modal from '@src/react/shared/components/ui/modals/Modal';
import { Button as CustomButton } from '@src/react/shared/components/ui/newDesign/button';
import { SmythAPIError } from '@src/react/shared/types/api-results.types';
import { errorToast, successToast } from '@src/shared/components/toast';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

type Props = {
  onClose: () => void;
};

const DeleteAccountModal = ({ onClose }: Props) => {
  const deleteConfirmationWord = 'DELETE';
  const [confirmationWord, setConfirmationWord] = useState('');

  const deleteAccMutation = useMutation({
    mutationFn: deleteAccount,

    onError: (error: SmythAPIError) => {
      errorToast(error.error.message ?? 'Erreur lors de la suppression du compte');
      console.log(error);
    },
    onSuccess: () => {
      successToast('Compte supprimé avec succès');
    },
  });

  return (
    <Modal onClose={onClose} title="Supprimer le compte">
      <div className="modal-body">
        <div className="flex flex-col gap-4 mt-3">
          <p>Êtes-vous sûr de vouloir supprimer votre compte ?</p>
          <p>
            Cette action est irréversible. Si vous supprimez votre compte, vous perdrez toutes vos données,
            y compris vos abonnements, membres de l'équipe et toute autre information associée à
            votre compte.
          </p>

          <p>
            Pour confirmer, veuillez saisir le mot{' '}
            <strong className="text-red-500">{deleteConfirmationWord}</strong> dans le champ ci-dessous.
          </p>

          <CustomInput
            value={confirmationWord}
            onChange={(e) => setConfirmationWord(e.target.value)}
            fullWidth
            autoFocus
            placeholder="Tapez DELETE pour confirmer"
            error={deleteAccMutation.isError}
            errorMessage="Une erreur s'est produite lors de la suppression de votre compte. Veuillez réessayer ultérieurement."
          />

          <CustomButton
            fullWidth
            disabled={confirmationWord !== deleteConfirmationWord || deleteAccMutation.isLoading}
            handleClick={async () => {
              if (confirmationWord !== deleteConfirmationWord) return;
              if (deleteAccMutation.isLoading) return;

              // Delete account
              await deleteAccMutation.mutateAsync();
              // redirect to a page that informs the user that the account was deleted
              window.location.href = '/account-deleted';
            }}
            loading={deleteAccMutation.isLoading}
          >
            Supprimer le compte
          </CustomButton>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;
