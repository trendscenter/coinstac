
---
sidebar_position: 3
---

# Creating a Vault instance on EC2 Ubuntu LTS


[npm: coinstac-vault-client](https://www.npmjs.com/package/coinstac-vault-client)

# Installing Docker

You can install Docker on your EC2 instance by following these steps:

First, you need to connect to your instance. Here's a general way to connect:

1. Open a terminal.
2. Use the `ssh` command to connect to your instance. You'll need the public DNS for your instance (something like `ec2-198-51-100-1.compute-1.amazonaws.com`), and the path to your private key (`.pem` file). Replace `path/to/your/key.pem` and `your_public_dns` with your specific values in the following command:

```
ssh -i /path/to/your/key.pem ubuntu@your_public_dns

```

Once you're connected to your instance, you can install Docker with the following steps:

1. Update the `apt` package index:

```
sudo apt-get update

```

1. Install packages to allow `apt` to use a repository over HTTPS:

```
sudo apt-get install \\
    apt-transport-https \\
    ca-certificates \\
    curl \\
    gnupg \\
    lsb-release

```

1. Add Docker's official GPG key:

```
curl -fsSL <https://download.docker.com/linux/ubuntu/gpg> | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

```

1. Use the following command to set up the stable repository.

```
echo \\
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] <https://download.docker.com/linux/ubuntu> \\
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

```

1. Update the `apt` package index again, and install the latest version of Docker Engine and containerd:

```
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

```

1. Verify that Docker is installed correctly by running the hello-world image:

```
sudo docker run hello-world

```

This command downloads a test image and runs it in a container. If everything is correctly installed, you should see a welcome message.

Please note that the Docker command line is run as `root`, so you need to prefix the command with `sudo`. If you want to avoid typing `sudo` every time you run the Docker command, you can add your username to the Docker group:

```
sudo usermod -aG docker ${USER}

```

To apply the new group membership, you can log out of the instance and then log back in, or you can type the following:

```
su - ${USER}

```

You will be prompted to enter your password. Afterwards, you can confirm that your user is now added to the Docker group by typing:

```
id -nG

```

If everything was done correctly, Docker should now be installed and configured on your EC2 instance.

# Installing Node.js

Node.js is a popular JavaScript runtime that allows you to run JavaScript on your server. It's often used for building web servers and backend APIs.

Here are the steps to install Node.js LTS (Long Term Support) version on your Ubuntu EC2 instance:

1. First, connect to your EC2 instance. Once you're logged in, you need to update the package list:
    
    ```
    sudo apt-get update
    
    ```
    
2. Install `curl` if it's not already installed. `curl` is a tool to transfer data from or to a server:
    
    ```
    sudo apt-get install curl
    
    ```
    
3. Next, you'll install NodeSource's Node.js binary distributions. They maintain reliable enterprise-grade, LTS version of Node.js. To enable the NodeSource repository, you can use the following `curl` command:
    
    ```
    curl -sL <https://deb.nodesource.com/setup_lts.x> | sudo -E bash -
    
    ```
    
4. Once you have the NodeSource repository enabled, you can install Node.js:
    
    ```
    sudo apt-get install -y nodejs
    
    ```
    
5. Verify that Node.js was installed correctly. You can do this by checking its version, which should display the version of the Node.js LTS release:
    
    ```
    node -v
    
    ```
    
6. It's also a good idea to check the version of NPM (Node Package Manager), which is a tool that's installed with Node.js and is used to manage Node.js packages:
    
    ```
    npm -v
    
    ```
    

Now you have Node.js LTS version installed on your Ubuntu EC2 instance!

# Creating a systemd Service

To set up a `systemd` service for the `coinstac-vault-client` application, you first need to understand how to run your application manually (what command you use, any required environment variables, the working directory, and so on).

The general steps I described earlier can be followed, with some modifications specific to `coinstac-vault-client`. Let's assume that you start your application with the command `node /path/to/your/app.js` and the application's working directory is `/path/to/your/`.

Here's a sample systemd service file for the `coinstac-vault-client`:

```
[Unit]
Description=COINSTAC Vault Client

[Service]
ExecStart=/usr/bin/node /usr/bin/coinstac-vault-client
Restart=always
EnvironmentFile=/home/ubuntu/vault_envars
StandardOutput=journal
StandardError=journal
CapabilityBoundingSet=CAP_FOWNER
SecureBits=keep-caps
User=ubuntu

[Install]
WantedBy=multi-user.target

```

Here's what you need to do:

1. Create a new service file under `/etc/systemd/system` named `coinstac-vault-client.service`:
    
    ```
    sudo nano /etc/systemd/system/coinstac-vault-client.service
    
    ```
    
2. Copy the above service file content into the `coinstac-vault-client.service` file. Make sure to replace `/path/to/your/app.js` and `/path/to/your/` with the actual path to your `coinstac-vault-client` application.
3. Save the file and close the text editor.
4. Reload the systemd daemon to read the new file:
    
    ```
    sudo systemctl daemon-reload
    
    ```
    
5. Start the `coinstac-vault-client` service:
    
    ```
    sudo systemctl start coinstac-vault-client
    
    ```
    
6. Check the status of the `coinstac-vault-client` service:
    
    ```
    sudo systemctl status coinstac-vault-client
    
    ```
    
7. If everything is working correctly, you can enable the `coinstac-vault-client` service to start on boot:
    
    ```
    sudo systemctl enable coinstac-vault-client
    
    ```
    

The `EnvironmentFile` directive in the service file points to your `.bashrc` file where you've set up your environment variables. Systemd will source this file before starting the service, so all the necessary environment variables will be available for the `coinstac-vault-client` service.

# Creating and attaching an EBS volume

To add a new EBS (Elastic Block Store) volume to an existing EC2 instance, follow these steps:

1. **Create a new EBS volume**:
    - Navigate to the Amazon EC2 console, and choose "Volumes" under "Elastic Block Store" in the navigation pane.
    - Choose "Create Volume".
    - In the "Create Volume" dialog box, choose settings for your new volume such as its type, size, and the availability zone (this must be the same as the instance you want to attach it to).
    - Choose "Create".
2. **Attach the EBS volume to your instance**:
    - From the "Volumes" view in the Amazon EC2 console, select the volume you've just created.
    - Choose "Actions", then "Attach Volume".
    - In the "Attach Volume" dialog box, select the instance you want to attach the volume to and specify a device name (like /dev/sdf, /dev/sdg, and so on, avoid /dev/sda1 which is usually taken by the root volume). Linux will assign a non-user-friendly device name regardless of the device name specified here.
    - Choose "Attach".
3. **Log in to your instance and check the new volume**:
    - Use SSH to connect to your instance.
    - To list the block devices, use the following command: `lsblk`. You should see your new device in the list.
    - The new volume is raw and hasn't been formatted with a filesystem yet. You need to format it before usage. The command would look something like this: `sudo mkfs -t ext4 /dev/your_device_name`.
4. **Mount the new volume**:
    - Create a directory where you'll mount your new volume: `sudo mkdir /mount_point` (replace "/mount_point" with your preferred directory).
    - Mount your volume: `sudo mount /dev/your_device_name /mount_point`.
5. **Configure the volume to automatically mount after a reboot**:
    - You have to add an entry to the `/etc/fstab` file.
    - Make a backup of this file first: `sudo cp /etc/fstab /etc/fstab.bak`.
    - Get the UUID of the new volume: `sudo blkid`.
    - Edit the `fstab` file: `sudo nano /etc/fstab`.
    - Add a line like this: `UUID=your_UUID /mount_point ext4 defaults,nofail 0 2`. Replace "your_UUID" with the UUID from the `blkid` command, and "/mount_point" with your directory.
    - Save and exit.
    - To test, you can reboot your instance and check if the volume is still mounted.

Please replace "/dev/your_device_name", "/mount_point", and "your_UUID" with your actual device name, mount point, and UUID.

# Loading data into the EBS volume

Here are the steps to upload and unzip a file into the EBS volume:

1. **Upload the ZIP file to your EC2 instance**:
    - From your local system, use the `scp` command (secure copy) to copy the file to your EC2 instance:
        
        ```
        scp -i /path/to/your/key.pem /path/to/your/local/file.zip ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com:/home/ubuntu/
        
        ```
        
        Replace the paths and AWS instance address accordingly. This command copies the ZIP file to the home directory of the Ubuntu user on the EC2 instance.
        
2. **Move the ZIP file to the EBS volume**:
    - SSH into your EC2 instance.
        
        ```
        ssh -i /path/to/your/key.pem ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com
        
        ```
        
    - Move the ZIP file to your EBS volume (assuming you mounted the EBS volume at `/mount_point`):
        
        ```
        sudo mv /home/ubuntu/file.zip /mount_point/
        
        ```
        
3. **Unzip the file**:
    - Go to your EBS volume directory:
        
        ```
        cd /mount_point/
        
        ```
        
    - Unzip the file:
        
        ```
        sudo unzip file.zip
        
        ```
        

The ZIP file is now unzipped into your EBS volume. If `unzip` is not installed, you can install it with `sudo apt install unzip`.

Please replace the paths, filenames, AWS instance address, and mount point accordingly.

# Create a config file

`/home/ubuntu/vault-config.json`

```
[
  {
    "id": "648b6a05b10ffd113efa82a3",
    "name": "AMI test 1",
    "apiKey": "5e3f70f8-4d7b-45b9-896b-fa8c7aead4f9"
  }
]
```

# Create an environment file for systemd

`/home/ubuntu/vault_envars`

```
HEADLESS_CLIENT_CONFIG=/home/ubuntu/vault-config.json
API_URL=https://coinstac.rs.gsu.edu/api
SUB_API_URL=wss://coinstac.rs.gsu.edu:443/ws
FILE_SERVER_HOSTNAME=coinstac.rs.gsu.edu
FILE_SERVER_PATHNAME=/transfer
FILE_SERVER_PROTOCOL=https:
FILE_SERVER_PORT=443
MQTT_SERVER_HOSTNAME=coinstac.rs.gsu.edu
MQTT_SERVER_PORT=80
MQTT_SERVER_PROTOCOL=mqtt:
MQTT_WS_SERVER_HOSTNAME=coinstac.rs.gsu.edu
MQTT_WS_SERVER_PATHNAME=/mqtt
MQTT_WS_SERVER_PORT=443
MQTT_WS_SERVER_PROTOCOL=wss:
```

Set permissions on the correct folders

```jsx
sudo chown -R ubuntu:ubuntu /tmp/.coinstac/input/
sudo chmod -R 755 /tmp/.coinstac/input/

sudo chown -R ubuntu:ubuntu /home/ubuntu/local_vault_data
sudo chmod -R 755 /home/ubuntu/local_vault_data
```
