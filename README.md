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

## Installation

The following steps will guide you through the installation process for the backend only.

* #### Step 1: Clone the repository
```
git clone https://github.com/gokuschoyi/crypticsage.git
``` 

* #### Step 2: Install dependencies
  Change the working directory to backend and run the following command 
```
npm install
```

* #### Step 3: Create a .env file
```
PORT : 8080 // Port on which the server will run
HOST : localhost // Host on which the server will run
HOST_URL : http://localhost:8080 // Host URL

REDIS_PORT=6379 // Redis port
REDIS_HOST=localhost // Redis host

TOKEN_SECRET_KEY=secret // Secret key for JWT token
TOKEN_EXPIRATION_TIME=7d // Expiration time for JWT token

MONGO_URI=mongodb://localhost:27017/crypticsage // MongoDB URI

GOOGLE_OAUTH_CLIENT_ID= // Google OAuth Client ID

SOCKET_PORT=8081 // Web Socket port
```

* #### Step 4: Start Mongodb
```
sudo systemctl start mongod // start the mongodb service
sudo systemctl status mongod // check the status of the mongodb service
sudo systemctl stop mongod // stop the mongodb service
```

* #### Step 5: Start Redis-Server
```
sudo systemctl start redis-server // start the redis service
sudo systemctl status redis-server // check the status of the redis service
sudo systemctl stop redis-server // stop the redis service
```

* #### Step 6: Start the back-end server
```
npm start
```

If everything went well, you should see the following output in the terminal
```
20/08/2023, 3:06:29 pm [server.js] INFO: Starting server...
20/08/2023, 3:06:29 pm [server.js] INFO: Express server listening on port 8080
20/08/2023, 3:06:29 pm [server.js] INFO: WebSocket server running on port 8081
20/08/2023, 3:06:47 pm [redis.js] INFO: Redis server running on port : 6379
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