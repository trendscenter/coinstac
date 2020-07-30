if [ $1 -eq 0 ] || [ $2 = "" ] || [ $3 = "" ]; then
    echo "Incorrect arguments"
    echo ""
    echo "First argument for this script should be your MFA"
    echo "  device's current valid rotating token"
    echo ""
    echo "Second argument is the config env [prod, dev, local]"
    echo ""
    echo "Third is the output type [export, systemd, json]"
    exit 1
fi
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN

SESSION=$(aws sts get-session-token --serial-number $MFA_ARN --token-code $1)
ACCESSKEYID=$(echo $SESSION | jq -r .Credentials.AccessKeyId)
SECRETACCESSKEY=$(echo $SESSION | jq -r .Credentials.SecretAccessKey)
SESSIONTOKEN=$(echo $SESSION | jq -r .Credentials.SessionToken)

export AWS_ACCESS_KEY_ID=$ACCESSKEYID
export AWS_SECRET_ACCESS_KEY=$SECRETACCESSKEY
export AWS_SESSION_TOKEN=$SESSIONTOKEN
if [ $2 != prod ]; then
  SECRETID="coinstac-$2"
else
  SECRETID="coinstac"
fi
CONFIG=$(aws secretsmanager get-secret-value --secret-id $SECRETID --query SecretString --output text)


unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN

if [ $3 = export ]; then
  echo "export CLOUDINARY_UPLOAD_PRESET=$(echo $CONFIG | jq -r .CLOUDINARY_UPLOAD_PRESET)"
  echo "export CLOUDINARY_API_KEY=$(echo $CONFIG | jq -r .CLOUDINARY_API_KEY)"
  echo "export CLOUDINARY_API_SECRET=$(echo $CONFIG | jq -r .CLOUDINARY_API_SECRET)"
  echo "export CLOUDINARY_UPLOAD_URL=$(echo $CONFIG | jq -r .CLOUDINARY_UPLOAD_URL)"
  echo "export CLOUDINARY_DELETE_URL=$(echo $CONFIG | jq -r .CLOUDINARY_DELETE_URL)"
  echo "export GITHUB_ACCESS_TOKEN=$(echo $CONFIG | jq -r .GITHUB_ACCESS_TOKEN)"
  echo "export SENDGRID_API_KEY=$(echo $CONFIG | jq -r .SENDGRID_API_KEY)"
  echo "export API_SERVER_PORT=$(echo $CONFIG | jq -r .API_SERVER_PORT)"
  echo "export API_SERVER_HOSTNAME=$(echo $CONFIG | jq -r .API_SERVER_HOSTNAME)"
  echo "export MONGODB_CONN_STRING=$(echo $CONFIG | jq -r .MONGODB_CONN_STRING)"
  echo "export DATABASE_NAME=$(echo $CONFIG | jq -r .DATABASE_NAME)"
  echo "export PIPELINE_SERVER_PORT=$(echo $CONFIG | jq -r .PIPELINE_SERVER_PORT)"
  echo "export PIPELINE_SERVER_HOSTNAME=$(echo $CONFIG | jq -r .PIPELINE_SERVER_HOSTNAME)"
  echo "export PIPELINE_SERVER_OPERARTING_DIR=$(echo $CONFIG | jq -r .PIPELINE_SERVER_OPERARTING_DIR)"
  echo "export MQTT_SERVER_HOSTNAME=$(echo $CONFIG | jq -r .MQTT_SERVER_HOSTNAME)"
  echo "export MQTT_SERVER_PATHNAME=$(echo $CONFIG | jq -r .MQTT_SERVER_PATHNAME)"
  echo "export MQTT_SERVER_PORT=$(echo $CONFIG | jq -r .MQTT_SERVER_PORT)"
  echo "export MQTT_SERVER_PROTOCOL=$(echo $CONFIG | jq -r .MQTT_SERVER_PROTOCOL)"
elif [ $3 = systemd ]; then
  echo "CLOUDINARY_UPLOAD_PRESET=$(echo $CONFIG | jq -r .CLOUDINARY_UPLOAD_PRESET)"
  echo "CLOUDINARY_API_KEY=$(echo $CONFIG | jq -r .CLOUDINARY_API_KEY)"
  echo "CLOUDINARY_API_SECRET=$(echo $CONFIG | jq -r .CLOUDINARY_API_SECRET)"
  echo "CLOUDINARY_UPLOAD_URL=$(echo $CONFIG | jq -r .CLOUDINARY_UPLOAD_URL)"
  echo "CLOUDINARY_DELETE_URL=$(echo $CONFIG | jq -r .CLOUDINARY_DELETE_URL)"
  echo "GITHUB_ACCESS_TOKEN=$(echo $CONFIG | jq -r .GITHUB_ACCESS_TOKEN)"
  echo "SENDGRID_API_KEY=$(echo $CONFIG | jq -r .SENDGRID_API_KEY)"
  echo "API_SERVER_PORT=$(echo $CONFIG | jq -r .API_SERVER_PORT)"
  echo "API_SERVER_HOSTNAME=$(echo $CONFIG | jq -r .API_SERVER_HOSTNAME)"
  echo "MONGODB_CONN_STRING=$(echo $CONFIG | jq -r .MONGODB_CONN_STRING)"
  echo "DATABASE_NAME=$(echo $CONFIG | jq -r .DATABASE_NAME)"
  echo "PIPELINE_SERVER_PORT=$(echo $CONFIG | jq -r .PIPELINE_SERVER_PORT)"
  echo "PIPELINE_SERVER_HOSTNAME=$(echo $CONFIG | jq -r .PIPELINE_SERVER_HOSTNAME)"
  echo "PIPELINE_SERVER_OPERARTING_DIR=$(echo $CONFIG | jq -r .PIPELINE_SERVER_OPERARTING_DIR)"
  echo "MQTT_SERVER_HOSTNAME=$(echo $CONFIG | jq -r .MQTT_SERVER_HOSTNAME)"
  echo "MQTT_SERVER_PATHNAME=$(echo $CONFIG | jq -r .MQTT_SERVER_PATHNAME)"
  echo "MQTT_SERVER_PORT=$(echo $CONFIG | jq -r .MQTT_SERVER_PORT)"
  echo "MQTT_SERVER_PROTOCOL=$(echo $CONFIG | jq -r .MQTT_SERVER_PROTOCOL)"
else
  echo $CONFIG
fi
