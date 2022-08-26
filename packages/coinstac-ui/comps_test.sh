#!/bin/bash
while IFS="," read -r name alias repo number_sites data_type timeout covariates
do
  echo "Name: $name"
  echo "Alias: $alias"
  echo "Repo: $repo"
  echo "Number Sites: $number_sites"
  echo "Data Type: $data_type"
  echo "Timeout: $timeout"
  echo "Covariates: $covariates"
  npm run test:e2e-auto env DATA_TYPE="${data_type}" --comp_name="${name}" --comp_alias="${alias}" --comp_sites="${number_sites}" --comp_data_type="${data_type}" --comp_timeout="${timeout}" --comp_covariates="${covariates}"
done < <(tail -n +2 comps_test_info.csv)
