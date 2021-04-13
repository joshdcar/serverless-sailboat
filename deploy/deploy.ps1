$RESOURCE_GROUP = "serverless-sailing"
$APP_NAME = "sailing"
$BICEP_FILE = "deploy.bicep"
$LOCATION = "eastus"

az group create -n $RESOURCE_GROUP -l $LOCATION

az deployment group create `
    --name serverlesssailingdeployment `
    --resource-group $RESOURCE_GROUP `
    --template-file $BICEP_FILE `
    --parameters "appName=$APP_NAME"

# func azure functionapp publish [function-app-name] --build remote


