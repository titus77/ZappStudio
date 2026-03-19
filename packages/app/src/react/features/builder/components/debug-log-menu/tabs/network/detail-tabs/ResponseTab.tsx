import { JSON_TREE_THEME } from '@src/react/features/builder/constants/debug-log';
import { DetailTabProps } from '@src/react/features/builder/types/debug-log-menu.type';
import { FC, useState } from 'react';
import { JSONTree } from 'react-json-tree';

/**
 * Response tab in the request detail panel
 */
export const ResponseTab: FC<DetailTabProps> = ({ request }) => {
  const [view, setView] = useState<'preview' | 'raw'>('preview');

  return (
    <div className="p-3 text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">Corps de la réponse</h3>
        <div className="flex text-xs bg-gray-100 rounded overflow-hidden">
          <button
            className={`px-3 py-1 ${view === 'preview' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            onClick={() => setView('preview')}
          >
            Aperçu
          </button>
          <button
            className={`px-3 py-1 ${view === 'raw' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
            onClick={() => setView('raw')}
          >
            Brut
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded border border-gray-200">
        {request.responseBody ? (
          view === 'preview' ? (
            <JSONTree
              data={request.responseBody}
              theme={JSON_TREE_THEME}
              hideRoot={true}
              shouldExpandNodeInitially={() => true}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-gray-800">
              {JSON.stringify(request.responseBody)}
            </pre>
          )
        ) : (
          <div className="text-gray-500">Aucun corps de réponse</div>
        )}
      </div>

      <h3 className="font-medium text-gray-700 mt-4 mb-2">En-têtes de la réponse</h3>
      <div className="bg-white p-3 rounded border border-solid border-gray-200">
        {Object.keys(request.responseHeaders || {}).length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-solid border-gray-200">
                <th className="text-left py-1 font-medium text-gray-600">Nom</th>
                <th className="text-left py-1 font-medium text-gray-600">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(request.responseHeaders || {}).map(([key, value]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-1 pr-4 font-medium">{key}</td>
                  <td className="py-1 text-gray-600">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500">Aucun en-tête de réponse</div>
        )}
      </div>
    </div>
  );
};