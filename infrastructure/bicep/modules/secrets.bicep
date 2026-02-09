// =============================================================================
// Project Aether - Key Vault Secrets Module
// =============================================================================

param keyVaultName string
param secrets object
param identityPrincipalId string

// =============================================================================
// Key Vault Reference
// =============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// =============================================================================
// Secrets
// =============================================================================

resource kvSecrets 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = [for secret in items(secrets): {
  parent: keyVault
  name: secret.key
  properties: {
    value: secret.value
    contentType: 'text/plain'
  }
}]

// =============================================================================
// Outputs
// =============================================================================

output secretNames array = [for secret in items(secrets): secret.key]
