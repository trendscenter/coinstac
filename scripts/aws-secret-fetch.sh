if [ $1 -eq 0 ]; then
    echo "No MFA token provided"
    echo "The first argument for this script should be your MFA"
    echo "device's current valid rotating token"
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
CONFIG=$(aws secretsmanager get-secret-value --secret-id coinstac --query SecretString --output text)


unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
unset AWS_SESSION_TOKEN

if [ $2 = export ]; then
  echo "export CLOUDINARY_UPLOAD_PRESET=$(echo $CONFIG | jq -r .CLOUDINARY_UPLOAD_PRESET)"
  echo "export CLOUDINARY_API_KEY=$(echo $CONFIG | jq -r .CLOUDINARY_API_KEY)"
  echo "export CLOUDINARY_API_SECRET=$(echo $CONFIG | jq -r .CLOUDINARY_API_SECRET)"
  echo "export CLOUDINARY_UPLOAD_URL=$(echo $CONFIG | jq -r .CLOUDINARY_UPLOAD_URL)"
  echo "export CLOUDINARY_DELETE_URL=$(echo $CONFIG | jq -r .CLOUDINARY_DELETE_URL)"
  echo "export GITHUB_ACCESS_TOKEN=$(echo $CONFIG | jq -r .GITHUB_ACCESS_TOKEN)"
  echo "export SENDGRID_API_KEY=$(echo $CONFIG | jq -r .SENDGRID_API_KEY)"
else
  echo $CONFIG
fi
