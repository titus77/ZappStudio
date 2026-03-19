export const VAULT_DATA_CACHE_KEY = 'preloaded-vault-data';
export const AGENT_VERSIONS_CACHE_KEY = 'preloaded-agent-versions';
export const MOCK_DATA_CACHE_KEY = 'component:mock_data';

export const AGENT_AUTH_SETTINGS_KEY = 'agent-auth-data';
export const AGENT_MOCK_DATA_SETTINGS_KEY = 'agent-mock-data';

export const PATTERN_VAULT_KEY_NAME = /^[a-zA-Z0-9\s\_\(\)\-\@\.]+$/;

export const V4_ALL_PLANS = [
  'enterprise t1',
  'enterprise t2',
  'enterprise t3',
  'enterprise t4',
  'business unlimited',
  'scaleup',
  'builder',
  'startup',
  'smythos free',
];

export const TRIMMED_PLANS = ['scaleup', 'enterprise', 'startup', 'builder'];

export const ERR_MSG_VAULT_KEY_NAME =
  'Veuillez saisir un nom de cle unique et alphanumerique de moins de 300 caracteres [symboles autorises : _ . ( ) - @]';

export const GLOBAL_VAULT_KEYS = {
  openai: {
    name: 'OpenAI',
    key: '',
    placeholder:
      'ZappStudio fournit une cle pour demarrer. Ajoutez votre propre cle API pour un acces complet.',
  },
  anthropic: {
    name: 'Anthropic',
    key: '',
    placeholder: 'N/A',
  },
  togetherai: {
    name: 'Together.ai',
    key: '',
    placeholder: 'N/A',
  },
  googleai: {
    name: 'Google AI',
    key: '',
    placeholder: 'N/A',
  },
  groq: {
    name: 'Groq',
    key: '',
    placeholder: 'N/A',
  },
  xai: {
    name: 'xAI',
    key: '',
    placeholder: 'N/A',
  },
};

export const API_CALL_DATA_ENTRIES = [
  'method',
  'url',
  'headers',
  'contentType',
  'body',
  'proxy',
  'oauthService', // Assuming you're keeping track of the selected OAuth service
  'scope',
  'authorizationURL', // OAuth2.0
  'tokenURL', // OAuth2.0
  'clientID', // OAuth2.0
  'clientSecret', // OAuth2.0
  'oauth2CallbackURL', // OAuth2.0
  'requestTokenURL', // OAuth1.0
  'accessTokenURL', // OAuth1.0
  'userAuthorizationURL', // OAuth1.0
  'consumerKey', // OAuth1.0
  'consumerSecret', // OAuth1.0
  'oauth1CallbackURL', //OAuth1.0
  'authenticate',
];

export const ENTERPRISE_COLLECTION_TEMPLATE_NAMES = [
  'Asana Tasks Manager',
  'HubSpot Contacts Manager',
  'LinkedIn Leads Builder',
  'InFlow Inventory Agent',
  'Lead Contacts Scraper',
  'Backlink Analysis Agent',
];

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export const WEAVER_LIMIT_MESSAGE = 'Vous avez atteint votre limite quotidienne.';

export const WEAVER_REQUIRE_CREDITS = 'Des credits sont necessaires pour cette action';

export const AGENTS_WITH_NEXT_STEPS_SHOWN = 'agentsWithNextStepsShown';

export const VAULT_SCOPE_AGENT_LLM = 'AgentLLM';
export const VAULT_SCOPE_OAUTH_CONNECTIONS = 'OAuthConnections';
export const VAULT_SCOPE_CREDENTIALS = 'Credentials';
export const HIDDEN_VAULT_SCOPE = '_hidden';
export const MANAGED_VAULT_SCOPES = [
  VAULT_SCOPE_AGENT_LLM,
  VAULT_SCOPE_OAUTH_CONNECTIONS,
  VAULT_SCOPE_CREDENTIALS,
  HIDDEN_VAULT_SCOPE,
];

type EmbodimentDescription = {
  title: string;
  tooltipTitle: string;
  description: string;
};

