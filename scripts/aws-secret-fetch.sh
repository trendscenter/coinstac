if [ $1 -eq 0 ] || [ $2 = "" ] || [ $3 = "" ]; then
    echo "Incorrect arguments"
    echo ""
    echo "First argument for this script should be your MFA"
    echo "  device's current valid rotating token"
    echo ""
    echo "Second argument is the config env [prod, dev, local]"
    echo ""
    echo "Third is the output type [export, systemd, json, shell]"
    exit 1
fi

if [ $4 != "ci" ]; then
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
fi

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
  echo $CONFIG | jq -r 'to_entries[] | "export \(.key)=\(.value)"'
elif [ $3 = systemd ]; then
  echo $CONFIG | jq -r 'to_entries[] | "\(.key)=\(.value)"'
elif [ $3 = shell ]; then
  export $CONFIG | jq -r 'to_entries[] | "\(.key)=\(.value)"'
else
  echo $CONFIG
fi
