/**
 * ZappImmo Integration Node for ZappStudio Builder
 *
 * Pre-configured MCPClient that connects to the ZappImmo MCP server.
 * Provides access to 9 MCP facades (1 meta + 8 domaines) couvrant 99+ tools internes,
 * avec propagation JWT tenant automatique.
 *
 * Usage in builder:
 * 1. Drag "ZappImmo" node onto canvas
 * 2. Select tool category and specific tool
 * 3. Configure parameters
 * 4. Connect input/output
 *
 * Auth: Uses TRUSTED_JWT_SECRET to sign service-to-service JWT
 * containing tenant_id and user_id from the iframe SSO context.
 */

import { LLMFormController } from '../helpers/LLMFormController.helper';
import { Component } from './Component.class';

declare var Metro: any;

// ── RECOMMENDED: Domain Facades (8 facades → 99+ tools) ──
// Use facades for better routing accuracy and fewer tokens.
// Individual tools below are available for expert/legacy workflows.
const TOOL_CATEGORIES: Record<string, { label: string; icon: string; tools: string[] }> = {
  facades: {
    label: 'Facades (recommande)',
    icon: 'fa-layer-group',
    tools: [
      'zapp_crm', 'zapp_geo', 'zapp_finance', 'zapp_social',
      'zapp_veille', 'zapp_programmes', 'zapp_rag', 'zapp_actions',
    ],
  },
  // ── EXPERT: Individual tools (legacy, granular control) ──
  crm: {
    label: 'CRM (expert)',
    icon: 'fa-users',
    tools: [
      'crm_get_contacts', 'crm_get_opportunities', 'crm_get_tasks',
      'crm_get_custom_field_schema', 'crm_get_leads', 'crm_get_pistes',
      'crm_create_piste', 'crm_update_piste', 'crm_update_contact',
      'crm_update_opportunity', 'crm_create_contact', 'crm_create_opportunity',
      'crm_create_task', 'crm_log_activity',
    ],
  },
  geo: {
    label: 'Geo & Estimation (expert)',
    icon: 'fa-map-marker-alt',
    tools: [
      'geo_estimation', 'geo_estimation_loyer', 'geo_prospect_scoring',
      'geo_estimation_pdf', 'geo_marche_commune', 'geo_ecart_marche',
      'geo_flux_marche', 'geo_autocomplete', 'geo_plu',
      'estimation_interactive', 'calc_financement',
    ],
  },
  social: {
    label: 'Social & Marketing (expert)',
    icon: 'fa-share-alt',
    tools: [
      'social_list_posts', 'social_get_post', 'social_search_posts',
      'social_get_analytics', 'social_list_integrations', 'social_prepare_post',
      'social_execute_post', 'social_cancel_scheduled', 'social_upload_media',
      'social_connect_account', 'social_disconnect_account',
      'create_tracked_link', 'create_qrcode', 'create_tracked_link_with_qr',
    ],
  },
  veille: {
    label: 'Veille & Annonces (expert)',
    icon: 'fa-search',
    tools: [
      'veille_search', 'veille_stats', 'annonce_semantic_search',
      'annonce_completude', 'annonce_alur_check', 'annonce_generate_desc',
      'annonce_create', 'annonce_search',
    ],
  },
  workflow: {
    label: 'Workflows & Skills (expert)',
    icon: 'fa-project-diagram',
    tools: [
      'workflow_list', 'workflow_execute', 'workflow_get_result',
      'studio_list_agents', 'studio_publish_agent',
      'skill_list', 'skill_execute',
    ],
  },
  actions: {
    label: 'Actions & IA (expert)',
    icon: 'fa-bolt',
    tools: [
      'action_prepare', 'action_execute', 'ai_insights',
      'analyse_strategique', 'analyse_supports_performance',
      'query', 'search', 'generate', 'chat',
    ],
  },
  transport: {
    label: 'Transport & Programmes (expert)',
    icon: 'fa-bus',
    tools: [
      'transport_nearby', 'transport_route', 'transport_isochrone',
      'programme_search', 'programme_lots_available',
      'programme_match_buyer', 'programme_simulate_investissement',
    ],
  },
  rag: {
    label: 'Documents & RAG (expert)',
    icon: 'fa-file-alt',
    tools: ['rag_list_documents', 'rag_create_document', 'rag_delete_document'],
  },
  lcd: {
    label: 'LCD & Scan (expert)',
    icon: 'fa-barcode',
    tools: [
      'calc_lcd_rendement', 'calc_lcd_fiscal', 'calc_lcd_zanestate',
      'scan_lcd', 'scan_status', 'scan_veille', 'scan_immo',
    ],
  },
  schema: {
    label: 'Schema & Integration (expert)',
    icon: 'fa-database',
    tools: [
      'schema_get_entity', 'schema_list_mappings',
      'schema_create_mapping', 'schema_transform_data',
      'oauth_api_call',
    ],
  },
  billing: {
    label: 'Billing & Admin (expert)',
    icon: 'fa-credit-card',
    tools: ['billing_quota', 'book_appointment', 'get_available_slots', 'zap_list'],
  },
};

// Flatten all tools for quick lookup
const ALL_TOOLS: string[] = Object.values(TOOL_CATEGORIES).flatMap(c => c.tools);

