[Go Back](../README.md#auth-routes)

## Auth Route

- ### POST /login

  Endpoint for user logins

  **Kind**: inner property of [<code>route/auth</code>](../README.md#auth-routes)  
   **Path**: <code>POST</code> /auth/login

  **Body**: <code>string</code> login_type - Type of login. Can be `emailpassword` | `google` | `facebook`  
   **Body**: <code>string</code> email - Email of the user if "login_type" is emailpassword else leave empty  
   **Body**: <code>string</code> password - Password of the user if "login_type" is emailpassword else leave empty  
   **Body**: <code>string</code> credential - The google credential from google auth if "login_type" is google else leave empty  
   **Body**: <code>string</code> facebook_email - The facebook email if `login_type` is facebook else leave empty

  **Code**: <code>200</code> User login successful  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Login successful  
   **Response**: <code>object</code> data - UserLoginPayload  
   **Response**: <code>object</code> recent_lesson_quiz - RecentLessonQuiz  
   **Response**: <code>object</code> word - Word

  **See**: [authController.loginUser](authController.loginUser)

  #### For "login_types" google and facebook, username and password are not required

  #### Request

  ```json
  {
    "username": "string",
    "password": "string",
    "login_type": "emailpassword|google|facebook"
  }
  ```

  #### Response

    <details>
    <summary>Show</summary>

  ```json
  {
    "message": "User login successful",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.WBHk",
      "admin_status": true,
      "email": "goku@gmail.com",
      "displayName": "GOKU",
      "emailVerified": false,
      "uid": "f6951b4d-4976-4a0c-986f-61e24f849510",
      "preferences": {
        "theme": true,
        "dashboardHover": false,
        "collapsedSidebar": true
      },
      "mobile_number": "1234567890",
      "signup_type": "registration",
      "signup_type": "registration",
      "admin_status": true,
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
        ]
      },
      "passwordEmptyFlag": false,
      "profile_image": "data:image/jpeg;base64,"
    },
    "recent_lesson_quiz": {
      "mostRecentLesson": {
        "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lesson_id": "4aa08919-369c-4ab4-93db-bf6e41b5b4fc",
        "lesson_name": "Crypto",
        "next_chapter_id": null,
        "prev_chapter_id": null,
        "parent_section_id": null,
        "lesson_start": true,
        "lesson_progress": 1,
        "lesson_completed": true,
        "lesson_completed_date": "8/2/2023, 1:06:58 PM"
      },
      "nextLesson": {
        "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lesson_id": "1aa80733-d0fb-41e8-a975-4d6a7fc95ed6",
        "lesson_name": "Stock Exchanges",
        "next_chapter_id": null,
        "prev_chapter_id": null,
        "parent_section_id": null,
        "lesson_start": false,
        "lesson_progress": 1,
        "lesson_completed": false,
        "lesson_completed_date": ""
      },
      "mostRecentQuiz": {
        "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
        "quiz_id": "b993e24e-2900-453a-8e4e-69ecd55e29e6",
        "quiz_name": "Candle Stick question id test",
        "quiz_completed_date": "12/10/2023, 1:20:11 PM",
        "quiz_score": 2,
        "quiz_completed": true,
        "quiz_total": 3
      },
      "nextQuiz": {
        "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lesson_id": "4aa08919-369c-4ab4-93db-bf6e41b5b4fc",
        "quiz_id": "f4ee6d77-a655-4d12-95a6-7f812b976205",
        "quiz_name": "Crypto Quiz 1",
        "quiz_completed_date": "",
        "quiz_score": "",
        "quiz_completed": false
      }
    },
    "word": {
      "word": "Gas",
      "meaning": "The unit of measure used to calculate the cost of a transaction or computational task on a blockchain network.",
      "url": "https://www.investopedia.com/terms/g/gas-ethereum.asp"
    }
  }
  ```

    </details>

- ### POST /signup

  Endpoint for user signups

  **Kind**: inner property of [<code>route/auth</code>](../README.md#auth-routes)  
   **Path**: <code>POST</code> /auth/signup

  **Body**: <code>string</code> signup_type - Type of signup. Can be registration | google | facebook  
   **Body**: <code>string</code> userName - Username of the user if "signup_type" is registration else leave empty  
   **Body**: <code>string</code> password - Password of the user if "signup_type" is registration else leave empty  
   **Body**: <code>string</code> email - Email of the user if "signup_type" is registration else leave empty  
   **Body**: <code>string</code> mobile_number - Mobile number of the user if "signup_type" is registration else leave empty  
   **Body**: <code>string</code> credential - The google credential from google auth if "signup_type" is google else leave empty  
   **Body**: <code>object</code> userInfo - The facebook user info if "signup_type" is facebook else leave empty

  **Code**: <code>200</code> Account created successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Account created successfully  
   **Response**: <code>boolean</code> registered - True if account was created successfully else false

  **See**: [authController.signupUser](authController.signupUser)

  #### Request

  ```json
  {
    "userName": "string",
    "password": "string",
    "email": "string",
    "mobile_number": "number",
    "signup_type": "registration|google|facebook"
  }
  ```

  #### Response

  ```json
  {
    "message": "Account created successfully",
    "registerd": true
  }
  ```

- ### POST /logout

  Express route for user logout

  **Kind**: inner property of [<code>route/auth</code>](../README.md#auth-routes)  
   **Path**: <code>POST</code> /auth/logout

  **Body**: <code>string</code> uid - User ID

  **Code**: <code>200</code> Logout successful  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - User logout successful

  **See**: [authController.logoutUser](authController.logoutUser)

  #### Request

  ```json
  {
    "uid": "f6951b4d-4976-4a0c-986f-61e24f849510"
  }
  ```

  #### Response

  ```json
  {
    "message": "User logout successful"
  }
  ```

[Go Back](../README.md#auth-routes)
