import { authStore } from '@shared/state_stores/auth';
import { userSettingKeys } from '@shared/userSettingKeys';
import { getUserSettings, saveUserSettings } from '@src/react/shared/hooks/useUserSettings';
import { TUTORIAL_CUTOFF_DATE } from '@src/shared/constants/tutorial';
import { Observability } from '@src/shared/observability';

export const builderPageTutorialWorkflow = async () => {
  const userInfo = authStore.getState().userInfo;
  const isNewUser = userInfo?.user?.createdAt
    ? new Date(userInfo.user.createdAt) > TUTORIAL_CUTOFF_DATE
    : false;

  // Only show tutorial to new users
  if (!isNewUser) return null;

  const tutorialSeen = await getUserSettings(userSettingKeys.SEEN_BUILDER_PAGE_TUTORIAL);

  // Check if user has already seen the tutorial
  if (tutorialSeen === 'true') return null;

  const Tutorial = (window as any)?.Tutorial;
  if (!Tutorial) return null;

  const tutorialWorkflow = new Tutorial({
    onPopoverRender: (popoverElements) => {
      // Update the popover title with step count immediately after internal boarding logic
      setTimeout(() => {
        popoverElements.popoverTitle.innerText = `${
          popoverElements.popoverTitle.innerText
        } (${tutorialWorkflow.currentStep + 1}/${tutorialWorkflow.getSteps().length})`;
      }, 0);
    },
    onReset: () => {
      // Called when overlay is about to be cleared
      Observability.observeInteraction('builder_page_tutorial_completed', {
        page_url: '/builder',
        source: 'Tutorial completed on builder page onboarding',
      });

      saveUserSettings(userSettingKeys.SEEN_BUILDER_PAGE_TUTORIAL, 'true');
    },
    animate: true,
    showButtons: true,
    nextBtnText: 'Suivant',
    prevBtnText: 'Precedent',
    closeBtnText: 'Fermer',
    padding: 10,
    opacity: 0.7,
  });

  tutorialWorkflow.defineSteps([
    {
      element: '#workspace-container',
      popover: {
        title: '<strong>Bienvenue dans ZappStudio Builder</strong>',
        description:
          "Bienvenue dans le <strong>ZappStudio Builder</strong> ! Voici votre canevas visuel pour creer des agents IA puissants en connectant des composants. Faites glisser, deposer et connecter des elements pour construire des workflows sophistiques.",
        preferredPosition: 'center',
        alignment: 'center',
        className: 'welcome-builder',
      },
    },
    {
      element: '#agentBuilder-sidebar',
      popover: {
        title: '<strong>Agent Weaver</strong>',
        description:
          'Utilisez <strong>Agent Weaver</strong> pour decrire votre agent en langage naturel. Cet assistant IA convertit vos besoins en workflows fonctionnels.',
        preferredPosition: 'right',
        alignment: 'start',
        className: 'weaver-intro',
      },
    },
    {
      element: '[data-qa="sidebar-components-integrations-panel"]',
      popover: {
        title: '<strong>Composants & Integrations</strong>',
        description:
          'Accedez aux <strong>Composants & Integrations</strong> pour construire votre agent. Les composants fournissent des briques de base avec entrees, sorties et parametres, tandis que les integrations vous connectent a des services externes, APIs, bases de donnees et outils tiers.',
        preferredPosition: 'right',
        alignment: 'center',
        className: 'components-integrations-highlight',
      },
    },
    {
      element: '[data-qa="builder-toolbar-actions"]',
      popover: {
        title: '<strong>Debug, Test & Deployer</strong>',
        description:
          'Utilisez la barre d\'outils pour gerer le cycle de vie de votre agent : <strong>Debug</strong> pour l\'inspection et le test au niveau des composants, <strong>Test</strong> pour la previsualisation du formulaire et les tests API, et <strong>Deployer</strong> pour mettre votre agent en ligne avec certification SSL/TLS et controle de version.',
        preferredPosition: 'bottom',
        alignment: 'center',
        className: 'toolbar-actions-highlight',
      },
    },
  ]);

  return tutorialWorkflow;
};
