import { InfoIcon, RetryIcon } from '@react/features/ai-chat/components';
import { TMessageProps } from '@react/features/ai-chat/types';
import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type TProps = TMessageProps & { retry: () => void };

export const Error: FC<TProps> = ({ message, retry }) => {
  const isApiKeyError =
    message.includes('Incorrect API key provided') ||
    (message.includes('401') &&
      message.toLowerCase().includes('api') &&
      message.toLocaleLowerCase().includes('key'));

  return (
    <div className="flex flex-col items-start">
      <div className="rounded-lg bg-pink-50 border border-pink-200 p-4 max-w-screen-md flex justify-between items-center gap-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <InfoIcon className="text-red-500" />
          </div>

          <div className="flex-1 text-red-700 text-sm leading-relaxed">
            {isApiKeyError && (
              <>
                <h6 className="font-bold">Clé API invalide</h6>
                <p>
                  La clé API fournie n'est pas valide. Veuillez définir une clé valide pour continuer :&nbsp;
                  <a
                    href="/vault"
                    target="_blank"
                    className="text-red-700 hover:text-red-900 font-semibold"
                  >
                    Définir la clé API
                  </a>
                </p>
                <h6 className="font-semibold pt-1">Détails de l'erreur :</h6>
              </>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
          </div>
        </div>
        {retry && (
          <button
            onClick={retry}
            className="inline-flex items-center px-4 gap-x-1 py-2 border border-gray-300 text-sm font-medium rounded-[18px] text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <RetryIcon />
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
};
