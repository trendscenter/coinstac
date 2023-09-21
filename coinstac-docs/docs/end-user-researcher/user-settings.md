# User Settings
User settings can be found by scrolling to the bottom of the sidebar and clicking on `settings`

![Settings bar](/img/settings-bar.JPG)

### User information
Modify your current user information
![User info](/img/settings-name.png)

### Clear local data
Removes locally stored data, which includes:
* local pipelines _only_ such as preprocessing pipelines
* data mappings for pipelines saved in the application
* cached data from remote pipelines used to map local data
This can be useful if there are errors mapping, note this will delete
the local pipeline data but _will not_ delete results from decentralized pipelines.

![User info](/img/settings-clear-data.png)

### Client server * experimental
If you wish to run a pipeline on a server that is one other than the computer
running the Coinstac UI, this option sets address for that server. To setup a client
server, contact the Coinstac team.
![User info](/img/settings-client-server.png)

### Network volume mounting
To run a computation with local data on a network mounted drive, such as a shared drive, or
a different drive than Coinstac is installed on, this option must be checked. Errors such as
'Cross device linking not permitted' are indicative of mounting issues.
![User info](/img/settings-network.png)

### Hide tutorial
Hides the help tutorials, unchecking will allow them to play the next restart
![User info](/img/settings-hide-tutorial.png)

### Update password
Updates the user password, for password reset use the reset form on the login screen
![User info](/img/settings-password.png)

### Container service * experimental
Changes the currently used container service for computations ran on this computer.
Options are Singularity and Docker, defaulting to Docker. Restart is unnecessary, some
functions may not be available using Singularity, such as the client server.
![User info](/img/settings-container-service.png)