export const EMBODIMENT_DESCRIPTIONS: Record<string, EmbodimentDescription> = {
  agent_skill: {
    title: 'Competences Agent',
    tooltipTitle: '',
    description: '',
  },
  chat: {
    title: 'Chatbot',
    tooltipTitle: 'Interface de conversation pour tester ou integrer sur votre site.',
    description:
      'Discutez avec votre agent IA via une interface de chat. Ideal pour tester en direct ou integrer sur votre site web immobilier.',
  },
  llm: {
    title: 'API LLM / AgentLLM',
    tooltipTitle: 'API compatible OpenAI pour vos workflows IA.',
    description:
      'Utilisez votre agent comme une API compatible OpenAI. Integrez-le dans vos applications pour envoyer des requetes et recevoir des reponses via les endpoints standards (ex: /chat/completions).',
  },
  api: {
    title: 'Points d\'acces API',
    tooltipTitle: 'Environnement interactif pour tester vos points d\'acces API.',
    description:
      'Interface Swagger pour tester simplement vos appels API. Visualisez les formats d\'entree/sortie et integrez votre agent dans vos outils metier.',
  },
  chatgpt: {
    title: 'GPT personnalise',
    tooltipTitle: 'Exportez votre agent comme GPT personnalise.',
    description:
      'Deployez votre agent comme GPT personnalise dans ChatGPT. Suivez les instructions pour configurer le comportement et connecter l\'interface.',
  },
  postman: {
    title: 'Integration Postman',
    tooltipTitle: 'Exportez et testez les API de votre agent via Postman.',
    description:
      'Testez votre agent avec Postman ou importez des collections. Outils inclus pour exporter et deboquer vos appels API.',
  },
  agentllm: {
    title: 'LLM',
    tooltipTitle: 'Point d\'acces API LLM compatible OpenAI',
    description:
      'Utilisez votre agent comme point d\'acces API compatible OpenAI pour l\'integrer dans vos workflows existants.',
  },
  voice: {
    title: 'Voix',
    tooltipTitle: 'Conversation vocale en direct avec votre agent.',
    description: 'Demarrez une session vocale en direct avec votre agent pour des echanges naturels.',
  },
  alexa: {
    title: 'Skill Alexa',
    tooltipTitle: 'Publiez comme Skill Alexa ou deployez sur vos appareils Echo.',
    description:
      'Publiez votre agent comme Skill Alexa ou deployez-le sur vos appareils Echo pour des interactions vocales.',
  },
  mcp: {
    title: 'MCP',
    tooltipTitle: 'Protocole MCP (Model Context Protocol)',
    description: 'Utilisez votre agent via le protocole MCP pour l\'integrer dans vos outils compatibles (Claude, etc.).',
  },
};

export const COMP_NAMES = {
  apiCall: 'APICall',
  code: 'Code',
  llmPrompt: 'PromptGenerator',
  visionLLM: 'VisionLLM',
  llmAssistant: 'LLMAssistant',
  imageGenerator: 'ImageGenerator',
  agentPlugin: 'AgentPlugin',
  apiEndpoint: 'APIEndpoint',
  genAILLM: 'GenAILLM',
  multimodalLLM: 'MultimodalLLM',
  classifier: 'Classifier',
  openapi: 'GPTPlugin',
  chatbot: 'Chatbot',
};

/**
 * Set of legacy plan names that are no longer offered but need to be supported
 * for existing customers
 */
export const LEGACY_PLANS = new Set([
  'Early Adopters',
  'ZappStudio PRO',
  'ZappStudio Free',
  'ZappStudio Starter',
  'Premium',
  'Enterprise',
]);

/**
 * Mapping of URL paths to their corresponding page titles
 * Used for displaying the correct page title in the TopbarPrimary component
 */
export const PAGE_TITLE_MAP: Record<string, string> = {
  '/my-plan': 'Mon abonnement',
  '/data': 'Donnees',
  '/vault': 'Coffre-fort',
  '/telemetry': 'Suivi et journaux',
  '/account': 'Mon compte',
  '/teams/roles': 'Roles de l\'equipe',
  '/teams/members': 'Gestion des membres',
  '/domain': 'Domaines',
  '/analytics': 'Statistiques',
  '/templates': 'Modeles',
  '/agents': 'Tableau de bord',
};

// TODO P4-DOCS: Mettre en place la documentation ZappStudio en français.
// Structure cible: docs.zapp.immo/studio/ avec guides agent builder,
// composants, déploiement, API, intégrations ZappImmo.
export const SMYTHOS_DOCS_URL = `https://zapp.immo/docs/studio`;