export class ZappImmo extends Component {
  private selectedCategory: string;
  private selectedTool: string;
  private modelOptions: string[];
  private defaultModel: string;

  protected async prepare() {
    this.selectedCategory = this.data?.category || 'crm';
    this.selectedTool = this.data?.tool || '';

    const modelOptions = LLMFormController.prepareModelSelectOptionsByFeatures(['tools']);
    this.defaultModel = LLMFormController.getDefaultModel(modelOptions);
    this.modelOptions = modelOptions.filter((e: any) => e);

    return true;
  }

  protected async init() {
    // Build category options for dropdown
    const categoryOptions = Object.entries(TOOL_CATEGORIES).map(([key, val]) => ({
      text: `<i class="fa ${val.icon} mr-1"></i> ${val.label}`,
      value: key,
    }));

    // Build tool options based on selected category
    const toolOptions = this.getToolOptionsForCategory(this.selectedCategory);

    this.settings = {
      category: {
        type: 'select',
        label: 'Categorie',
        help: 'Choisissez la categorie de tool ZappImmo.',
        value: this.selectedCategory,
        options: categoryOptions,
        events: {
          change: (value: string) => {
            this.selectedCategory = value;
            this.data.category = value;
            // Update tool dropdown when category changes
            const newToolOptions = this.getToolOptionsForCategory(value);
            if (this.settings.tool) {
              this.settings.tool.options = newToolOptions;
              this.settings.tool.value = newToolOptions[0]?.value || '';
              this.data.tool = this.settings.tool.value;
            }
          },
        },
      },
      tool: {
        type: 'select',
        label: 'Tool',
        help: 'Selectionnez le tool MCP a appeler.',
        value: this.selectedTool || toolOptions[0]?.value || '',
        options: toolOptions,
        validate: 'required',
        validateMessage: 'Un tool est requis.',
      },
      prompt: {
        type: 'textarea',
        expandable: true,
        label: 'Instructions',
        value: this.data?.prompt || '{{Prompt}}',
        help: 'Instructions pour le modele. Utilisez {{Prompt}} pour injecter l\'entree du workflow. Decrivez ce que le tool doit faire et quel resultat retourner.',
        tooltipClasses: 'w-64',
        validate: 'required',
        validateMessage: 'Les instructions sont requises.',
        attributes: {
          'data-template-vars': 'true',
          'data-template-excluded-var-types': 'Binary',
          'data-supported-models': 'all',
        },
      },
      params: {
        type: 'textarea',
        expandable: true,
        label: 'Parametres JSON',
        value: this.data?.params || '{}',
        help: 'Parametres JSON a passer au tool. Utilisez des variables de template {{var}} pour les valeurs dynamiques.',
        section: 'Advanced',
        tooltipClasses: 'w-64',
        attributes: {
          'data-template-vars': 'true',
        },
      },
      model: {
        type: 'select',
        label: 'Modele IA',
        help: 'Modele pour planifier et appeler les tools (les modeles plus grands sont meilleurs pour les taches complexes).',
        value: this.data?.model || this.defaultModel,
        options: this.modelOptions,
        section: 'Advanced',
      },
    };

    // Initialize data entries
    const dataEntries = ['category', 'tool', 'prompt', 'params', 'model'];
    for (const item of dataEntries) {
      if (typeof this.data[item] === 'undefined') {
        this.data[item] = this.settings[item].value;
      }
    }

    // Default inputs/outputs
    if (this.properties.inputs.length === 0) {
      this.properties.inputs = ['Prompt'];
    }
    this.properties.defaultOutputs = ['Output'];

    // Canvas display settings
    this.drawSettings.iconCSSClass = 'svg-icon ZappImmo';
    this.drawSettings.addOutputButton = 'Outputs';
    this.drawSettings.addInputButton = 'Inputs';
    this.drawSettings.displayName = this.getDisplayName();
    this.drawSettings.shortDescription = 'ZappImmo MCP Tool';

    this._ready = true;
  }

  protected async run(): Promise<any> {
    // Runtime: set display name based on selected tool
    this.drawSettings.displayName = this.getDisplayName();
  }

  public redraw(triggerSettings = true): HTMLDivElement {
    const div = super.redraw(triggerSettings);

    this.data = {
      ...this.data,
      category: this.selectedCategory,
      tool: this.selectedTool,
      // MCP connection config (auto-injected, not user-visible)
      mcpUrl: this.data?.mcpUrl || '',
      _isMcpBridge: true,
      _mcpToolName: this.data?.tool || this.selectedTool,
    };

    // Apply custom styling
    const header = div.querySelector('.component-header');
    if (header) {
      (header as HTMLElement).style.borderLeft = '4px solid #2563eb';
    }

    return div;
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private getToolOptionsForCategory(category: string): Array<{ text: string; value: string }> {
    const cat = TOOL_CATEGORIES[category];
    if (!cat) return [];
    return cat.tools.map(t => ({
      text: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: t,
    }));
  }

  private getDisplayName(): string {
    const tool = this.data?.tool || this.selectedTool;
    if (tool) {
      return tool.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
    return 'ZappImmo';
  }
}
