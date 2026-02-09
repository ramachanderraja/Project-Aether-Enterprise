// =============================================================================
// Project Aether - Azure Container Apps Infrastructure (Bicep)
// =============================================================================
// Deploys: ACR, Container Apps, PostgreSQL, Redis, Key Vault
// Usage:  az deployment sub create --location westus2 --template-file main.bicep
// =============================================================================

targetScope = 'subscription'

// =============================================================================
// Parameters
// =============================================================================

@description('Name of the project')
param projectName string = 'aether'

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Primary Azure region for all resources')
param location string = 'westus2'

@description('PostgreSQL administrator login')
param postgresAdminLogin string = 'aether_admin'

@description('PostgreSQL administrator password')
@secure()
param postgresAdminPassword string

@description('JWT secret for API authentication')
@secure()
param jwtSecret string

@description('Azure OpenAI API key')
@secure()
param azureOpenAiApiKey string = ''

@description('Azure OpenAI endpoint URL')
param azureOpenAiEndpoint string = 'https://westus.api.cognitive.microsoft.com/'

@description('Azure OpenAI deployment name')
param azureOpenAiDeploymentName string = 'gpt-4o'

@description('Tags applied to all resources - includes GEP required tags')
param tags object = {
  project: 'aether'
  managedBy: 'bicep'
  documentTeam: 'Architecture'
  projectName: 'IT'
  Owner: 'RRamachander'
  Department: 'R&D'
  CostCenter: 'GEPRnD'
}

// =============================================================================
// Variables
// =============================================================================

var resourcePrefix = '${projectName}-ca-${environment}'
var resourceGroupName = 'rg-${resourcePrefix}'
var acrName = replace('acr${projectName}${environment}', '-', '')
var logAnalyticsName = 'log-${resourcePrefix}'
var containerEnvName = 'cae-${resourcePrefix}'
var webAppName = 'ca-${resourcePrefix}-web'
var apiAppName = 'ca-${resourcePrefix}-api'
var postgresServerName = 'psql-${resourcePrefix}'
var redisName = 'redis-${resourcePrefix}'
var keyVaultName = 'kv-${resourcePrefix}'
var identityName = 'id-${resourcePrefix}'
var vnetName = 'vnet-${resourcePrefix}'

var allTags = union(tags, {
  environment: environment
})

// =============================================================================
// Resource Group
// =============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: allTags
}

// =============================================================================
// Module: Core Infrastructure
// =============================================================================

module coreInfra 'modules/core.bicep' = {
  name: 'core-infrastructure'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    identityName: identityName
    logAnalyticsName: logAnalyticsName
    vnetName: vnetName
    acrName: acrName
    keyVaultName: keyVaultName
  }
}

// =============================================================================
// Module: Data Services (PostgreSQL + Redis)
// =============================================================================

module dataServices 'modules/data.bicep' = {
  name: 'data-services'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    postgresServerName: postgresServerName
    postgresAdminLogin: postgresAdminLogin
    postgresAdminPassword: postgresAdminPassword
    redisName: redisName
    vnetId: coreInfra.outputs.vnetId
    dataSubnetId: coreInfra.outputs.dataSubnetId
    keyVaultName: coreInfra.outputs.keyVaultName
    projectName: projectName
    environment: environment
  }
  dependsOn: [coreInfra]
}

// =============================================================================
// Module: Container Apps (Web + API)
// =============================================================================

module containerApps 'modules/containers.bicep' = {
  name: 'container-apps'
  scope: resourceGroup
  params: {
    location: location
    tags: allTags
    containerEnvName: containerEnvName
    webAppName: webAppName
    apiAppName: apiAppName
    logAnalyticsId: coreInfra.outputs.logAnalyticsId
    appsSubnetId: coreInfra.outputs.appsSubnetId
    acrLoginServer: coreInfra.outputs.acrLoginServer
    acrName: coreInfra.outputs.acrName
    identityId: coreInfra.outputs.identityId
    identityClientId: coreInfra.outputs.identityClientId
    postgresHost: dataServices.outputs.postgresHost
    postgresDatabase: '${projectName}_${environment}'
    postgresAdminLogin: postgresAdminLogin
    postgresAdminPassword: postgresAdminPassword
    redisHost: dataServices.outputs.redisHost
    redisPort: dataServices.outputs.redisPort
    redisAccessKey: dataServices.outputs.redisAccessKey
    jwtSecret: jwtSecret
    azureOpenAiApiKey: azureOpenAiApiKey
    azureOpenAiEndpoint: azureOpenAiEndpoint
    azureOpenAiDeploymentName: azureOpenAiDeploymentName
    environment: environment
  }
  dependsOn: [coreInfra, dataServices]
}

// =============================================================================
// Module: Key Vault Secrets
// =============================================================================

module secrets 'modules/secrets.bicep' = {
  name: 'key-vault-secrets'
  scope: resourceGroup
  params: {
    keyVaultName: coreInfra.outputs.keyVaultName
    secrets: {
      'postgres-connection-string': dataServices.outputs.postgresConnectionString
      'redis-connection-string': dataServices.outputs.redisConnectionString
      'jwt-secret': jwtSecret
      'azure-openai-api-key': azureOpenAiApiKey
    }
    identityPrincipalId: coreInfra.outputs.identityPrincipalId
  }
  dependsOn: [coreInfra, dataServices]
}

// =============================================================================
// Outputs
// =============================================================================

output resourceGroupName string = resourceGroupName
output webUrl string = 'https://${containerApps.outputs.webFqdn}'
output apiUrl string = 'https://${containerApps.outputs.apiFqdn}'
output acrLoginServer string = coreInfra.outputs.acrLoginServer
output keyVaultUri string = coreInfra.outputs.keyVaultUri
output postgresHost string = dataServices.outputs.postgresHost
output redisHost string = dataServices.outputs.redisHost
