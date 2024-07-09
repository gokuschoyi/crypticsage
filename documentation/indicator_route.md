[Go Back](../README.md#indicator-routes)

## Indicator Route

- ### POST /getTalibDescription

  Endpoint to fetch the talib indicator descriptions for each function.

  **Kind**: inner property of [<code>route/indicators</code>](../README.md#indicator-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /indicators/get_talib_desc

  **Code**: <code>200</code> Talib description fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Talib description fetched successfully  
   **Response**: <code>array</code> desc - Array of talib indicator descriptions by group.

  #### Response

  ```json
  {
    "message": "Talib description fetched successfully",
    "desc": [
      {
        "group_name": "",
        "functions": [
          {
            "name": "ADD",
            "group": "Math Operators",
            "hint": "Vector Arithmetic Add",
            "inputs": [
              {
                "value": "",
                "errorFlag": false,
                "helperText": "",
                "name": "inReal0",
                "type": "real"
              },
              {
                "value": "",
                "errorFlag": false,
                "helperText": "",
                "name": "inReal1",
                "type": "real"
              }
            ],
            "optInputs": [],
            "outputs": [
              {
                "0": "line",
                "name": "outReal",
                "type": "real",
                "flags": {}
              }
            ],
            "splitPane": false,
            "function_selected_flag": false
          }
        ]
      }, ...{}
    ]
  }
  ```

- ### POST /executeTalibFunction

  Endpoint to execute the talib function.

  **Kind**: inner property of [<code>route/indicators</code>](../README.md#indicator-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /indicators/execute_talib_function

  **Body**: <code>object</code> payload - The payload object. { db_query, func_query, func_param_input_keys, func_param_optional_input_keys, func_param_output_keys}  
   **Body**: <code>object</code> payload.func_query - The function query object. { endIdx: number, inReal: string, name: string, optInTimePeriod: number, startIdx: number }  
   **Body**: <code>object</code> payload.func_param_input_keys - The function param input keys.  
   **Body**: <code>object</code> payload.func_param_optional_input_keys - The function param optional input keys.  
   **Body**: <code>object</code> payload.func_param_output_keys - The function param output keys.
  **Body**: <code>object</code> payload.db_query - The db query object. { asset_type: string, ticker_name: string, period: string, fetch_count: number }

  **Code**: <code>200</code> Execute Talib Function request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Execute Talib Function request success  
   **Response**: <code>string</code> info - The talib function info.  
   **Response**: <code>string</code> result - The talib function result.

  #### Request

  ```json
  {
    "func_query": {
      "name": "SMA",
      "startIdx": 0,
      "endIdx": 499,
      "inReal": "close",
      "optInTimePeriod": 30
    },
    "func_param_input_keys": {
      "inReal": "close"
    },
    "func_param_optional_input_keys": {
      "optInTimePeriod": "integer_range"
    },
    "func_param_output_keys": {
      "outReal": "outReal"
    },
    "db_query": {
      "asset_type": "crypto",
      "ticker_name": "BTCUSDT",
      "period": "4h",
      "fetch_count": 500
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "Execute Talib Function request success",
    "info": {
      "diff": 30,
      "func_name": "SMA",
      "output_keys": {
        "outReal": "outReal"
      }
    },
    "result": [
      {
        "key": "outReal",
        "data": [
          {
            "time": 1234567890,
            "value": 23411.33
          }, ...{}
        ]
      }
    ]
  }
  ```

  [Go Back](../README.md#indicator-routes)
