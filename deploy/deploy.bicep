

@minLength(3)
@maxLength(15)
param appName string

param location string = resourceGroup().location

var cosmosAccountName = '${appName}-${uniqueString(resourceGroup().id)}-cosmos'
var cosmosDatabaseName = 'SailboatDb'
var cosmosContainerName = 'BoatSales'

var storageAccountName = '${substring(appName,0,7)}${uniqueString(resourceGroup().id)}stg'
var appServicePlanName = '${appName}-${uniqueString(resourceGroup().id)}-asp'
var appInsightsName = '${appName}-${uniqueString(resourceGroup().id)}-ai'
var functionAppName = '${appName}-${uniqueString(resourceGroup().id)}-func'

output functionApp string = functionAppName


@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
  'Premium_ZRS'
  'Standard_GZRS'
  'Standard_RAGZRS'
])
param storageSku string = 'Standard_LRS'

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2020-03-01' = {
  name: cosmosAccountName
  location: location
  kind:'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    consistencyPolicy: {
      defaultConsistencyLevel:'Eventual'
    }
    locations: [
      {
        locationName: 'eastus'
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2020-03-01' = {
  name: '${cosmosAccount.name}/${cosmosDatabaseName}'
  properties:{
    resource: {
      id: cosmosDatabaseName
    }
    options: {
      throughput: '400'
    }
  }
  dependsOn: [
    cosmosAccount
  ]
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2020-03-01' = {
  name: '${cosmosDatabase.name}/${cosmosContainerName}'
  properties: {
    resource: {
      id: cosmosContainerName
      partitionKey:{
        paths: [
          '/model'
        ]
        kind:'Hash'
      }
    }
    options:{
      throughput: '400'
    }
  }
  dependsOn:[
    cosmosDatabase
  ]
}


resource storageAccount 'Microsoft.Storage/storageAccounts@2019-06-01' = {
  name: storageAccountName
  location: location
  sku: {
    name:storageSku
    tier: 'Standard'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02-preview' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties : {
    Application_Type: 'web'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
  tags: {
    //This is so things show up as linked resources, won't break if it's missing but we want app insights to show up as linked to the functionapp
     'hidden-link:/subscriptions/${subscription().id}/resourceGroups/${resourceGroup().name}/providers/Microsoft.Web/sites/${functionAppName}': 'Resource'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2020-10-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved:true
  }
}

resource functionApp 'Microsoft.Web/sites@2020-10-01' = {
  name:functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    httpsOnly:true
    serverFarmId: appServicePlan.id
    clientAffinityEnabled: true
    siteConfig: {
      appSettings: [
        {
          'name': 'APPINSIGHTS_INSTRUMENTATIONKEY'
          'value': appInsights.properties.InstrumentationKey
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, storageAccount.apiVersion).keys[0].value}'
        }
        {
          'name': 'FUNCTIONS_EXTENSION_VERSION'
          'value': '~3'
        }
        {
          'name': 'FUNCTIONS_WORKER_RUNTIME'
          'value': 'node'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, storageAccount.apiVersion).keys[0].value}'
        }
        {
          'name': 'CosmosUrl'
          'value': 'https://${cosmosAccount.name}.documents.azure.com:443/'
        }
        {
          'name': 'CosmosKey'
          'value': '${listKeys(cosmosAccount.id,cosmosAccount.apiVersion).primaryMasterKey}'
        }
        {
          'name': 'ImageStorage'
          'value': 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, storageAccount.apiVersion).keys[0].value}'
        }
        {
          'name': 'YachtWorldSearchUrl'
          'value': 'https://www.yachtworld.com/boats-for-sale/condition-used/type-sail/region-northamerica/country-united-states/us-region-southeast/us-region-mid-atlantic/?length=30-40&price=5000-35000'
        }
        {
          'name': 'runHeadless'
          'value': 'true'
        }
      ]
    }
  }
  dependsOn: [
    cosmosAccount
    storageAccount
    appServicePlan
    storageAccount
  ]
}
