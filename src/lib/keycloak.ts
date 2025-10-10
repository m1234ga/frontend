import Keycloak from 'keycloak-js';

export const keycloakInitOptions = {
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || '',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || '',
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || '',
  checkLoginIframe: false,
  onLoad: 'check-sso',
  promiseType: 'native',
};

const keycloak = new Keycloak(keycloakInitOptions);

export default keycloak;
