import {
  atomDark,
  coy,
  darcula,
  dark,
  materialDark,
  materialLight,
  materialOceanic,
  okaidia,
  oneDark,
  oneLight,
  prism,
  tomorrow,
  twilight,
  vs,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

export const HUMAN_DESCRIPTION_LIMIT = 120;
export const HUMAN_DESCRIPTION_THRESHOLD = 120 - 120 * 0.05;
export const MODEL_DESCRIPTION_LIMIT = 8000;
export const MODEL_DESCRIPTION_THRESHOLD = 8000 - 8000 * 0.05;

export const CHATBOT_DEFAULT_TEXTS = {
  systemMessage: 'Hello! How can I assist you today?',
  userMessage: 'Write a Javascript function that adds two numbers.',
  userMessageReply: 'Great, thank you!',
  functionText: `function add(a, b) {
        return a + b;
    }`,
};

export const V4_ENTERPRISE_PLANS = [
  'Enterprise T1',
  'Enterprise T2',
  'Enterprise T3',
  'Enterprise T4',
  'Business Unlimited',
];

export const EXPORT_LOGS_PLANS = [
  ...V4_ENTERPRISE_PLANS,
  'Startup',
];

export const WIDGETS_PRICING_ALERT_TEXT = {
  LOGS: 'Vous avez besoin d\'un abonnement pour consulter les journaux.',
  CAPABILITIES: 'Vous avez besoin d\'un abonnement pour consulter les compétences de l\'agent IA.',
  SCHEDULE: 'Vous avez besoin d\'un abonnement pour planifier votre agent IA.',
};

export const SETTINGS_KEYS = {
  chatGptModel: 'chatGptModel',
  introMessage: 'introMessage',
} as const;

export const SYNTAX_HIGHLIGHT_THEMES = [
  {
    name: 'twilight',
    value: twilight,
  },
  {
    name: 'dark',
    value: dark,
  },
  {
    name: 'atomDark',
    value: atomDark,
  },
  {
    name: 'darcula',
    value: darcula,
  },
  {
    name: 'coy',
    value: coy,
  },
  {
    name: 'oneDark',
    value: oneDark,
    isDefault: true,
  },
  {
    name: 'oneLight',
    value: oneLight,
  },
  {
    name: 'prism',
    value: prism,
  },
  {
    name: 'materialOceanic',
    value: materialOceanic,
  },
  {
    name: 'materialLight',
    value: materialLight,
  },
  {
    name: 'materialDark',
    value: materialDark,
  },
  {
    name: 'tomorrow',
    value: tomorrow,
  },
  {
    name: 'vs',
    value: vs,
  },
  {
    name: 'okaidia',
    value: okaidia,
  },
];

export const BaseAgentSettingsTabs = {
  Overview: 'Overview',
  Security: 'Security',
  Tasks: 'Tasks',
  Deployments: 'Deployments',
};
