import { ErrorToast, Input, ScrollToBottomButton } from '@react/features/ai-chat/components';
import { useChatStores } from '@react/features/ai-chat/hooks';
import { FC } from 'react';

export const Footer: FC = () => {
  const { files, scroll } = useChatStores();
  const { errorMessage, clearError } = files;
  const { showScrollButton, scrollToBottom } = scroll || {};

  return (
    <div className="w-full max-w-4xl pt-2.5">
      {errorMessage && <ErrorToast message={errorMessage} onClose={clearError} />}
      <div className="relative">
        {showScrollButton && <ScrollToBottomButton onClick={() => scrollToBottom()} />}
        <Input />
      </div>

      <h6 className="py-4 text-center text-xs text-gray-500">
        ZappStudio peut faire des erreurs, vérifiez toujours votre travail. Nous ne conservons pas l&apos;historique des conversations, sauvegardez les éléments importants.
      </h6>
    </div>
  );
};
