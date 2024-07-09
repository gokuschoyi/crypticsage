[Go Back](../README.md#user-routes)

## User Route

- ### POST /verifyPassword

  Endpoint to verify the user password before changing it to a new one

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/verify_password

  **Body**: <code>string</code> password - The current password of the user

  **Code**: <code>200</code> Password verified successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Password verified successfully  
   **Response**: <code>string</code> validPassword - True if password is valid else false

  #### Request

  ```json
  {
    "password": "1234567"
  }
  ```

  #### Response

  ```json
  {
    "message": "Password verified successfully",
    "validPassword": true
  }
  ```

- ### POST /updatePassword

  Endpoint to update the user password to a new one

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/update_password

  **Body**: <code>string</code> password - The new password of the user

  **Code**: <code>200</code> Password updated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Password updated successfully  
   **Response**: <code>string</code> status - True if password is valid else false

  #### Request

  ```json
  {
    "password": "1234567"
  }
  ```

  #### Response

  ```json
  {
    "message": "Password updated successfully",
    "status": true
  }
  ```

- ### POST /updateProfilePicture

  Endpoint to update the profile picture to a new one

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/update_profileimage

  **Body**: <code>string</code> profileImage - The base 64 encoded image string

  **Code**: <code>200</code> Profile image updated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Profile image updated successfully  
   **Response**: <code>string</code> status - True if update is successful else false

  #### Request

  ```json
  {
    "profileImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAA"
  }
  ```

  #### Response

  ```json
  {
    "message": "Profile image updated successfully",
    "status": true
  }
  ```

- ### POST /updateUserData

  Endpoint to update the users display name and mobile number

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/update_userdata

  **Body**: <code>Object</code> userData - The user data object. {displayName: string, mobile_number: string}

  **Code**: <code>200</code> User data updated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - User data updated successfully  
   **Response**: <code>string</code> status - True if update is successful else false

  #### Request

  ```json
  {
    "userData": {
      "displayName": "Goku",
      "mobile_number": 1234567890
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "User data updated successfully",
    "status": true
  }
  ```

- ### POST /updatePreferences

  Endpoint to update the users preferences, Sidebar collapsed, Dashboard hover, Theme

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/update_preferences

  **Body**: <code>Object</code> preferences - The preference data object. {theme: boolean, dashboardHover: boolean, collapsedSidebar: boolean}

  **Code**: <code>200</code> User preferences updated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - User preferences updated successfully  
   **Response**: <code>string</code> status - True if update is successful else false

  ```json
  {
    "preferences": {
      "collapsedSidebar": true,
      "dashboardHover": false,
      "theme": false
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "User preferences updated successfully",
    "status": true
  }
  ```

- ### POST /updateUserLessonStatus

  Endpoint to update the users preferences, Sidebar collapsed, Dashboard hover, Theme

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/update_userLessonStatus

  **Body**: <code>Object</code> lesson_status - The lesson status data object. {
  section_id: string,
  lesson_id: string,
  lesson_name: string,
  next_chapter_id: string,
  prev_chapter_id: string,
  parent_section_id: string,
  lesson_start: boolean,
  lesson_progress: integer,
  lesson_completed: boolean,
  lesson_completed_date: string
  }

  **Code**: <code>200</code> User lesson status updated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - User lesson status updated successfully  
   **Response**: <code>string</code> status - True if update is successful else false  
   **Response**: <code>object</code> lessonStatus - The new lesson status object for the current user

  ```json
  {
    "lesson_status": {
      "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
      "lesson_id": "9d83198b-31ae-4717-af55-22bac8422c80",
      "lesson_name": "testting update",
      "next_chapter_id": null,
      "prev_chapter_id": null,
      "parent_section_id": null,
      "lesson_start": false,
      "lesson_progress": 1,
      "lesson_completed": true,
      "lesson_completed_date": ""
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "User lesson status updated successfully",
    "status": true,
    "lessonStatus": {
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
          "lesson_name": "Candle Sticks new testing",
          "next_chapter_id": null,
          "prev_chapter_id": null,
          "parent_section_id": null,
          "lesson_start": true,
          "lesson_progress": 1,
          "lesson_completed": true,
          "lesson_completed_date": "8/2/2023, 12:51:02 PM"
        }
      ],
      "af498b31-f864-47fa-89d5-913d32bedc90": [
        {
          "section_id": "af498b31-f864-47fa-89d5-913d32bedc90",
          "lesson_id": "8ed3daa6-802a-4aa2-87ba-1764e2ce1112",
          "lesson_name": "testing",
          "lesson_start": false,
          "lesson_progress": 1,
          "lesson_complete": false
        }
      ]
    }
  }
  ```

- ### POST /getInitialQuizDataForUser

  Endpoint to get the initial quiz data for the user

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/get_initial_quiz_data_for_user

  **Code**: <code>200</code> Quiz data fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Quiz data fetched successfully  
   **Response**: <code>Array</code> transformedQuizData - The transformed quiz data

  #### Response

  ```json
  {
    "message": "Quiz data fetched successfully",
    "transformedQuizData": [
      {
        "sectionName": "Introduction to the market",
        "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lessons": [
          {
            "lessonName": "Candle Stick",
            "lessonID": "a4d32182-98ba-4968-90c3-aa0c27751d55",
            "allQuizzes": [
              {
                "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
                "sectionName": "Introduction to the market",
                "lessonId": "a4d32182-98ba-4968-90c3-aa0c27751d55",
                "lessonName": "Candle Stick",
                "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
                "quizTitle": "Candle Stick Quiz 1",
                "quizDescription": "Candle Stick Quiz 1",
                "questions": [
                  {
                    "question": "Candle Stick Quiz 1",
                    "options": [
                      {
                        "option": "a"
                      },
                      {
                        "option": "s"
                      },
                      {
                        "option": "d"
                      }
                    ],
                    "correctAnswer": "s",
                    "question_id": "b2a7a4a9-ba94-49d5-bfe7-e1579b60a4ec"
                  },
                  {
                    "question": "What is a candle stick?",
                    "options": [
                      {
                        "option": "q"
                      },
                      {
                        "option": "w"
                      },
                      {
                        "option": "e"
                      }
                    ],
                    "correctAnswer": "q",
                    "question_id": "2a6870fe-c194-4e8f-ac98-482b7afb756e"
                  },
                  {
                    "question": "What is what is what?",
                    "options": [
                      {
                        "option": "what"
                      },
                      {
                        "option": "who"
                      },
                      {
                        "option": "where"
                      }
                    ],
                    "correctAnswer": "what",
                    "question_id": "e0ea9124-8567-40d4-a7a9-97f774b0e7ec"
                  }
                ],
                "quiz_completed": true,
                "quiz_completed_date": "01/05/2024, 4:43:18 pm",
                "quiz_score": 2,
                "quiz_total": 3
              }
            ]
          }
        ]
      }
    ]
  }
  ```

- ### POST /getQuiz

  Endpoint to fetch single quiz data for the user

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/getQuiz

  **Body**: <code>string</code> quizId - The quiz id to fetch

  **Code**: <code>200</code> Quiz fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Quiz fetched successfully  
   **Response**: <code>Array</code> selectedQuiz - The transformed quiz data

  #### Request

  ```json
  {
    "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1"
  }
  ```

  #### Response

  ```json
  {
    "message": "Quiz fetched successfully",
    "selectedQuiz": [
      {
        "_id": "644a0b85c440a2fcc864e7a7",
        "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "sectionName": "Introduction to the market",
        "lessonId": "a4d32182-98ba-4968-90c3-aa0c27751d55",
        "lessonName": "Candle Stick",
        "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
        "quizTitle": "Candle Stick Quiz 1",
        "quizDescription": "Candle Stick Quiz 1",
        "questions": [
          {
            "question": "Candle Stick Quiz 1",
            "options": [
              {
                "option": "a"
              },
              {
                "option": "s"
              },
              {
                "option": "d"
              }
            ],
            "question_id": "b2a7a4a9-ba94-49d5-bfe7-e1579b60a4ec"
          },
          {
            "question": "What is a candle stick?",
            "options": [
              {
                "option": "q"
              },
              {
                "option": "w"
              },
              {
                "option": "e"
              }
            ],
            "question_id": "2a6870fe-c194-4e8f-ac98-482b7afb756e"
          },
          {
            "question": "What is what is what?",
            "options": [
              {
                "option": "what"
              },
              {
                "option": "who"
              },
              {
                "option": "where"
              }
            ],
            "question_id": "e0ea9124-8567-40d4-a7a9-97f774b0e7ec"
          }
        ]
      }
    ]
  }
  ```

- ### POST /submitQuiz

  Endpoint to submit the quiz and calculae the score

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/submitQuiz

  **Body**: <code>string</code> sectionId - The section id.  
   **Body**: <code>string</code> lessonId - The lession id.  
   **Body**: <code>string</code> quizId - The quiz id.  
   **Body**: <code>object</code> quizData - The user selection payload object for the quiz.  
   **Body**: <code>array</code> quizData.userSelections - The user selections for the quiz.

  **Code**: <code>200</code> Quiz submitted successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Quiz submitted successfully  
   **Response**: <code>string</code> status - boolean status of the quiz submission  
   **Response**: <code>Object</code> data - The result object of the quiz submission

  #### Request

  ```json
  {
    "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
    "lessonId": "a4d32182-98ba-4968-90c3-aa0c27751d55",
    "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
    "quizData": {
      "userSelection": [
        {
          "question_id": "e0ea9124-8567-40d4-a7a9-97f774b0e7ec",
          "question": "What is what is what?",
          "selectedOption": "who"
        },
        {
          "question_id": "b2a7a4a9-ba94-49d5-bfe7-e1579b60a4ec",
          "question": "Candle Stick Quiz 1",
          "selectedOption": "s"
        },
        {
          "question_id": "2a6870fe-c194-4e8f-ac98-482b7afb756e",
          "question": "What is a candle stick?",
          "selectedOption": "q"
        }
      ]
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "Quiz submitted successfully",
    "status": true,
    "data": {
      "score": 2,
      "total": 3,
      "quizTitle": "Candle Stick Quiz 1"
    }
  }
  ```

- ### POST /getRecentLessonAndQuiz

  Endpoint to get the recent lesson and quiz status for the user along with next lesson and quiz

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/get_recent_lesson_and_quiz

  **Code**: <code>200</code> Recent lesson and quiz status fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Recent lesson and quiz status fetched successfully  
   **Response**: <code>Object</code> recentLessonQuizStatus - The recent lesson and quiz status object

  #### Response

  ```json
  {
    "message": "Recent lesson and quiz status fetched successfully",
    "recentLessonQuizStatus": {
      "mostRecentLesson": {
        "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lesson_id": "9d83198b-31ae-4717-af55-22bac8422c80",
        "lesson_name": "testting update",
        "next_chapter_id": null,
        "prev_chapter_id": null,
        "parent_section_id": null,
        "lesson_start": false,
        "lesson_progress": 1,
        "lesson_completed": true,
        "lesson_completed_date": "06/05/2024, 3:00:22 pm"
      },
      "nextLesson": {
        "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lesson_id": "f7506aa3-19de-41b3-b481-60665550a1bc",
        "lesson_name": "Stock Exchanges testing",
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
        "quiz_id": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
        "quiz_name": "Candle Stick Quiz 1",
        "quiz_completed_date": "06/05/2024, 3:15:52 pm",
        "quiz_score": 2,
        "quiz_completed": true,
        "quiz_total": 3
      },
      "nextQuiz": {
        "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
        "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
        "quiz_id": "78a33909-abdf-45ef-9024-220eeab59e27",
        "quiz_name": "Candle Stick Quiz 2",
        "quiz_completed_date": "12/10/2023, 1:14:00 PM",
        "quiz_score": 0,
        "quiz_completed": true,
        "quiz_total": 1
      }
    }
  }
  ```

- ### POST /wordOfTheDay

  Endpoint to get the word of the day

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/wordOfTheDay

  **Code**: <code>200</code> Word of the day request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Word of the day request success  
   **Response**: <code>Object</code> word - The word of the day object

- ### POST /uploadLogFiles

  Endpoint to upload log files

  **Kind**: inner property of [<code>route/user</code>](../README.md#user-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /user/upload_log_files

  **Code**: <code>200</code> File uploaded successfully  
   **Code**: <code>400</code> Error response

  **Body**: <code>string</code> uid:(formData) - The uid of the user  
   **Body**: <code>file</code> file:(formData) - The file to upload

  **Response**: <code>string</code> message - File uploaded successfully  
   **Response**: <code>Object</code> finalResult - The final result object

[Go Back](../README.md#user-routes)
