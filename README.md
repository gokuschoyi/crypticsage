<style>
  summary {
    background-color: #161616;
    line-height: 40px;
    padding-left:10px;
    align-items:'center';
    cursor:pointer;
    /* Add any other desired styles */
  }
</style>

# crypticsage

## Description
An online learning platform for individuals to learn about cryptocurrency, stocks and blockchain technology. 

## Table of Contents
* [Prerequisites](#prerequisites)

* [Installation](#installation)

* [Usage](#usage)
  
* [License](#license)
  
* [API Documentation](#api-documentation)
  
* [Contributions](#contributions)
  
## Prerequisites
The Installation assumes that you have a debain/ubuntu machine or a windows machine running [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) (Windows Subsystem for Linux) with [nodejs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) and npm installed. If you don't have nodejs and npm installed, please follow the instructions to install nodejs and npm.

The main reason behind using Ubuntu/WSL is because of the package [talib](https://www.npmjs.com/package/talib) (Technical Analysis library) and [redis](https://redis.io/docs/getting-started/) (Used for caching). Talib is available for windows but it requires Windows Build Tools 2015. I have not tested the package on windows so I cannot guarantee that it will work. If you are using windows, please follow the instructions to install [Windows Build Tools 2015](https://www.npmjs.com/package/windows-build-tools) ( deprecated package ). Redis is not available for windows, so you will have to use WSL. 

As a result of the above reasons, I would recommend using Ubuntu/WSL for development and production.

---

Please note that the installation steps provided in this guide are tailored for a system running on Ubuntu. If you are using a different operating system, the steps might vary.

Before proceeding with this guide, make sure you have an AWS EC2 instance running and you have established an SSH connection to it.

## Steps to Install Node.js and npm Using Node Version Manager (NVM)

1. **Install NVM:** The first step is to download and install NVM. You can do this by running the curl command below in your terminal:
    
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
    ```
    
2. This will install the `nvm` script to your user account. To use it, you must first source your `.bashrc` file:
    
    ```bash
    source ~/.bashrc
    ```
    
3. **Verify NVM Installation:** Close your terminal and reopen it. Then, verify that NVM has been installed correctly by checking its version:
    
    ```bash
    nvm --version
    ```
    
4. Now, you can ask NVM which versions of Node are available:
    
    ```bash
    nvm list-remote
    ```
    
5. **Install** your choice of node from the above list
    
    ```bash
    nvm install v19.8.1
    ```
    
6. **Check Node.js Installation:** You can check if Node.js is installed correctly by running the following command, which will print the version number:
    
    ```bash
    node -v
    ```
    
7. **Install npm:** With Node.js, npm (Node Version Manager) gets installed automatically. You can verify the installation and check the version with the following command:
    
    ```bash
    npm -v
    ```
    
8. **Switch Between Node Versions:** One of the benefits of NVM is the ability to switch Node.js versions. To install another version, use `nvm install` followed by the version number. To switch between installed versions, use `nvm use` followed by the version number.

## Steps to Install Redis on a Linux Machine

1. Add the repository to the apt index and create a list file for redis.
    
    ```bash
    curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
    ```
    
2. **Update Your System:** Keep your system up-to-date by running the following command:
    
    ```bash
    sudo apt-get update
    ```
    
3. **Install Redis:** The next step is to install Redis on your machine. You can do this by running the following command:
    
    ```bash
    sudo apt-get install redis
    ```
    
4. **Configure Redis:** Open the Redis configuration file with this command:
    
    ```bash
    sudo nano /etc/redis/redis.conf
    ```
    
    In the opened file, find the "supervised" directive and change it to "systemd". This will make sure Redis starts automatically when your system boots.
    
    1. **Save and Close the Configuration File:** Use CTRL+X to save and close the file. Confirm by typing 'Y' and then hit ENTER to confirm the changes.
5. **Restart Redis Service:** To implement the changes, restart the Redis service with the following command:
    
    ```bash
    sudo systemctl restart redis.service
    ```
    
6. **Verify Redis Installation:** You can check if Redis is working properly by running the following command, which will open the Redis client:

```bash
redis-cli
```

In the Redis client, type "ping". If Redis is running correctly, it will return "PONG".

## Steps to Install MongoDB on Ubuntu

1. **Import the MongoDB public GPG Key:** Start by importing the GPG key for the official MongoDB repository:
    
    ```bash
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
       sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
       --dearmor
    ```
    
2. **Create a list file for MongoDB:** Next, you need to create a list file for MongoDB. Run the following command in the terminal:
    
    ```bash
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    ```
    
3. **Update the packages list:** Update your Ubuntu packages list:
    
    ```bash
    sudo apt-get update
    ```
    
4. **Install MongoDB:** Now, you can install MongoDB by entering the following command:
    
    ```bash
    sudo apt-get install -y mongodb-org
    ```
    
5. **Start MongoDB:** After the installation process is complete, start the MongoDB service with the following command:
    
    ```bash
    sudo systemctl start mongod
    ```
    
6. **Enable MongoDB:** If you want to ensure that MongoDB starts every time your system starts, enable it by entering the following command:
    
    ```bash
    sudo systemctl enable mongod
    ```
    
7. **Verify the Installation:** Verify that MongoDB has been successfully installed and is running properly:
    
    ```bash
    mongosh --eval 'db.runCommand({ connectionStatus: 1 })'
    ```
    
    If MongoDB is installed correctly, you'll see an output that includes "ok" : 1.
    
    ## Configuring MongoDB with Admin and Project User
    
    1. **Start the MongoDB Shell:** Open your command line interface and enter the MongoDB shell by typing:
        
        ```bash
        mongosh
        ```
        
    2. **Create the Admin User:** Inside the MongoDB shell, enter the following command to switch to the admin database:
        
        ```bash
        use admin
        ```
        
        Then, create the admin user:
        
        ```bash
        db.createUser(
          {
            user: "<Your-Admin-Username>",
            pwd: "<Your-Admin-Password>",
            roles: [ 
        							{ role: "readWrite", db: "admin" },
        							{ role: "root", db: "admin" },
        							{ role: "readWriteAnyDatabase", db: "admin" },
        							{ role: "userAdminAnyDatabase", db: "admin" },
        							{ role: "backup", db: "admin" },
        					  ]
        	 }
        )
        ```
        
        Replace `<Your-Admin-Username>`  `<Your-Admin-Password>` with a username and a  secure password. This will create an admin user with the ability to manage users in any database and read-write data in any database along with root and backup.
        
    3. **Create the Project User:** Next, switch to your project's database:
        
        ```bash
        use crypticsage
        ```
        
        Then, create a user for your project:
        
        ```bash
        db.createUser(
          {
            user: "<Your-Project-User-Name>",
            pwd: "<Your-Project-User-Password>",
            roles: [ 
        							{ 
        								role: "readWrite", db: "binance_historical" } 
        								role: "readWrite", db: "crypticsage" }
        								role: "readWrite", db: "historical_data" }
        						]
          }
        )
        ```
        
        Replace `<Your-Project-User-Name>`  `<Your-Project-User-Password>` with a username and a secure password. This will create a user with read-write permissions for your project's databases.
        
    4. **Enable Authentication:** Exit the MongoDB shell and edit the mongod.conf security key authorization from disabled to enabled, to enable authentication across DB’s.
        
        ```
        sudo nano etc/mongod.conf
        ```
        
        ```
        security:
            authorization: enabled
        ```
        
    5.  Restart the MongoDB.
        
        ```bash
        sudo systemctl restart mongod
        ```
        
        Now, MongoDB users will need to provide their username and password to interact with the databases. Remember the credentials for the user created above will be used for the connection string to the DB in the express app. 
        
    
    ## Steps to Backup and Restore MongoDB Data(Optional)
    
    1. **Backup MongoDB Data:** You can create a backup of your MongoDB database using the `mongodump` command. This command dumps the entire data of your server into the dump directory. Because we have already created an admin user with backup privileges, we have to pass the credentials to dump and restore the data. 
        
        ```bash
        mongodump -u="<Your-Admin-Userame>" -p="<Your-Admin-Password>" --authenticationDatabase=admin --db=crypticsage --out="/location_of_your_choice/backup/"
        ```
        
        Replace `<Your-Admin-Username>` `<Your-Admin-Password>` with the credentials created for the admin above.
        
        Dump the required DB’s by changing the  —db flag with the DB name.
        
        Replace `/location_of_your_choice/backup/` with the path where you want your backup data to be stored.
        
    2. **Restore MongoDB Data:** If you need to restore your data from the backup, move the dumped data from the above step to your server/local machine and use the `mongorestore` command again with authentication. This command will restore all the data from the backup directory. 
    
    ```bash
    mongorestore -u="<Your-Admin-Username>" -p="<Your-Admin-Password>" authenticationDatabase=admin "/location_of_your_backup"
    ```
    
    Replace `/location_of_your_choice/backup` with the path where your backup data is stored.
    
    Remember to replace `<Your-Admin-Username>` and `<Your-Adminn-Password>` with with the one created above.
    

## Steps to Set Up the Backend in Remote Machine

1. **Install the Remote Explorer**: Open Visual Studio Code in your local machine and go to the Extensions view (`Ctrl+Shift+X`). Search for 'Remote Explorer' and install it.
2. **Open the Remote Explorer**: Click on the gear icon and open the ssh config file from the dropdown.
3. **Add your SSH host**: In the configuration file, you will need to add an entry for your SSH host. It should look something like this:
    
    ```
    Host '<Host_for_VS_Code>'
        HostName <AWS_Instance_IP>
        User ubuntu
    
    ```
    
    Replace `Host_for_VS_Code` with any name of your choice and  `AWS_Instance_IP`  with your server's IP address. The user is `ubuntu` by default.
    
4. **Connect to the SSH Host**: Save and close the configuration file. Click on the connect button.
5. **Work on your remote project**: Once connected, you can open a folder on your remote machine and start working on your project. To do this, go to `File > Open Folder...` and choose a directory on the remote machine.
6. Make sure that you have added your local machine’s public key to the known hosts file in the remote server.
7. **Install Git:** Git is required to clone your project from GitHub.
    
    ```bash
    sudo apt-get install git
    ```
    
8. **Clone the Project from GitHub:** Navigate to the directory where you want to clone your project, and paste the following code.
    
    ```bash
    git clone https://github.com/gokuschoyi/crypticsage.git
    ```
    
9. **Navigate to the Project Directory:** Use the `cd` command to navigate to the project directory.
    
    ```bash
    cd crypticsage/backend
    ```
    
10. **Install Project Dependencies:** Install the project's dependencies by using the `npm install` command.
    
    ```bash
    npm install
    ```
    
    Incase of an error when installing the dependencies for just the node-talib package, run the following command.
    
    ```bash
    sudo apt-get install -y build-essential
    ```
    
11. **Start the Project:** Start your project use the `npm start` command.
    
    Before starting the app, set up the env file in the backend root directory.
    
    ```
    #express configs
    
    PORT=8080
    HOST=localhost
    HOST_URL=http://localhost:8080
    
    REDIS_PORT=6379
    REDIS_HOST=localhost
    
    #token secret key for JWT
    TOKEN_SECRET_KEY=b75016eeb06922b38897e2d0e499af43ad838d718b106468bb6bf17d8c532cb6c155ebb7bfae28f248ed62c62ef063b4f9d3a10515d80df8485f965a5bd0b0f9
    
    # jwt token expirtion time
    TOKEN_EXPIRATION_TIME=7d
    
    #mongodb uri
    MONGO_URI=mongodb://<mongo-username>:<mongo-password>@127.0.0.1:<mongo-port>/?authMechanism=DEFAULT&authSource=<authentication-db>
    
    # google oauth client id
    GOOGLE_OAUTH_CLIENT_ID=<google-client-id>
    
    #web socket port number
    SOCKET_PORT=8081
    
    #websocket settings
    WEBSOCKET_FLAG=true 
    
    #scheduler settings
    SCHEDULER_FLAG=false
    
    #https settings
    HTTPS_FLAG=false
    
    # model training debug flag
    MODEL_TRAINING_DEBUG_FLAG=true
    ```
    
    ```bash
    npm start
    ```
    

If everything went well, the console log should look something like this.

```bash
10/28/2023, 4:10:25 AM [server.js] INFO: Starting server...
10/28/2023, 4:10:25 AM [server.js] INFO: Starting scheduled Crypto update...
10/28/2023, 4:10:25 AM [server.js] INFO: Express server listening on port : 8080
10/28/2023, 4:10:25 AM [server.js] INFO: WebSocket server running on port 8081
10/28/2023, 4:10:25 AM [redis.js] INFO: Redis server running on port : 6379
10/28/2023, 4:10:25 AM [mongoDBServices.js] INFO: Connected to Mongo database : 27017
```

We now need to expose the two ports of our app, 8080 for the API and 8081 for the websocket.

## Steps to Expose the Port from the AWS Instance

1. **Login to AWS Management Console:** Start by signing in to your AWS Management Console.
2. **Go to Security Groups:** Navigate to the EC2 Dashboard and click on 'Security Groups' under 'Network & Security'.
3. **Select the Security Group:** Locate and select the security group that's associated with your EC2 instance.
4. **Edit Inbound Rules:** Click on the 'Inbound rules' tab, and then click on 'Edit inbound rules'.
5. **Add a New Rule:** Click on 'Add rule'. Under 'Type', select 'Custom TCP'. Under 'Port range', enter the port number you want to expose. Under 'Source', select 'Anywhere' or 'My IP', depending on your requirements.
6. **Save the Rule:** Click 'Save rules' to apply the changes. Your port is now exposed and can accept incoming traffic.

Please note that exposing ports can expose your server to potential security risks. Always ensure you have necessary security measures in place.

## Steps to Expose the Port from the AWS Instance using AWS CLI

1. **Install AWS CLI:** If you haven't installed the AWS CLI on your local machine, you can do so by following the official AWS guide.
2. **Configure AWS CLI:** You will need to configure the AWS CLI with your AWS account credentials. You can do this by running the following command and following the prompts:
    
    ```bash
    aws configure
    ```
    
3. **Identify the Security Group:** Find the security group that's associated with your EC2 instance. You can list all your security groups with the following command:
    
    ```bash
    aws ec2 describe-security-groups
    ```
    
    Identify your security group from the output and note down its GroupId.
    
4. **Add an Inbound Rule:** Now you can add an inbound rule to your security group to expose your desired port. Use the following command, replacing 'YOUR_GROUP_ID' with your security group's GroupId and 'YOUR_PORT' with the port you want to expose:
    
    ```bash
    aws ec2 authorize-security-group-ingress --group-id YOUR_GROUP_ID --protocol tcp --port YOUR_PORT --cidr 0.0.0.0/0
    ```
    
    This command will expose the specified port to all IP addresses (0.0.0.0/0). If you want to restrict the IP addresses that can access this port, replace '0.0.0.0/0' with your desired IP range.
    

Your port is now exposed and can accept incoming traffic. As always, please be aware that exposing ports can present a security risk, and make sure you have the appropriate security measures in place.

To list a running instance

```bash
aws ec2 describe-instances
```

To list running ports

```bash
netstat -plnt
```
---

## Usage
Explain how users can effectively use the crypticsage platform and its various features.

---

## License
Include information about the license under which crypticsage is distributed.

---

## API Documentation
A detailed description and explanation of the different endpoints in the app. This API acts as the backbone of Crypticsage. All the endpoints will be listed below with request and response codes and examples will be provided.

### Routes
- [Auth Route](#auth-route)
  - [login](#login)
  - [signup](#signup)
- [User Route](#user-route)
- [Other Routes](#other-routes)

Base URL : http://localhost:8080

## Auth Route

<br />

* ### POST /login

<br />

#### Request
```json
{
  "username": "string",
  "password": "string",
  "login_type":"emailpassword|google|facebook"
}
```

<br />

#### For "login_types" google and facebook, username and password are not required

<br />

#### Response
<details>
  <summary>Show</summary>

```json
{
    "message": "User login successful",
    "data": {
        "email": "string",
        "displayName": "string",
        "emailVerified": true,
        "uid": "string",
        "profile_image": "string",
        "preferences": {
            "theme": true,
            "dashboardHover": true,
            "collapsedSidebar": true
        },
        "mobile_number": 1234567890,
        "accessToken": "string",
        "signup_type": "string",
        "admin_status": true,
        "lesson_status": {
            "2ab70e1b-3676-4b79-bfb5-57fd448ec98e": [
                {
                    "section_id": "string",
                    "lesson_id": "string",
                    "lesson_name": "string",
                    "next_chapter_id": 1,
                    "prev_chapter_id": 2,
                    "parent_section_id": "string",
                    "lesson_start": true,
                    "lesson_progress": 50,
                    "lesson_completed": false,
                    "lesson_completed_date": "2022-01-01"
                }
            ],
            "5119f37b-ef44-4272-a536-04af51ef4bbc": [
                {
                    "section_id": "string",
                    "lesson_id": "string",
                    "lesson_name": "string",
                    "next_chapter_id": 3,
                    "prev_chapter_id": 4,
                    "parent_section_id": "string",
                    "lesson_start": true,
                    "lesson_progress": 75,
                    "lesson_completed": true,
                    "lesson_completed_date": "2022-01-02"
                }
            ],
            "8a33e00c-a4fe-457f-ab9e-6772854c8e5c": [
                {
                    "section_id": "string",
                    "lesson_id": "string",
                    "lesson_name": "string",
                    "next_chapter_id": 5,
                    "prev_chapter_id": 6,
                    "parent_section_id": "string",
                    "lesson_start": true,
                    "lesson_progress": 100,
                    "lesson_completed": true,
                    "lesson_completed_date": "2022-01-03"
                }
            ]
        },
        "passwordEmptyFlag": false
    },
    "recent_lesson_quiz": {
        "mostRecentLesson": {},
        "mostRecentQuiz": {}
    }
}
```
</details>
<br />

#### Sample Payload

```json
{
  "email": "goku@gmail.com",
  "password": "654321",
  "login_type":"emailpassword"
}
```

#### Sample Response
<details>
  <summary>Show</summary>

```json
{
    "message": "User login successful",
    "data": {
        "email": "goku@gmail.com",
        "displayName": "goku",
        "emailVerified": false,
        "uid": "0560d146-9f18-41bd-b9b5-9be1b901adba",
        "profile_image": "",
        "preferences": {
            "theme": true,
            "dashboardHover": true,
            "collapsedSidebar": true
        },
        "mobile_number": "1234567890",
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imdva3VAZ21haWwuY29tIiwidWlkIjoiMDU2MGQxNDYtOWYxOC00MWJkLWI5YjUtOWJlMWI5MDFhZGJhIiwiaWF0IjoxNjg4NjI1ODE4LCJleHAiOjE2ODg3MTIyMTh9.oTzSmhMcvsIy0-h2SI4sU6YDc-_1sM7X1gVZt3uI59o",
        "signup_type": "registration",
        "admin_status": true,
        "lesson_status": {
            "2ab70e1b-3676-4b79-bfb5-57fd448ec98e": [
                {
                    "section_id": "2ab70e1b-3676-4b79-bfb5-57fd448ec98e",
                    "lesson_id": "8ed93f99-3c37-428c-af92-c322c79b4384",
                    "lesson_name": "qwe",
                    "next_chapter_id": null,
                    "prev_chapter_id": null,
                    "parent_section_id": null,
                    "lesson_start": false,
                    "lesson_progress": 1,
                    "lesson_completed": false,
                    "lesson_completed_date": ""
                }
            ],
            "5119f37b-ef44-4272-a536-04af51ef4bbc": [
                {
                    "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
                    "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
                    "lesson_name": "Candle Stick",
                    "next_chapter_id": null,
                    "prev_chapter_id": null,
                    "parent_section_id": null,
                    "lesson_start": false,
                    "lesson_progress": 1,
                    "lesson_completed": false,
                    "lesson_completed_date": ""
                }
            ],
            "8a33e00c-a4fe-457f-ab9e-6772854c8e5c": [
                {
                    "section_id": "8a33e00c-a4fe-457f-ab9e-6772854c8e5c",
                    "lesson_id": "2dac189d-87f8-4a1a-9f8a-8ed768a9c32a",
                    "lesson_name": "test 1234 lesson 1",
                    "next_chapter_id": null,
                    "prev_chapter_id": null,
                    "parent_section_id": null,
                    "lesson_start": false,
                    "lesson_progress": 1,
                    "lesson_completed": false,
                    "lesson_completed_date": ""
                }
            ]
        },
        "passwordEmptyFlag": false
    },
    "recent_lesson_quiz": {
        "mostRecentLesson": {},
        "mostRecentQuiz": {}
    }
}
```
</details>

<br />

### Error Codes

| Code                               | Reason                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 200 - OK                           | Everything worked as expected.                                                                                                             |
| 400 - Bad Request/Request Failed   | The request was unacceptable, invalid login_type, username or password or the parameters were valid but the request failed. (Login failed) |
| 429 - Too Many Requests            | Too many requests hit the API too quickly.                                                                                                 |
| 500, 502, 503, 504 - Server Errors | Something went wrong on our end                                                                                                            |

<br />

* ### POST /signup

<br />

#### Request
```json
{
    "userName":"string",
    "password":"string",
    "email":"string",
    "mobile_number": "number",
    "signup_type":"registration|google|facebook"
}
```

<br />

#### Response
```json
{
    "message": "Account created successfully"
}
```

#### Sample Payload

```json
{
    "userName":"Gokul",
    "password":"1234567",
    "email":"goku4@gmail.com",
    "mobile_number": 123456789,
    "signup_type":"registration"
}
```

#### Sample Response
```json
{
    "message": "Account created successfully"
}
```

### Error Codes
| Code                               | Reason                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 200 - OK                           | Everything worked as expected.                                                                                                               |
| 400 - Bad Request/Request Failed   | The request was unacceptable, invalid signup_type, username or password or the parameters were valid but the request failed. (Signup failed) |
| 429 - Too Many Requests            | Too many requests hit the API too quickly.                                                                                                   |
| 500, 502, 503, 504 - Server Errors | Something went wrong on our end                                                                                                              |

## User Route
### Endpoint/URL
Specify the endpoint or URL of the User route.

### Request
Specify the request details for the User route.

...

## Contributions
Specify guidelines for contributors and how they can contribute to the development of the crypticsage platform.