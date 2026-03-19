/**
 * OAuth Form Fields Component
 *
 * Renders the appropriate OAuth form fields based on the selected service type.
 * Separated into its own component for better modularity and maintainability.
 */

import { Input } from '@src/react/shared/components/ui/input';
import { Label } from '@src/react/shared/components/ui/label';
import { TextArea } from '@src/react/shared/components/ui/newDesign/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/react/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@src/react/shared/components/ui/tooltip';
import { OAUTH_SERVICES } from '@src/shared/helpers/oauth/oauth.utils';
import { Info } from 'lucide-react';
import React from 'react';
import type { OAuthConnectionFormData } from '../types/oauth-connection';

/**
 * Props for the OAuthFormFields component
 */
interface OAuthFormFieldsProps {
  /**
   * The current form data
   */
  formData: Partial<OAuthConnectionFormData>;

  /**
   * The currently selected OAuth service
   */
  selectedService: string;

  /**
   * Whether the form is currently being processed
   */
  isProcessing: boolean;

  /**
   * Whether vault keys are currently being resolved
   */
  isResolvingVaultKeys: boolean;

  /**
   * Whether to show OAuth 2.0 specific fields
   */
  showOAuth2Fields: boolean;

  /**
   * Whether to show OAuth 1.0a specific fields
   */
  showOAuth1Fields: boolean;

  /**
   * Whether to show Client Credentials specific fields
   */
  showClientCredentialsFields: boolean;

  /**
   * Whether to show the scope field
   */
  showScopeField: boolean;

  /**
   * The OAuth 2.0 callback URL (for display only)
   */
  oauth2CallbackURL?: string;

  /**
   * The OAuth 1.0a callback URL (for display only)
   */
  oauth1CallbackURL?: string;

  /**
   * Handler for input field changes
   */
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;

  /**
   * Handler for select field changes
   */
  handleSelectChange: (value: string) => void;
}

/**
 * Renders OAuth form fields based on the selected service type
 */
