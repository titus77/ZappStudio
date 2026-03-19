import { plugins, PluginTarget, PluginType } from '@src/react/shared/plugins/Plugins';
import { SMYTHOS_DOCS_URL } from '@src/shared/constants/general';
// TODO: Delete this commented block once removal is confirmed. Discord & Academy links were removed from the app; code kept for traceability.
import { BookIcon, /* DiscordIcon, */ HomeIcon, KeyIcon } from '../components/svgs';

// Redirige vers la page billing ZappImmo (plan Elite requis pour Studio)
// Le Studio tourne sur smythos.zapp.immo, le billing est sur le frontend principal
const ZAPPIMMO_BASE = typeof window !== 'undefined'
  ? (window as any).__ZAPPIMMO_URL || 'https://zapp.immo'
  : 'https://zapp.immo';

export const PRICING_PLAN_REDIRECT = `${ZAPPIMMO_BASE}/dashboard/settings/billing`;

export const NEW_ENTERPRISE_PLAN_REDIRECT = `${ZAPPIMMO_BASE}/dashboard/settings/billing`;

export type SidebarMenuItem = {
  url: string;
  name: string;
  icon: React.FC;
  visible: boolean | ((ctx: any) => boolean);
  order?: number;
};

export const getSidebarMenuItems = (): SidebarMenuItem[] => {
  const pluginItems = (
    plugins.getPluginsByTarget(PluginTarget.SidebarMenuItems, PluginType.Config) as {
      config: SidebarMenuItem;
    }[]
  ).flatMap((item) => item.config);

  return [
    { url: '/agents', name: 'Accueil', icon: HomeIcon, visible: true, order: 1 },
    { url: '/vault', name: 'Coffre-fort', icon: KeyIcon, visible: true, order: 5 },
    ...pluginItems,
  ].sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const bottomLinks = [
  { title: 'Documentation', path: SMYTHOS_DOCS_URL, icon: BookIcon, isExternal: true },
  // TODO: Delete this commented block once removal is confirmed. Discord & Academy links were removed from the app; code kept for traceability.
  // {
  //   title: 'Discord Support',
  //   path: 'https://discord.gg/smythos',
  //   icon: DiscordIcon,
  //   isExternal: true,
  // },
];

export const profileDropdownItems = () => {
  const pluginItems = (
    plugins.getPluginsByTarget(PluginTarget.TopMenuProfileDropdownItems, PluginType.Config) as {
      config: any;
    }[]
  ).flatMap((item) => item.config);

  return [
    // { url: '/account', name: 'Account' },
    // { url: '/teams/members', name: 'User Management' },
    ...pluginItems,
    { url: '/teams/settings', name: 'Gestion des utilisateurs' },
  ];
};
