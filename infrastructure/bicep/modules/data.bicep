// =============================================================================
// Project Aether - Data Services Module
// PostgreSQL Flexible Server + Azure Cache for Redis
// =============================================================================

param location string
param tags object
param postgresServerName string
param postgresAdminLogin string
@secure()
param postgresAdminPassword string
param redisName string
param vnetId string
param dataSubnetId string
param keyVaultName string
param projectName string
param environment string

// =============================================================================
// Private DNS Zone for PostgreSQL
// =============================================================================

resource postgresDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: '${postgresServerName}.private.postgres.database.azure.com'
  location: 'global'
  tags: tags
}

resource postgresDnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: postgresDnsZone
  name: 'postgres-vnet-link'
  location: 'global'
  tags: tags
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// =============================================================================
// PostgreSQL Flexible Server
// =============================================================================

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: postgresServerName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: dataSubnetId
      privateDnsZoneArmResourceId: postgresDnsZone.id
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
  dependsOn: [postgresDnsLink]
}

// Create the database
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgresServer
  name: '${projectName}_${environment}'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// =============================================================================
// Azure Cache for Redis
// =============================================================================

resource redis 'Microsoft.Cache/redis@2024-03-01' = {
  name: redisName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    redisConfiguration: {
      'maxmemory-policy': 'volatile-lru'
    }
  }
}

// =============================================================================
// Outputs
// =============================================================================

var postgresHost = '${postgresServer.name}.postgres.database.azure.com'
var postgresConnectionString = 'postgresql://${postgresAdminLogin}:${uriComponent(postgresAdminPassword)}@${postgresHost}:5432/${projectName}_${environment}?sslmode=require'
var redisConnectionString = 'rediss://:${redis.listKeys().primaryKey}@${redis.properties.hostName}:${redis.properties.sslPort}'

output postgresHost string = postgresHost
output postgresConnectionString string = postgresConnectionString
output redisHost string = redis.properties.hostName
output redisPort int = redis.properties.sslPort
output redisAccessKey string = redis.listKeys().primaryKey
output redisConnectionString string = redisConnectionString
