/**
 * Component Documentation Data
 * Contains component descriptions and field tooltips for the UI
 * Based on: https://docs.google.com/document/d/1d6onoVfFS6QHMOlI-ZpbB7OaJuwtCMijpI6x0BC8csA/edit?usp=sharing
 */

export interface ComponentDocumentation {
  description: string;
  docsLink?: string;
}

/**
 * Component documentation mapping
 * Key: Component class name
 * Value: Component documentation data
 */
export const COMPONENT_DOCUMENTATION: Record<string, ComponentDocumentation> = {
  // Composants de base
  APIEndpoint: {
    description:
      'Definissez une competence reutilisable que votre agent peut appeler dans tous les workflows. Decrivez ce qu\'elle fait, les entrees dont elle a besoin et le resultat qu\'elle retourne afin que les assistants la selectionnent au bon moment.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  APIOutput: {
    description:
      'Definissez le retour final de votre workflow sous forme de JSON propre. Choisissez un format et mappez les champs pour que les appelants obtiennent toujours la meme structure en production.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  Note: {
    description:
      'Ajoutez des annotations et une documentation legere sur le canevas pour expliquer les decisions, etiqueter les sections et aider les membres de l\'equipe a aller plus vite.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  Classifier: {
    description:
      'Classez du texte non structure dans des categories claires a l\'aide d\'un prompt simple. Choisissez un modele adapte, definissez les etiquettes et testez les cas limites pour garantir la coherence.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  ImageGenerator: {
    description:
      'Creez ou modifiez des images a partir de texte avec des reglages de taille, qualite et style. Redigez des prompts clairs et iterez rapidement pour affiner les resultats.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  GenAILLM: {
    description:
      'Donnez a votre agent la capacite de resumer, generer, extraire ou classifier du texte en choisissant un modele, en ajoutant un prompt et en ajustant la longueur, la qualite et le cout.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  // Composants avances
  FSleep: {
    description:
      'Utilisez Pause pour interrompre un workflow pendant une duree determinee afin de respecter les limites de debit d\'API, d\'attendre un traitement externe lent ou d\'ajouter une cadence naturelle. Definissez le delai en secondes, puis le flux reprend et transmet son entree sans modification.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  LLMAssistant: {
    description:
      'Construisez un assistant de conversation qui memorise l\'echange et fournit des reponses coherentes au fil des tours. Choisissez un modele, configurez le comportement, connectez les entrees, puis selectionnez le mode de diffusion des reponses.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  Await: {
    description:
      'Utilisez Attente pour suspendre votre flux jusqu\'a ce que les taches en arriere-plan soient terminees afin d\'en utiliser les resultats. Definissez combien de taches attendre et une limite de temps pour que le flux reste reactif.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  Async: {
    description:
      'Lancez un traitement long dans une branche en arriere-plan pendant que le flux principal continue ; retourne un identifiant de tache, transmet vos entrees a cette branche et s\'associe a Attente pour recuperer les resultats dans la meme execution.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  ForEach: {
    description:
      'Utilisez Pour Chaque pour iterer sur une liste et executer les memes etapes pour chaque element. Il agrege chaque execution en un seul resultat que vous pouvez transmettre a l\'etape suivante.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  JSONFilter: {
    description:
      'Utilisez Filtre JSON pour ne conserver que les parties d\'un objet JSON dont vous avez besoin et supprimer le reste. Cela allege les reponses d\'API bruyantes, accelere les etapes suivantes et economise des jetons lors de l\'envoi de donnees a un LLM.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  FileStore: {
    description:
      'Utilisez Stockage Fichier pour sauvegarder des donnees binaires et obtenir un lien public partageables. Nommez le fichier tel que les utilisateurs le telechargeront, puis definissez la duree de validite du lien.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  Code: {
    description:
      'Utilisez le composant Code pour executer du JavaScript, transformer des donnees, ajouter de la logique et retourner des resultats avec _output ou des erreurs avec _error sans aucun service externe.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  APICall: {
    description:
      'Utilisez Appel API pour connecter votre flux a n\'importe quelle API HTTP. Definissez la methode, l\'URL, les en-tetes, le corps et l\'authentification, puis testez et reutilisez le resultat dans les etapes suivantes.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  // Composants Outils
  ComputerUse: {
    description:
      'Donne a votre agent un ordinateur virtuel capable de naviguer, cliquer, saisir du texte et collecter des donnees sur le web. Decrivez la tache en etapes simples et le resultat attendu, puis l\'agent l\'execute et retourne une sortie structuree.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  ServerlessCode: {
    description:
      'Executez du JavaScript personnalise avec des packages NPM dans un environnement serverless securise. Utilisez-le lorsque les etapes integrees ne suffisent pas et que vous avez besoin d\'un controle total.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  WebSearch: {
    description: 'Recherchez des informations sur le web et retournez les resultats pertinents avec leurs sources.',
  },

  WebScrape: {
    description:
      'Extrayez le contenu propre des pages web dans votre flux. Choisissez le format dont vous avez besoin et activez les options supplementaires pour les sites qui chargent des donnees en JavaScript ou au defilement.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  MCPClient: {
    description:
      'Connectez votre agent a un serveur MCP pour utiliser des outils externes via une interface standard unique. Entrez l\'URL du serveur, redigez un prompt clair et choisissez le modele qui appellera les outils.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  // Composants Cryptographie
  FHash: {
    description:
      'Creez une empreinte de taille fixe de vos donnees pour les verifications et identifiants. Choisissez un algorithme, selectionnez un encodage de sortie, puis transmettez le hachage en aval.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  FEncDec: {
    description:
      'Convertit les donnees entre encodages texte et binaires pour un stockage, un transport et une compatibilite API securises. Supporte Base64, Base64URL, hex, UTF-8 et Latin-1 avec des actions d\'encodage ou de decodage.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  FSign: {
    description:
      'Genere une signature numerique HMAC ou RSA pour les charges utiles de webhook et les requetes API. Les verificateurs doivent utiliser la meme methode, cle, hachage et encodage pour correspondre.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  FTimestamp: {
    description:
      'Emet l\'heure UTC du serveur sous forme d\'horodatage Unix en millisecondes lors de l\'execution, pour la journalisation, la mesure du temps et les identifiants bases sur l\'heure.',
  },

  // Composants Donnees RAG
  DataSourceLookup: {
    description:
      'Recupere le texte pertinent d\'une base de connaissances indexee par recherche semantique. Recherche dans un espace de noms choisi et retourne les meilleures correspondances avec des metadonnees et scores optionnels.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  DataSourceIndexer: {
    description:
      'Ajoute ou met a jour du contenu dans la base de connaissances de l\'agent. Stocke le texte et les metadonnees optionnelles dans un espace de donnees selectionne avec un identifiant de source stable, permettant une recherche, des mises a jour ou une suppression ulterieures.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  DataSourceCleaner: {
    description:
      'Supprime une source specifique d\'un espace de donnees a l\'aide de son identifiant exact. L\'operation est permanente et destinee aux workflows de nettoyage des donnees et de conformite.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  // Composants Memoire
  MemoryWriteObject: {
    description:
      'Enregistrez plusieurs cles en une seule operation avec un objet JSON plat. Gardez les flux ordonnes et coherents en mettant a jour plusieurs champs simultanement.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  MemoryWriteKeyVal: {
    description:
      'Stockez une cle et une valeur uniques dans une memoire nommee. Choisissez la portee Requete ou TTL pour controler la duree de vie et la partageabilite entre les workflows.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  MemoryReadKeyVal: {
    description:
      'Recuperez une valeur stockee en memoire par cle. Utilisez-la pour transmettre l\'etat sauvegarde dans votre workflow ou reutiliser des donnees entre les etapes.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  MemoryDeleteKeyVal: {
    description:
      'Supprimez une cle specifique d\'une memoire nommee pour eviter les donnees obsoletes. Fonctionne pour les portees Requete et TTL afin de nettoyer en cours d\'execution ou de purger les valeurs persistantes.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  // Composants Legacy
  PromptGenerator: {
    description:
      'Genere une completion unique et sans etat a partir d\'un prompt texte en utilisant le modele selectionne. Supporte les variables de gabarit et un transfert optionnel de l\'entree originale. Composant legacy ; pour les conversations multi-tours ou les controles recents, voir <a href="#" target="_blank" class="text-blue-600 hover:text-blue-800">Assistant LLM</a> et <a href="#" target="_blank" class="text-blue-600 hover:text-blue-800">GenAI LLM</a>.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  MultimodalLLM: {
    description:
      'Effectue une completion unique a partir d\'entrees mixtes comme des images, videos, sons et textes. Supporte les modeles multimodaux Google, les URL de fichiers ou Base64, et un controle de base de la longueur de sortie. Composant legacy ; voir <a href="#" target="_blank" class="text-blue-600 hover:text-blue-800">Assistant LLM</a> et <a href="#" target="_blank" class="text-blue-600 hover:text-blue-800">GenAI LLM</a>.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },

  VisionLLM: {
    description:
      'Traite des images avec un modele de vision pour extraire du texte, detecter des objets ou decrire des scenes. Accepte une ou plusieurs images en entree et retourne un resultat structure. Composant legacy ; voir <a href="#" target="_blank" class="text-blue-600 hover:text-blue-800">Assistant LLM</a> et <a href="#" target="_blank" class="text-blue-600 hover:text-blue-800">GenAI LLM</a>.',
    docsLink:
      'https://zapp.immo/docs/studio/composants',
  },
};

/**
 * Check if a component should have tooltips
 * Memory and Logic components are excluded
 */
export function shouldShowComponentTooltips(componentClassName: string): boolean {
  // Exclude Logic components
  if (componentClassName.startsWith('Logic')) {
    return false;
  }

  return true;
}

/**
 * Get component documentation
 */
export function getComponentDocumentation(
  componentClassName: string,
): ComponentDocumentation | null {
  if (!shouldShowComponentTooltips(componentClassName)) {
    return null;
  }

  return COMPONENT_DOCUMENTATION[componentClassName] || null;
}
