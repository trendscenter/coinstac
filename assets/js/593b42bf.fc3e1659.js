"use strict";(self.webpackChunkcoinstac_docs=self.webpackChunkcoinstac_docs||[]).push([[473],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>k});var a=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,o=function(e,t){if(null==e)return{};var n,a,o={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var p=a.createContext({}),s=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},u=function(e){var t=s(e.components);return a.createElement(p.Provider,{value:t},e.children)},c="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,o=e.mdxType,l=e.originalType,p=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),c=s(n),m=o,k=c["".concat(p,".").concat(m)]||c[m]||d[m]||l;return n?a.createElement(k,r(r({ref:t},u),{},{components:n})):a.createElement(k,r({ref:t},u))}));function k(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var l=n.length,r=new Array(l);r[0]=m;var i={};for(var p in t)hasOwnProperty.call(t,p)&&(i[p]=t[p]);i.originalType=e,i[c]="string"==typeof e?e:o,r[1]=i;for(var s=2;s<l;s++)r[s]=n[s];return a.createElement.apply(null,r)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},3578:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>r,default:()=>d,frontMatter:()=>l,metadata:()=>i,toc:()=>s});var a=n(7462),o=(n(7294),n(3905));const l={},r=void 0,i={unversionedId:"developer/vault-setup-ec2",id:"developer/vault-setup-ec2",title:"vault-setup-ec2",description:"---",source:"@site/docs/developer/vault-setup-ec2.md",sourceDirName:"developer",slug:"/developer/vault-setup-ec2",permalink:"/coinstac/developer/vault-setup-ec2",draft:!1,editUrl:"https://github.com/trendscenter/coinstac/tree/master/coinstac-docs/docs/developer/vault-setup-ec2.md",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Application overview",permalink:"/coinstac/developer/application-overview"}},p={},s=[{value:"sidebar_position: 3",id:"sidebar_position-3",level:2}],u={toc:s},c="wrapper";function d(e){let{components:t,...n}=e;return(0,o.kt)(c,(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("hr",null),(0,o.kt)("h2",{id:"sidebar_position-3"},"sidebar_position: 3"),(0,o.kt)("h1",{id:"creating-a-vault-sever-instance-on-ec2-ubuntu-lts"},"Creating a Vault sever instance on EC2 Ubuntu LTS"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/coinstac-vault-client"},"npm: coinstac-vault-client")),(0,o.kt)("h1",{id:"installing-docker"},"Installing Docker"),(0,o.kt)("p",null,"You can install Docker on your EC2 instance by following these steps:"),(0,o.kt)("p",null,"First, you need to connect to your instance. Here's a general way to connect:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Open a terminal."),(0,o.kt)("li",{parentName:"ol"},"Use the ",(0,o.kt)("inlineCode",{parentName:"li"},"ssh")," command to connect to your instance. You'll need the public DNS for your instance (something like ",(0,o.kt)("inlineCode",{parentName:"li"},"ec2-198-51-100-1.compute-1.amazonaws.com"),"), and the path to your private key (",(0,o.kt)("inlineCode",{parentName:"li"},".pem")," file). Replace ",(0,o.kt)("inlineCode",{parentName:"li"},"path/to/your/key.pem")," and ",(0,o.kt)("inlineCode",{parentName:"li"},"your_public_dns")," with your specific values in the following command:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"ssh -i /path/to/your/key.pem ubuntu@your_public_dns\n\n")),(0,o.kt)("p",null,"Once you're connected to your instance, you can install Docker with the following steps:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Update the ",(0,o.kt)("inlineCode",{parentName:"li"},"apt")," package index:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"sudo apt-get update\n\n")),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Install packages to allow ",(0,o.kt)("inlineCode",{parentName:"li"},"apt")," to use a repository over HTTPS:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"sudo apt-get install \\\\\n    apt-transport-https \\\\\n    ca-certificates \\\\\n    curl \\\\\n    gnupg \\\\\n    lsb-release\n\n")),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Add Docker's official GPG key:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"curl -fsSL <https://download.docker.com/linux/ubuntu/gpg> | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg\n\n")),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Use the following command to set up the stable repository.")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},'echo \\\\\n  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] <https://download.docker.com/linux/ubuntu> \\\\\n  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null\n\n')),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Update the ",(0,o.kt)("inlineCode",{parentName:"li"},"apt")," package index again, and install the latest version of Docker Engine and containerd:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"sudo apt-get update\nsudo apt-get install docker-ce docker-ce-cli containerd.io\n\n")),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Verify that Docker is installed correctly by running the hello-world image:")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"sudo docker run hello-world\n\n")),(0,o.kt)("p",null,"This command downloads a test image and runs it in a container. If everything is correctly installed, you should see a welcome message."),(0,o.kt)("p",null,"Please note that the Docker command line is run as ",(0,o.kt)("inlineCode",{parentName:"p"},"root"),", so you need to prefix the command with ",(0,o.kt)("inlineCode",{parentName:"p"},"sudo"),". If you want to avoid typing ",(0,o.kt)("inlineCode",{parentName:"p"},"sudo")," every time you run the Docker command, you can add your username to the Docker group:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"sudo usermod -aG docker ${USER}\n\n")),(0,o.kt)("p",null,"To apply the new group membership, you can log out of the instance and then log back in, or you can type the following:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"su - ${USER}\n\n")),(0,o.kt)("p",null,"You will be prompted to enter your password. Afterwards, you can confirm that your user is now added to the Docker group by typing:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"id -nG\n\n")),(0,o.kt)("p",null,"If everything was done correctly, Docker should now be installed and configured on your EC2 instance."),(0,o.kt)("h1",{id:"installing-nodejs"},"Installing Node.js"),(0,o.kt)("p",null,"Node.js is a popular JavaScript runtime that allows you to run JavaScript on your server. It's often used for building web servers and backend APIs."),(0,o.kt)("p",null,"Here are the steps to install Node.js LTS (Long Term Support) version on your Ubuntu EC2 instance:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"First, connect to your EC2 instance. Once you're logged in, you need to update the package list:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo apt-get update\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Install ",(0,o.kt)("inlineCode",{parentName:"p"},"curl")," if it's not already installed. ",(0,o.kt)("inlineCode",{parentName:"p"},"curl")," is a tool to transfer data from or to a server:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo apt-get install curl\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Next, you'll install NodeSource's Node.js binary distributions. They maintain reliable enterprise-grade, LTS version of Node.js. To enable the NodeSource repository, you can use the following ",(0,o.kt)("inlineCode",{parentName:"p"},"curl")," command:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"curl -sL <https://deb.nodesource.com/setup_lts.x> | sudo -E bash -\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Once you have the NodeSource repository enabled, you can install Node.js:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo apt-get install -y nodejs\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Verify that Node.js was installed correctly. You can do this by checking its version, which should display the version of the Node.js LTS release:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"node -v\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"It's also a good idea to check the version of NPM (Node Package Manager), which is a tool that's installed with Node.js and is used to manage Node.js packages:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"npm -v\n\n")))),(0,o.kt)("p",null,"Now you have Node.js LTS version installed on your Ubuntu EC2 instance!"),(0,o.kt)("h1",{id:"creating-a-systemd-service"},"Creating a systemd Service"),(0,o.kt)("p",null,"To set up a ",(0,o.kt)("inlineCode",{parentName:"p"},"systemd")," service for the ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client")," application, you first need to understand how to run your application manually (what command you use, any required environment variables, the working directory, and so on)."),(0,o.kt)("p",null,"The general steps I described earlier can be followed, with some modifications specific to ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client"),". Let's assume that you start your application with the command ",(0,o.kt)("inlineCode",{parentName:"p"},"node /path/to/your/app.js")," and the application's working directory is ",(0,o.kt)("inlineCode",{parentName:"p"},"/path/to/your/"),"."),(0,o.kt)("p",null,"Here's a sample systemd service file for the ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client"),":"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"[Unit]\nDescription=COINSTAC Vault Client\n\n[Service]\nExecStart=/usr/bin/node /usr/bin/coinstac-vault-client\nRestart=always\nEnvironmentFile=/home/ubuntu/vault_envars\nStandardOutput=journal\nStandardError=journal\nCapabilityBoundingSet=CAP_FOWNER\nSecureBits=keep-caps\nUser=ubuntu\n\n[Install]\nWantedBy=multi-user.target\n\n")),(0,o.kt)("p",null,"Here's what you need to do:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Create a new service file under ",(0,o.kt)("inlineCode",{parentName:"p"},"/etc/systemd/system")," named ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client.service"),":"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo nano /etc/systemd/system/coinstac-vault-client.service\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Copy the above service file content into the ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client.service")," file. Make sure to replace ",(0,o.kt)("inlineCode",{parentName:"p"},"/path/to/your/app.js")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"/path/to/your/")," with the actual path to your ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client")," application.")),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Save the file and close the text editor.")),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Reload the systemd daemon to read the new file:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo systemctl daemon-reload\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Start the ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client")," service:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo systemctl start coinstac-vault-client\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"Check the status of the ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client")," service:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo systemctl status coinstac-vault-client\n\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("p",{parentName:"li"},"If everything is working correctly, you can enable the ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client")," service to start on boot:"),(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo systemctl enable coinstac-vault-client\n\n")))),(0,o.kt)("p",null,"The ",(0,o.kt)("inlineCode",{parentName:"p"},"EnvironmentFile")," directive in the service file points to your ",(0,o.kt)("inlineCode",{parentName:"p"},".bashrc")," file where you've set up your environment variables. Systemd will source this file before starting the service, so all the necessary environment variables will be available for the ",(0,o.kt)("inlineCode",{parentName:"p"},"coinstac-vault-client")," service."),(0,o.kt)("h1",{id:"creating-and-attaching-an-ebs-volume"},"Creating and attaching an EBS volume"),(0,o.kt)("p",null,"To add a new EBS (Elastic Block Store) volume to an existing EC2 instance, follow these steps:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Create a new EBS volume"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},'Navigate to the Amazon EC2 console, and choose "Volumes" under "Elastic Block Store" in the navigation pane.'),(0,o.kt)("li",{parentName:"ul"},'Choose "Create Volume".'),(0,o.kt)("li",{parentName:"ul"},'In the "Create Volume" dialog box, choose settings for your new volume such as its type, size, and the availability zone (this must be the same as the instance you want to attach it to).'),(0,o.kt)("li",{parentName:"ul"},'Choose "Create".'))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Attach the EBS volume to your instance"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},'From the "Volumes" view in the Amazon EC2 console, select the volume you\'ve just created.'),(0,o.kt)("li",{parentName:"ul"},'Choose "Actions", then "Attach Volume".'),(0,o.kt)("li",{parentName:"ul"},'In the "Attach Volume" dialog box, select the instance you want to attach the volume to and specify a device name (like /dev/sdf, /dev/sdg, and so on, avoid /dev/sda1 which is usually taken by the root volume). Linux will assign a non-user-friendly device name regardless of the device name specified here.'),(0,o.kt)("li",{parentName:"ul"},'Choose "Attach".'))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Log in to your instance and check the new volume"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"Use SSH to connect to your instance."),(0,o.kt)("li",{parentName:"ul"},"To list the block devices, use the following command: ",(0,o.kt)("inlineCode",{parentName:"li"},"lsblk"),". You should see your new device in the list."),(0,o.kt)("li",{parentName:"ul"},"The new volume is raw and hasn't been formatted with a filesystem yet. You need to format it before usage. The command would look something like this: ",(0,o.kt)("inlineCode",{parentName:"li"},"sudo mkfs -t ext4 /dev/your_device_name"),"."))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Mount the new volume"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"Create a directory where you'll mount your new volume: ",(0,o.kt)("inlineCode",{parentName:"li"},"sudo mkdir /mount_point"),' (replace "/mount_point" with your preferred directory).'),(0,o.kt)("li",{parentName:"ul"},"Mount your volume: ",(0,o.kt)("inlineCode",{parentName:"li"},"sudo mount /dev/your_device_name /mount_point"),"."))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Configure the volume to automatically mount after a reboot"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"You have to add an entry to the ",(0,o.kt)("inlineCode",{parentName:"li"},"/etc/fstab")," file."),(0,o.kt)("li",{parentName:"ul"},"Make a backup of this file first: ",(0,o.kt)("inlineCode",{parentName:"li"},"sudo cp /etc/fstab /etc/fstab.bak"),"."),(0,o.kt)("li",{parentName:"ul"},"Get the UUID of the new volume: ",(0,o.kt)("inlineCode",{parentName:"li"},"sudo blkid"),"."),(0,o.kt)("li",{parentName:"ul"},"Edit the ",(0,o.kt)("inlineCode",{parentName:"li"},"fstab")," file: ",(0,o.kt)("inlineCode",{parentName:"li"},"sudo nano /etc/fstab"),"."),(0,o.kt)("li",{parentName:"ul"},"Add a line like this: ",(0,o.kt)("inlineCode",{parentName:"li"},"UUID=your_UUID /mount_point ext4 defaults,nofail 0 2"),'. Replace "your_UUID" with the UUID from the ',(0,o.kt)("inlineCode",{parentName:"li"},"blkid"),' command, and "/mount_point" with your directory.'),(0,o.kt)("li",{parentName:"ul"},"Save and exit."),(0,o.kt)("li",{parentName:"ul"},"To test, you can reboot your instance and check if the volume is still mounted.")))),(0,o.kt)("p",null,'Please replace "/dev/your_device_name", "/mount_point", and "your_UUID" with your actual device name, mount point, and UUID.'),(0,o.kt)("h1",{id:"loading-data-into-the-ebs-volume"},"Loading data into the EBS volume"),(0,o.kt)("p",null,"Here are the steps to upload and unzip a file into the EBS volume:"),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Upload the ZIP file to your EC2 instance"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"From your local system, use the ",(0,o.kt)("inlineCode",{parentName:"li"},"scp")," command (secure copy) to copy the file to your EC2 instance:",(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"scp -i /path/to/your/key.pem /path/to/your/local/file.zip ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com:/home/ubuntu/\n\n")),"  Replace the paths and AWS instance address accordingly. This command copies the ZIP file to the home directory of the Ubuntu user on the EC2 instance.\n"))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Move the ZIP file to the EBS volume"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"SSH into your EC2 instance.",(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"ssh -i /path/to/your/key.pem ubuntu@ec2-xx-xx-xx-xx.compute-1.amazonaws.com\n\n"))),(0,o.kt)("li",{parentName:"ul"},"Move the ZIP file to your EBS volume (assuming you mounted the EBS volume at ",(0,o.kt)("inlineCode",{parentName:"li"},"/mount_point"),"):",(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo mv /home/ubuntu/file.zip /mount_point/\n\n"))))),(0,o.kt)("li",{parentName:"ol"},(0,o.kt)("strong",{parentName:"li"},"Unzip the file"),":",(0,o.kt)("ul",{parentName:"li"},(0,o.kt)("li",{parentName:"ul"},"Go to your EBS volume directory:",(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"cd /mount_point/\n\n"))),(0,o.kt)("li",{parentName:"ul"},"Unzip the file:",(0,o.kt)("pre",{parentName:"li"},(0,o.kt)("code",{parentName:"pre"},"sudo unzip file.zip\n\n")))))),(0,o.kt)("p",null,"The ZIP file is now unzipped into your EBS volume. If ",(0,o.kt)("inlineCode",{parentName:"p"},"unzip")," is not installed, you can install it with ",(0,o.kt)("inlineCode",{parentName:"p"},"sudo apt install unzip"),"."),(0,o.kt)("p",null,"Please replace the paths, filenames, AWS instance address, and mount point accordingly."),(0,o.kt)("h1",{id:"create-a-config-file"},"Create a config file"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"/home/ubuntu/vault-config.json")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},'[\n  {\n    "id": "648b6a05b10ffd113efa82a3",\n    "name": "AMI test 1",\n    "apiKey": "5e3f70f8-4d7b-45b9-896b-fa8c7aead4f9"\n  }\n]\n')),(0,o.kt)("h1",{id:"create-an-environment-file-for-systemd"},"Create an environment file for systemd"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"/home/ubuntu/vault_envars")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"HEADLESS_CLIENT_CONFIG=/home/ubuntu/vault-config.json\nAPI_URL=https://coinstac.rs.gsu.edu/api\nSUB_API_URL=wss://coinstac.rs.gsu.edu:443/ws\nFILE_SERVER_HOSTNAME=coinstac.rs.gsu.edu\nFILE_SERVER_PATHNAME=/transfer\nFILE_SERVER_PROTOCOL=https:\nFILE_SERVER_PORT=443\nMQTT_SERVER_HOSTNAME=coinstac.rs.gsu.edu\nMQTT_SERVER_PORT=80\nMQTT_SERVER_PROTOCOL=mqtt:\nMQTT_WS_SERVER_HOSTNAME=coinstac.rs.gsu.edu\nMQTT_WS_SERVER_PATHNAME=/mqtt\nMQTT_WS_SERVER_PORT=443\nMQTT_WS_SERVER_PROTOCOL=wss:\n")),(0,o.kt)("p",null,"Set permissions on the correct folders"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-jsx"},"sudo chown -R ubuntu:ubuntu /tmp/.coinstac/input/\nsudo chmod -R 755 /tmp/.coinstac/input/\n\nsudo chown -R ubuntu:ubuntu /home/ubuntu/local_vault_data\nsudo chmod -R 755 /home/ubuntu/local_vault_data\n")))}d.isMDXComponent=!0}}]);