export function OAuthFormFields({
  formData,
  selectedService,
  isProcessing,
  isResolvingVaultKeys,
  showOAuth2Fields,
  showOAuth1Fields,
  showClientCredentialsFields,
  showScopeField,
  oauth2CallbackURL,
  oauth1CallbackURL,
  handleChange,
  handleSelectChange,
}: OAuthFormFieldsProps) {
  const isDisabled = isProcessing || isResolvingVaultKeys;

  return (
    <>
      {/* Name Field */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="ex. : Ma connexion Google"
            required
            disabled={isDisabled}
            fullWidth
          />
        </div>
      </div>

      {/* Platform Field */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="platform">
          Plateforme <span className="text-red-500">*</span>
        </Label>
        <div className="col-span-3">
          <Input
            id="platform"
            name="platform"
            value={formData.platform || ''}
            onChange={handleChange}
            placeholder="ex. : Google Mail, HubSpot CRM"
            required
            disabled={isDisabled}
            fullWidth
          />
        </div>
      </div>

      {/* OAuth Service Selector */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="oauthService">
          Auth Service <span className="text-red-500">*</span>
        </Label>
        <div className="col-span-3">
          <Select
            name="oauthService"
            value={selectedService}
            onValueChange={handleSelectChange}
            required
            disabled={isDisabled}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Sélectionner un service" />
            </SelectTrigger>
            <SelectContent>
              {OAUTH_SERVICES.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conditional Fields based on selectedService */}
      {selectedService !== 'None' && (
        <>
          {/* OAuth 2.0 Fields */}
          {(showOAuth2Fields || showClientCredentialsFields) && (
            <>
              {showOAuth2Fields && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="authorizationURL">URL d'autorisation</Label>
                  <div className="col-span-3">
                    <Input
                      id="authorizationURL"
                      name="authorizationURL"
                      value={formData.authorizationURL || ''}
                      onChange={handleChange}
                      placeholder="URL du point d'autorisation"
                      disabled={isDisabled}
                      fullWidth
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tokenURL">URL du jeton</Label>
                <div className="col-span-3">
                  <Input
                    id="tokenURL"
                    name="tokenURL"
                    value={formData.tokenURL || ''}
                    onChange={handleChange}
                    placeholder="URL du point de jeton"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientID">Identifiant client</Label>
                <div className="col-span-3">
                  <Input
                    id="clientID"
                    name="clientID"
                    value={formData.clientID || ''}
                    onChange={handleChange}
                    placeholder="Identifiant client OAuth"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientSecret">Secret client</Label>
                <div className="col-span-3">
                  <Input
                    id="clientSecret"
                    name="clientSecret"
                    type="password"
                    value={formData.clientSecret || ''}
                    onChange={handleChange}
                    placeholder="Secret client OAuth"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              {showClientCredentialsFields && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="flex items-center">
                    <Label htmlFor="audience">Audience (API)</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 cursor-help ml-2" />
                      </TooltipTrigger>
                      <TooltipContent className="w-64 text-center" side="right">
                        <p>Identifiant de l'API (requis par Auth0 et certains fournisseurs). Généralement l'URL ou l'identifiant de l'API.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="col-span-3">
                    <Input
                      id="audience"
                      name="audience"
                      value={formData.audience || ''}
                      onChange={handleChange}
                      placeholder="ex. : https://api.exemple.com ou https://your-api.auth0.com"
                      disabled={isDisabled}
                      fullWidth
                    />
                  </div>
                </div>
              )}
              {showOAuth2Fields && oauth2CallbackURL && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label>URL de rappel</Label>
                  <div className="col-span-3 text-sm text-gray-500 break-all">
                    {oauth2CallbackURL}
                  </div>
                </div>
              )}
            </>
          )}

          {/* OAuth 1.0a Fields */}
          {showOAuth1Fields && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="requestTokenURL">URL du jeton de requête</Label>
                <div className="col-span-3">
                  <Input
                    id="requestTokenURL"
                    name="requestTokenURL"
                    value={formData.requestTokenURL || ''}
                    onChange={handleChange}
                    placeholder="URL du jeton de requête"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accessTokenURL">URL du jeton d'accès</Label>
                <div className="col-span-3">
                  <Input
                    id="accessTokenURL"
                    name="accessTokenURL"
                    value={formData.accessTokenURL || ''}
                    onChange={handleChange}
                    placeholder="URL du jeton d'accès"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userAuthorizationURL">URL d'autorisation</Label>
                <div className="col-span-3">
                  <Input
                    id="userAuthorizationURL"
                    name="userAuthorizationURL"
                    value={formData.userAuthorizationURL || ''}
                    onChange={handleChange}
                    placeholder="URL d'autorisation utilisateur"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="consumerKey">Clé consommateur</Label>
                <div className="col-span-3">
                  <Input
                    id="consumerKey"
                    name="consumerKey"
                    value={formData.consumerKey || ''}
                    onChange={handleChange}
                    placeholder="Clé consommateur OAuth"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="consumerSecret">Secret consommateur</Label>
                <div className="col-span-3">
                  <Input
                    id="consumerSecret"
                    name="consumerSecret"
                    type="password"
                    value={formData.consumerSecret || ''}
                    onChange={handleChange}
                    placeholder="Secret consommateur OAuth"
                    disabled={isDisabled}
                    fullWidth
                  />
                </div>
              </div>
              {oauth1CallbackURL && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label>URL de rappel</Label>
                  <div className="col-span-3 text-sm text-gray-500 break-all">
                    {oauth1CallbackURL}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Scope Field (Common for most OAuth2 flows) */}
          {showScopeField && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="flex items-center">
                <Label htmlFor="scope">Permissions</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 cursor-help ml-2" />
                  </TooltipTrigger>
                  <TooltipContent className="w-52 text-center" side="right">
                    <p>Saisir les scopes séparés par des espaces (ex. : read write profile)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="col-span-3">
                <TextArea
                  id="scope"
                  name="scope"
                  value={formData.scope || ''}
                  onChange={handleChange}
                  placeholder="Saisir les scopes séparés par des espaces (ex. : read write profile)"
                  disabled={isDisabled}
                  fullWidth={true}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
