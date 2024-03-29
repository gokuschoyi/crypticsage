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
  -dependencies

* [Installation](#installation)
  -Steps on how to install

* [Usage](#usage)
  
* [License](#license)
  
* [API Documentation](#api-documentation)
  
* [Contributions](#contributions)
  
## Prerequisites
Specify the prerequisites required to use the crypticsage platform, including any dependencies.

---

## Installation
Provide step-by-step instructions on how to install and set up the crypticsage platform.

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
| Code                               | Reason                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 200 - OK                           | Everything worked as expected.                                                                                                             |
| 400 - Bad Request/Request Failed   | The request was unacceptable, invalid signup_type, username or password or the parameters were valid but the request failed. (Signup failed) |
| 429 - Too Many Requests            | Too many requests hit the API too quickly.                                                                                                 |
| 500, 502, 503, 504 - Server Errors | Something went wrong on our end                                                                                                            |

## User Route
### Endpoint/URL
Specify the endpoint or URL of the User route.

### Request
Specify the request details for the User route.

...

## Contributions
Specify guidelines for contributors and how they can contribute to the development of the crypticsage platform.