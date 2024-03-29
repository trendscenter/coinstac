# Using COINSTAC
Launch the COINSTAC application
## Logging in
![image](https://user-images.githubusercontent.com/7193853/207142269-9455fd80-1d6b-433c-8887-283e002f1bcc.png)

## Running an Analysis
Getting your first analysis done in Coinstac requires a few steps

### Create a consortium
A consortium is where all activity and collaboration stems from. A consortium is needed to run any analysis, but a consortium isn't limited to running one type of analysis, though only one can be 'set active' at a time.

![image](https://user-images.githubusercontent.com/7193853/207142777-76a12ad4-9899-4b44-84cc-c76fb5c841cf.png)
![image](https://user-images.githubusercontent.com/7193853/207142795-9b1b99b5-cbf4-49a0-b92f-e3485e2257ff.png)
![image](https://user-images.githubusercontent.com/7193853/207142866-de3aebfb-bf1b-4204-8479-83764a362b08.png)

### Add users to consortium
Add those who you'd like to join you in your analysis, they can also click 'join' as well if your consortium isn't set to private.

![image](https://user-images.githubusercontent.com/7193853/207143259-88393377-cad1-4ce9-beec-57e2a4a89630.png)

### Create a pipeline
A pipeline is the instantiation of a computation in relation to the data you'd like to analyze. Computations have certain fields that will need to be known before hand such that those that join can participate with the correct data.
![image](https://user-images.githubusercontent.com/7193853/207143322-1073a1b2-f96b-45b8-a378-329d27ac6962.png)
![image](https://user-images.githubusercontent.com/7193853/207143404-4bf8f41d-5282-4969-9b57-e34a2c85fde2.png)

#### Add owning consortium
![image](https://user-images.githubusercontent.com/7193853/207143665-f17e4525-5d36-4081-b0c5-b8bfea6720a4.png)
#### Add computation step
![image](https://user-images.githubusercontent.com/7193853/207143489-c259ea81-7d5c-46b9-af19-88ae99bd10a0.png)
![image](https://user-images.githubusercontent.com/7193853/207143595-93f15a08-8306-4606-a530-a2c8bdeb1dcc.png)

#### Specify inputs
Add the convariate names that you'd like to use for analysis, any continuous variables should be set as numbers, booleans and strings are categorical variables for their respective types.

Names here should reflect what you'd like to see referred to in the final results, however other user's variables don't have to actually match, that will be taken care of in the mapping step.
![image](https://user-images.githubusercontent.com/7193853/207143714-234b1472-b8d2-41da-9873-6c386ad59181.png)
![image](https://user-images.githubusercontent.com/7193853/207143741-2e62dcc8-20df-4189-b338-04c82eef9b04.png)
![image](https://user-images.githubusercontent.com/7193853/207143769-3d2e8fcf-0034-4e3b-94c9-86878d3dc6b6.png)
![image](https://user-images.githubusercontent.com/7193853/207143808-6fa30b07-96ea-440e-bc06-4ca402fbfcc4.png)

### Set active pipeline on consortium
This sets the pipeline to be run when the 'start' button is pressed, the other members will have to 'map' there data to the pipeline before they can join in. Note this can also be set from the pipeline creation page to save time.

![image](https://user-images.githubusercontent.com/7193853/207143900-3425a31f-c24f-43f5-b7cb-0ac70fac351f.png)
![image](https://user-images.githubusercontent.com/7193853/207143915-feb43e00-5bcd-4ac7-b0de-0cb808764b0c.png)
![image](https://user-images.githubusercontent.com/7193853/207143951-48e4ee6f-d418-484c-8bf4-4089328c73dc.png)

## Map data
Mapping data tells the computation where and what data you have to analyze, and allows normalization between different members if there are discrepancies in conventions.
![image](https://user-images.githubusercontent.com/7193853/207144004-3d03f72b-aba0-42b3-bee0-47f84b218ea7.png)
![image](https://user-images.githubusercontent.com/7193853/207144021-8ea4ecfc-1cbc-40ad-b0e6-04e29a30d9dd.png)
![image](https://user-images.githubusercontent.com/7193853/207144041-085cdabf-bb76-4bf4-bb34-55230142345b.png)

Auto mapping tries to match the given names to the data names in the given data file. Any incorrect or left over columns can be manually dragged to be set. Click 'Save' to finish the mapping step.
![image](https://user-images.githubusercontent.com/7193853/207144057-b4883954-1dd3-46dc-ba57-e1994822d378.png)

## Run a pipeline
Starting the analysis, the pipeline waits for all users to join and then commences.
![image](https://user-images.githubusercontent.com/7193853/207144083-389ac0bc-d86f-4de6-824f-67d0b6406b52.png)

Going to the Home screen will show the currently running pipeline, as well as its progress and what member(s) the aggregator is waiting on to finish up. This page can take a moment to update as results come in.
![image](https://user-images.githubusercontent.com/7193853/207144098-d7714286-8193-4951-b8ce-1a8637e8e2f7.png)

## View results
You're done! All results are available in the results tab, as well as any pipelines that may have failed. Coinstac stores the results in a directory in the users home with the unique paths per consortium per run, 'open results' will open this path on your drive.
![image](https://user-images.githubusercontent.com/7193853/207144123-cfd15839-5ee8-4a70-b6af-bacf19e52a77.png)
![image](https://user-images.githubusercontent.com/7193853/207144144-d1185047-0fba-4101-975f-ea7721cc731c.png)
