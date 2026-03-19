import { UserModel } from '@react/features/vault/types/types';
import ConfirmModal from '@react/shared/components/ui/modals/ConfirmModal';
import { cn, copyTextToClipboard } from '@react/shared/utils/general';
import { Button } from '@src/react/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/react/shared/components/ui/dialog';
import { Button as CustomButton } from '@src/react/shared/components/ui/newDesign/button';
import { TextArea } from '@src/react/shared/components/ui/newDesign/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@src/react/shared/components/ui/tooltip';
import { errorToast, successToast } from '@src/shared/components/toast';
import { GLOBAL_VAULT_KEYS, SMYTHOS_DOCS_URL } from '@src/shared/constants/general';
import { Check, Copy, Info, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useVault } from '../hooks/use-vault';
import { UpgradeModal } from './upgrade-modal';

interface SetupModalProps {
  isOpen: boolean;
  isEdit: boolean;
  model: UserModel;
  onClose: () => void;
  existingKey?: string;
}

// First, let's add validation rules and error messages
const validationRules = {
  apiKey: { required: true, maxLength: 10000 },
};

const errorMessages = {
  apiKey: 'La clé API est requise et doit comporter moins de 10 000 caractères.',
};

function SetupModal({ isOpen, onClose, model, existingKey, isEdit }: SetupModalProps) {
  const [apiKey, setApiKey] = useState(existingKey || '');
  const [apiKeyError, setApiKeyError] = useState('');
  const { useAddUserModelKey, useUpdateUserModelKey } = useVault();
  const { mutate: addUserModelKey, isLoading } = useAddUserModelKey();

  const validateApiKey = (value: string, isSubmitting = false): boolean => {
    // Clear previous error
    setApiKeyError('');

    // Check required - only when submitting
    if (isSubmitting && !value.trim()) {
      setApiKeyError(errorMessages.apiKey);
      return false;
    }

    // Check max length - always
    if (value.length > validationRules.apiKey.maxLength) {
      setApiKeyError(errorMessages.apiKey);
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    // Validate with the submitting flag set to true
    if (!validateApiKey(apiKey, true)) {
      return;
    }

    addUserModelKey(
      { modelId: model.id, keyName: model.id, apiKey: apiKey.trim() },
      {
        onSuccess: () => {
          successToast(`Clé API ${isEdit ? 'mise à jour' : 'ajoutée'} avec succès`);
          onClose();
        },
        onError: () => {
          errorToast(`Échec de ${isEdit ? 'la mise à jour' : 'l\'ajout'} de la clé API`);
        },
      },
    );
  };

  // Check if the Save button should be disabled
  const isSaveDisabled = isLoading || !!apiKeyError || (!isEdit && !apiKey.trim());

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          // Just close without validation
          setApiKeyError('');
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl text-[#1E1E1E]">
            {isEdit ? 'Mettre à jour la clé API pour' : 'Configurer la clé API pour'} {model.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <TextArea
              label="Clé API"
              labelClassName={'text-base font-normal text-[#1E1E1E] mb-2'}
              id="apiKey"
              value={apiKey}
              placeholder="Saisir votre clé API"
              onChange={(e) => {
                setApiKey(e.target.value);
                // Validate length on every change, but not emptiness
                validateApiKey(e.target.value, false);
              }}
              error={!!apiKeyError}
              errorMessage={apiKeyError}
              fullWidth
            />
          </div>
        </div>
        <DialogFooter>
          <CustomButton
            handleClick={handleSubmit}
            disabled={isSaveDisabled}
            label={isLoading ? 'Enregistrement...' : 'Enregistrer'}
            className={cn('w-[100px] rounded-sm')}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DeleteUserModelKeyDialog = ({
  isOpen,
  apiKey,
  onClose,
}: {
  isOpen: boolean;
  apiKey: string;
  onClose: () => void;
}) => {
  const { useDeleteUserModelKey } = useVault();
  const { mutate: deleteKey, isLoading } = useDeleteUserModelKey();

  const handleDelete = async () => {
    deleteKey(
      { modelId: apiKey },
      {
        onSuccess: () => {
          successToast('Clé API supprimée avec succès');
          onClose();
        },
        onError: (error) => {
          errorToast('Échec de la suppression de la clé API');
          console.error('Failed to delete API key:', error);
        },
      },
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ConfirmModal
      onClose={onClose}
      label={isLoading ? 'Suppression...' : 'Supprimer'}
      handleConfirm={handleDelete}
      message="Êtes-vous sûr ?"
      lowMsg="Cette action est irréversible. La clé API sera définitivement supprimée."
      isLoading={isLoading}
      width="max-w-[600px] w-[calc(100vw_-_-20px)]"
      confirmBtnClasses="bg-red-600 hover:bg-red-700 text-white"
    />
  );
};

export function UserModels({ pageAccess }: { pageAccess: { write: boolean } }) {
  const { useUserModels } = useVault();
  const { data: models, isLoading, error } = useUserModels();

  const [modalState, setModalState] = useState<{
    type: 'setup' | 'edit' | 'delete' | 'upgrade' | null;
    model: UserModel | null;
  }>({
    type: null,
    model: null,
  });

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopy = async (id: string) => {
    try {
      const foundModel = models?.find((model) => model?.id === id);
      if (!foundModel) return;
      await copyTextToClipboard(foundModel?.apiKey);
      setCopiedKeyId(id);
      setTimeout(() => {
        setCopiedKeyId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error || !models) {
    return <div>Erreur : {error?.message || 'Impossible de charger les modèles IA'}</div>;
  }

  const handleModalSetupClose = () => {
    setModalState({ type: null, model: null });
    // addUserModelKey({ modelId: modalState.model?.id || '', apiKey: modalState.model?.apiKey || '' });
  };

  const handleModalUpdateClose = () => {
    setModalState({ type: null, model: null });
  };

  const handleModalDeleteClose = () => {
    setModalState({ type: null, model: null });
  };

  return (
    <div className="rounded-lg bg-card text-card-foreground border border-solid border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          Vos propres modèles IA
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-center text-wrap">
              <p>
                Apportez et gérez vos propres modèles IA en ajoutant des clés API pour OpenAI, Google,
                Anthropic et d'autres fournisseurs
              </p>
            </TooltipContent>
          </Tooltip>
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Apportez et gérez vos propres modèles IA. Voir la{' '}
          <a
            href={`${SMYTHOS_DOCS_URL}/agent-studio/key-concepts/vault#custom-ai-model-configuration`}
            target="_blank"
            className="underline"
          >
            documentation
          </a>
          .
        </p>
        <div className="overflow-x-auto">
          <div className="space-y-4 min-w-[350px]">
            {Object.entries(GLOBAL_VAULT_KEYS).map(([key, value]) => {
              const model = models.find((m) => m.id.toLowerCase().includes(key.toLowerCase()));
              const hasKey = Boolean(model?.apiKey);

              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 items-center rounded-md bg-[#c0daff] px-2 text-xs font-medium text-[#235192]">
                      Personal
                    </span>
                    <img
                      src={`/img/provider_${key.toLowerCase()}.svg`}
                      alt={`${value?.['name']} icon`}
                      className="h-5 w-5"
                    />
                    <span>{value?.['name']}</span>
                  </div>
                  {hasKey ? (
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(model?.id || '')}
                          >
                            {copiedKeyId === model?.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedKeyId === model?.id ? 'Copié !' : 'Copier'}</p>
                        </TooltipContent>
                      </Tooltip>
                      {pageAccess?.write && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setModalState({
                                  type: 'edit',
                                  model: {
                                    id: key,
                                    apiKey: model?.apiKey || '',
                                    icon: key.toLowerCase(),
                                    name: value?.['name'],
                                  },
                                })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {pageAccess?.write && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setModalState({
                                  type: 'delete',
                                  model,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4 hover:text-red-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Supprimer</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ) : (
                    pageAccess?.write && (
                      <CustomButton
                        variant="secondary"
                        handleClick={() =>
                          setModalState({
                            type: pageAccess?.write ? 'setup' : 'upgrade',
                            model: {
                              id: key,
                              apiKey: '',
                              icon: key.toLowerCase(),
                              name: value?.['name'],
                            },
                          })
                        }
                        label={pageAccess?.write ? 'Configurer' : 'Améliorer l\'offre'}
                        dataAttributes={{
                          'data-qa': pageAccess?.write ? `${key}-setup-own-model-button` : '',
                        }}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Consolidated modal rendering */}
      {modalState.type === 'setup' && modalState.model && (
        <SetupModal
          isOpen={true}
          isEdit={false}
          onClose={handleModalSetupClose}
          model={modalState.model}
        />
      )}

      {modalState.type === 'edit' && modalState.model && (
        <SetupModal
          isOpen={true}
          isEdit={true}
          onClose={handleModalUpdateClose}
          model={modalState.model}
          existingKey={modalState.model.apiKey}
        />
      )}

      {modalState.type === 'delete' && modalState.model && (
        <DeleteUserModelKeyDialog
          isOpen={true}
          apiKey={modalState.model.id}
          onClose={handleModalDeleteClose}
        />
      )}

      <UpgradeModal
        isOpen={modalState.type === 'upgrade'}
        onClose={() => setModalState({ type: null, model: null })}
      />
    </div>
  );
}
