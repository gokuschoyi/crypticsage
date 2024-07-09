[Go Back](../README.md#model-routes)

## Model Route

- ### POST /startModelTraining

  Endpoint start the model training process (LSTM & WGAN).

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/start_model_training

  **Body**: <code>array</code> fTalibExecuteQuery - The array of the talib query to be executed  
   **Body**: <code>object</code> model_training_parameters - The model training parameters

  **Code**: <code>200</code> Model training started  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model training started  
   **Response**: <code>string</code> info - Info message if any  
   **Response**: <code>string</code> jobId - The job id of the model training process  
   **Response**: <code>array</code> finalRs - The final result of the model training process if any

  **See**

  - [fTalibExecuteQuery](FTalibExecuteQueries)
  - [model_training_parameters](ModelTrainingParameters)

  #### Request

  ```json
  {
    "fTalibExecuteQuery": [
      {
        "id": "4335be94-d765-43f6-9edc-f75368d959a9",
        "payload": {
          "func_query": {
            "name": "SMA",
            "startIdx": 0,
            "endIdx": null,
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
            "period": "4h",
            "ticker_name": "BTCUSDT"
          }
        },
        "inputEmpty": false
      }
    ],
    "model_training_parameters": {
      "model_type": "GAN",
      "to_predict": "close",
      "training_size": 95,
      "time_step": 14,
      "look_ahead": 1,
      "epochs": 1,
      "batchSize": 32,
      "transformation_order": [
        {
          "id": "1",
          "name": "OPEN",
          "value": "open",
          "key": "open"
        },
        {
          "id": "2",
          "name": "HIGH",
          "value": "high",
          "key": "high"
        },
        {
          "id": "3",
          "name": "LOW",
          "value": "low",
          "key": "low"
        },
        {
          "id": "4",
          "name": "CLOSE",
          "value": "close",
          "key": "close"
        },
        {
          "id": "5",
          "name": "VOLUME",
          "value": "volume",
          "key": "volume"
        },
        {
          "id": "6",
          "name": "SMA_outReal",
          "value": "SMA_outReal",
          "key": "outReal"
        }
      ],
      "do_validation": false,
      "early_stopping_flag": false,
      "n_critic": 5,
      "slice_index": 1000,
      "d_learning_rate": 0.0004,
      "g_learning_rate": 0.0001,
      "intermediate_result_step": 50,
      "model_save_checkpoint": 50
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "Gan model training started",
    "info": "Historical data not present in redis, fetching the required data",
    "finalRs": [],
    "job_id": "f433f1ad-2087-400a-8635-f2d9cbc98018"
  }
  ```

- ### POST /retrainModel

  Endpoint to retrain a model (WGAN).

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/retrain_model

  **Body**: <code>array</code> fTalibExecuteQuery - The array of the talib query to be executed  
   **Body**: <code>object</code> fullRetrainParams - The model re-training parameters  
   **Body**: <code>object</code> additional_data - The additional data for the model re-training

  **Code**: <code>200</code> Model re-training started  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model re-training started  
   **Response**: <code>string</code> info - Info message if any  
   **Response**: <code>string</code> jobId - The job id of the model training process

  **See**

  - [fTalibExecuteQuery](FTalibExecuteQueries)
  - [fullRetrainParams](ModelTrainingParameters)
  - [additional_data](AdditionalData)

  #### Request

  ```json
  {
    "additional_data": {
      "model_id": "f433f1ad-2087-400a-8635-f2d9cbc98018",
      "checkpoint": "checkpoint_1"
    },
    "fTalibExecuteQuery": [
      {
        "id": "4335be94-d765-43f6-9edc-f75368d959a9",
        "payload": {
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
            "fetch_count": 500,
            "period": "4h",
            "ticker_name": "BTCUSDT"
          }
        },
        "inputEmpty": false
      }
    ],
    "fullRetrainParams": {
      "batchSize": 32,
      "d_learning_rate": 0.0004,
      "do_validation": false,
      "early_stopping_flag": false,
      "epochs": 1,
      "g_learning_rate": 0.0001,
      "intermediate_result_step": 50,
      "look_ahead": 1,
      "model_save_checkpoint": 50,
      "model_type": "GAN",
      "n_critic": 5,
      "slice_index": 1000,
      "time_step": 14,
      "to_predict": "close",
      "training_size": 95,
      "transformation_order": [
        {
          "id": "1",
          "name": "OPEN",
          "value": "open",
          "key": "open"
        },
        {
          "id": "2",
          "name": "HIGH",
          "value": "high",
          "key": "high"
        },
        {
          "id": "3",
          "name": "LOW",
          "value": "low",
          "key": "low"
        },
        {
          "id": "4",
          "name": "CLOSE",
          "value": "close",
          "key": "close"
        },
        {
          "id": "5",
          "name": "VOLUME",
          "value": "volume",
          "key": "volume"
        },
        {
          "id": "6",
          "name": "SMA_outReal",
          "value": "SMA_outReal",
          "key": "outReal"
        }
      ]
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "Model re-training started",
    "info": "Similar training data : Parameters are same, retraining the model...",
    "job_id": "f433f1ad-2087-400a-8635-f2d9cbc98018"
  }
  ```

- ### POST /calculateCoRelationMatrix

  Endpoint to calculate the correlation matrix.

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/get_corelation_matrix

  **Body**: <code>array</code> transformation_order - The order of transformations to apply.  
   **Body**: <code>array</code> fTalibExecuteQuery - The array of the talib query to be executed

  **Code**: <code>200</code> Correlation matrix calculated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Correlation matrix calculated successfully  
   **Response**: <code>array</code> corelation_matrix - The correlation matrix

  **See**

  - [fTalibExecuteQuery](FTalibExecuteQueries)
  - [transformation_order](TransformationOrder)

  #### Request

  ```json
  {
    "transformation_order": [
      {
        "id": "1",
        "name": "OPEN",
        "value": "open",
        "key": "open"
      },
      {
        "id": "2",
        "name": "HIGH",
        "value": "high",
        "key": "high"
      },
      {
        "id": "3",
        "name": "LOW",
        "value": "low",
        "key": "low"
      },
      {
        "id": "4",
        "name": "CLOSE",
        "value": "close",
        "key": "close"
      },
      {
        "id": "5",
        "name": "VOLUME",
        "value": "volume",
        "key": "volume"
      },
      {
        "id": "6",
        "name": "SMA_outReal",
        "value": "SMA_outReal",
        "key": "outReal"
      }
    ],
    "talibExecuteQueries": [
      {
        "id": "4335be94-d765-43f6-9edc-f75368d959a9",
        "payload": {
          "func_query": {
            "name": "SMA",
            "startIdx": 0,
            "endIdx": null,
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
            "period": "4h",
            "ticker_name": "BTCUSDT"
          }
        },
        "inputEmpty": false
      }
    ]
  }
  ```

  #### Response

  ```json
  {
    "message": "Correlation matrix calculated successfully",
    "corelation_matrix": [
      [
        {
          "r": 1,
          "p": null,
          "cov": 308564690.3713164,
          "stat": null
        },
        {
          "r": 0.9998490799997213,
          "p": 0,
          "cov": 311658293.6010004,
          "stat": 6974.043136676275
        },
        {
          "r": 0.9997548797923639,
          "p": 0,
          "cov": 305157373.10248625,
          "stat": 5471.895313134725
        },
        {
          "r": 0.9997115918133567,
          "p": 0,
          "cov": 308521125.1988619,
          "stat": 5044.399125688455
        },
        {
          "r": 0.025521274764731847,
          "p": 0.0019810621111957527,
          "cov": 6949051.590083992,
          "stat": 3.093613347918999
        },
        {
          "r": 0.9977292862380472,
          "p": 0,
          "cov": 306884702.790237,
          "stat": 1795.086554248766
        }
      ], ...[]
    ]
  }
  ```

- ### POST /getModel

  Endpoint to get the model list for a specific user.

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/get_model

  **Code**: <code>200</code> Model fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model fetched successfully  
   **Response**: <code>array</code> model - The model list

  #### Response

  ```json
  {
    "message": "Model fetched successfully",
    "models": [
      {
        "model_created_date": 1703121114469,
        "model_data": {
          "epoch_results": [],
          "latest_forecast_result": {},
          "predicted_result": {},
          "scores": {},
          "talibExecuteQueries": [],
          "train_duration": 116803,
          "training_parameters": {}
        },
        "model_data_available": true,
        "model_id": "0baa26fa-83b5-4acf-a29a-0354ff4fba8f",
        "model_name": "model_BTCUSDT_4h_test",
        "model_type": "LSTM",
        "ticker_name": "BTCUSDT",
        "ticker_period": "4h"
      }, ...{}
    ]
  }
  ```

- ### POST /saveModel

  Endpoint to save the model.

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/save_model

  **Body**: <code>object</code> payload - The model save payload

  **Code**: <code>200</code> Model saved successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model saved successfully  
   **Response**: <code>boolean</code> model_save_status - The model save status  
   **Response**: <code>object</code> modelSaveResult - The model save result  
   **Response**: <code>string</code> user_id - The user id

  **See**: [payload](SavePayload)

  #### Request

  ```json
  {
    "payload": {
      "model_type": "WGAN-GP",
      "model_id": "8084b148-2db8-413e-93c2-a5d2d9922227",
      "model_name": "test_delete_later",
      "ticker_name": "BTCUSDT",
      "ticker_period": "4h",
      "epoch_results": [
        {
          "memory": 311.6640625,
          "losses": {
            "discriminator_loss": 9.888739585876465,
            "generator_loss": 0.800829291343689
          },
          "training_metrics": {
            "mse": 0.3917079567909241,
            "sign": 1.1982758045196533,
            "rmse": 0.5981736779212952,
            "mae": 0.5933108329772949,
            "mape": 100.0655288696289
          },
          "epoch": 1
        }
      ],
      "train_duration": 4902,
      "correlation_data": null,
      "training_parameters": {
        "to_train_count": 1000,
        "trainingDatasetSize": 95,
        "timeStep": 14,
        "lookAhead": 1,
        "epoch": 1,
        "hiddenLayer": 1,
        "multiSelectValue": "close",
        "modelType": "WGAN-GP",
        "intermediateResultStep": "50",
        "modelSaveStep": "50",
        "batchSize": 32,
        "transformation_order": [
          {
            "id": "1",
            "name": "OPEN",
            "value": "open",
            "key": "open"
          },
          {
            "id": "2",
            "name": "HIGH",
            "value": "high",
            "key": "high"
          },
          {
            "id": "3",
            "name": "LOW",
            "value": "low",
            "key": "low"
          },
          {
            "id": "4",
            "name": "CLOSE",
            "value": "close",
            "key": "close"
          },
          {
            "id": "5",
            "name": "VOLUME",
            "value": "volume",
            "key": "volume"
          },
          {
            "id": "6",
            "name": "SMA_outReal",
            "value": "SMA_outReal",
            "key": "outReal"
          }
        ],
        "doValidation": false,
        "earlyStopping": false,
        "learningRate": 50,
        "scaledLearningRate": 0.001,
        "d_learningRate": 40,
        "g_learningRate": 10,
        "scaled_d_learningRate": 0.0004,
        "scaled_g_learningRate": 0.0001,
        "discriminator_iteration": 5
      },
      "talibExecuteQueries": [
        {
          "id": "c0121eaf-3b43-4a68-8bda-c55de6948d77",
          "payload": {
            "func_query": {
              "name": "SMA",
              "startIdx": 0,
              "endIdx": null,
              "inReal": "open",
              "optInTimePeriod": 30
            },
            "func_param_input_keys": {
              "inReal": "open"
            },
            "func_param_optional_input_keys": {
              "optInTimePeriod": "integer_range"
            },
            "func_param_output_keys": {
              "outReal": "outReal"
            },
            "db_query": {
              "asset_type": "crypto",
              "period": "4h",
              "ticker_name": "BTCUSDT"
            }
          },
          "inputEmpty": false
        }
      ],
      "wgan_final_forecast": {
        "predictions": [
          {
            "0": "54594.4",
            "date": "05/06/2024, 10:00:00 AM",
            "actual": "63866.59000000"
          },
          {
            "0": "54595.03",
            "date": "05/06/2024, 02:00:00 PM",
            "actual": "null"
          }
        ],
        "rmse": {
          "period_1": "6850.255859375"
        }
      }
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "Model saved successfully",
    "model_save_status": true,
    "modelSaveResult": {
      "acknowledged": true,
      "insertedId": "663877bcaec20a5eb1e62239"
    },
    "user_id": "f6951b4d-4976-4a0c-986f-61e24f849510"
  }
  ```

- ### POST /deleteModel

  Endpoint to delete the model from local directory and redis if not being saved.

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/delete_model

  **Body**: <code>string</code> model_id - The ID of the model  
   **Body**: <code>string</code> model_type - The type of the model  
   **Body**: <code>string</code> asset_type - The asset type  
   **Body**: <code>string</code> ticker_name - The ticker name  
   **Body**: <code>string</code> period - The period

  **Code**: <code>200</code> Model deleted successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model deleted successfully

  #### Request

  ```json
  {
    "model_id": "dd8cc76f-cd9c-4c16-9516-dcdcb9e11abd",
    "model_type": "WGAN-GP",
    "asset_type": "crypto",
    "ticker_name": "BTCUSDT",
    "period": "4h"
  }
  ```

  #### Response

  ```json
  {
    "message": "Model deleted successfully"
  }
  ```

- ### POST /deleteUserModel

  Endpoint to delete the user model from local storage as well as DB.

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/delete_user_model

  **Body**: <code>string</code> model_id - The ID of the model  
   **Body**: <code>string</code> model_type - The type of the model

  **Code**: <code>200</code> Model deleted successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model deleted successfully

  #### Request

  ```json
  {
    "model_id": "8084b148-2db8-413e-93c2-a5d2d9922227",
    "model_type": "WGAN-GP"
  }
  ```

  #### Response

  ```json
  {
    "message": "Model deleted successfully"
  }
  ```

- ### POST /updateNewPredictions

  Endpoint to update the training results of WGAN model.

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/update_new_predictions

  **Body**: <code>object</code> payload - The model update payload

  **Code**: <code>200</code> Model updated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model updated successfully

  **See**: [payload](UpdatePredictionPayload)

  #### Request

  ```json
  {
    "model_created_date": 1714977151193,
    "model_id": "1daee071-c98d-4d8f-a088-3760bab1fb63",
    "epoch_results": [
      {
        "memory": 316.98828125,
        "losses": {
          "discriminator_loss": 9.799975395202637,
          "generator_loss": 0.487595796585083
        },
        "training_metrics": {
          "mse": 0.3912005126476288,
          "sign": 0.5775862336158752,
          "rmse": 0.5976291298866272,
          "mae": 0.5927653908729553,
          "mape": 99.84664916992188
        },
        "epoch": 2
      }
    ],
    "train_duration": 5680,
    "training_parameters": {
      "to_train_count": 1000,
      "trainingDatasetSize": 95,
      "timeStep": 14,
      "lookAhead": 1,
      "epoch": 1,
      "hiddenLayer": 1,
      "multiSelectValue": "close",
      "modelType": "WGAN-GP",
      "intermediateResultStep": "50",
      "modelSaveStep": "50",
      "batchSize": 32,
      "transformation_order": [
        {
          "id": "1",
          "name": "OPEN",
          "value": "open",
          "key": "open"
        },
        {
          "id": "2",
          "name": "HIGH",
          "value": "high",
          "key": "high"
        },
        {
          "id": "3",
          "name": "LOW",
          "value": "low",
          "key": "low"
        },
        {
          "id": "4",
          "name": "CLOSE",
          "value": "close",
          "key": "close"
        },
        {
          "id": "5",
          "name": "VOLUME",
          "value": "volume",
          "key": "volume"
        },
        {
          "id": "6",
          "name": "SMA_outReal",
          "value": "SMA_outReal",
          "key": "outReal"
        }
      ],
      "doValidation": false,
      "earlyStopping": false,
      "learningRate": 50,
      "scaledLearningRate": 0.001,
      "d_learningRate": 40,
      "g_learningRate": 10,
      "scaled_d_learningRate": 0.0004,
      "scaled_g_learningRate": 0.0001,
      "discriminator_iteration": 5
    },
    "wgan_final_forecast": {
      "predictions": [
        {
          "0": "54528.242",
          "date": "05/06/2024, 10:00:00 AM",
          "actual": "63866.59000000"
        },
        {
          "0": "54528.19",
          "date": "05/06/2024, 02:00:00 PM",
          "actual": "null"
        }
      ],
      "rmse": {
        "period_1": "6898.4013671875"
      }
    },
    "wgan_intermediate_forecast": []
  }
  ```

  #### Response

  ```json
  {
    "message": "Model updated successfully",
    "wgan_new_prediction_update": {
      "acknowledged": true,
      "modifiedCount": 1,
      "upsertedId": null,
      "upsertedCount": 0,
      "matchedCount": 1
    },
    "user_id": "f6951b4d-4976-4a0c-986f-61e24f849510"
  }
  ```

- ### POST /renameModel

  Endpoint to rename the model name

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/rename_model

  **Body**: <code>string</code> model_id - The ID of the model  
   **Body**: <code>string</code> model_name - The name of the model

  **Code**: <code>200</code> Model renamed successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model renamed successfully

  #### Request

  ```json
  {
    "model_id": "1daee071-c98d-4d8f-a088-3760bab1fb63",
    "model_name": "test_delete_later"
  }
  ```

  #### Response

  ```json
  {
    "message": "Model renamed successfully",
    "status": true
  }
  ```

- ### GET /getModelCheckpoints

  Endpoint to get the model checkpoints.

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>GET</code> /model/get_model_checkpoints?model_id=

  **Params**: <code>string</code> model_id - The ID of the model

  **Code**: <code>200</code> Model checkpoints fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Model checkpoints fetched successfully  
  **Response**: <code>string</code> checkpoints - Array of available saved checkpoints for the model

  #### Query param

  ```json
    "model_id": "1daee071-c98d-4d8f-a088-3760bab1fb63"
  ```

  #### Response

  ```json
  {
    "message": "Model checkpoints fetched successfully",
    "checkpoints": ["checkpoint_1", "checkpoint_2"]
  }
  ```

- ### POST /makeNewForecast

  Endpoint to make a new LSTM Forecast

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/make_new_prediction

  **Body**: <code>object</code> payload - The model forecast payload  
   **Code**: <code>200</code> LSTM Model forecast completed  
   **Code**: <code>400</code> LSTM Model forecasting failed

  **Response**: <code>string</code> message - LSTM Model forcast completed  
   **Response**: <code>boolean</code> status - The status of the forecast  
   **Response**: <code>array</code> result - The forecast result  
   **Response**: <code>string</code> error - The error message if any

  **See**: [payload](LSTMForecastPayload)

  #### Request

  ```json
  {
    "payload": {
      "training_parameters": {
        "trainingDatasetSize": 95,
        "timeStep": 14,
        "lookAhead": 7,
        "epoch": 1,
        "hiddenLayer": 1,
        "multiSelectValue": "close",
        "modelType": "Multi Step Single Output",
        "batchSize": 32,
        "transformation_order": [
          {
            "id": "1",
            "name": "OPEN",
            "value": "open"
          },
          {
            "id": "2",
            "name": "HIGH",
            "value": "high"
          },
          {
            "id": "3",
            "name": "LOW",
            "value": "low"
          },
          {
            "id": "4",
            "name": "CLOSE",
            "value": "close"
          },
          {
            "id": "5",
            "name": "VOLUME",
            "value": "volume"
          },
          {
            "id": "6",
            "name": "BBANDS_outRealUpperBand",
            "value": "BBANDS_outRealUpperBand"
          },
          {
            "id": "7",
            "name": "BBANDS_outRealMiddleBand",
            "value": "BBANDS_outRealMiddleBand"
          },
          {
            "id": "8",
            "name": "BBANDS_outRealLowerBand",
            "value": "BBANDS_outRealLowerBand"
          }
        ],
        "doValidation": true,
        "earlyStopping": false,
        "learningRate": 50,
        "scaledLearningRate": 0.01
      },
      "talibExecuteQueries": [
        {
          "id": "56dd9c3a-80c2-4f2d-954c-12df1f04c153",
          "payload": {
            "func_query": {
              "name": "BBANDS",
              "startIdx": 0,
              "endIdx": 499,
              "inReal": "close",
              "optInTimePeriod": "14",
              "optInNbDevUp": 2,
              "optInNbDevDn": 2,
              "optInMAType": 0
            },
            "func_param_input_keys": {
              "inReal": "close"
            },
            "func_param_optional_input_keys": {
              "optInTimePeriod": "integer_range",
              "optInNbDevUp": "real_range",
              "optInNbDevDn": "real_range",
              "optInMAType": "integer_list"
            },
            "func_param_output_keys": {
              "outRealUpperBand": "outRealUpperBand",
              "outRealMiddleBand": "outRealMiddleBand",
              "outRealLowerBand": "outRealLowerBand"
            },
            "db_query": {
              "asset_type": "crypto",
              "fetch_count": 500,
              "period": "4h",
              "ticker_name": "BTCUSDT"
            }
          },
          "inputEmpty": false
        }
      ],
      "model_id": "11576913-869a-48c1-b632-d0d865f1f308",
      "model_first_prediction_date": 1703534400000,
      "model_train_period": "4h",
      "mean_array": [
        20206.255859375, 20423.970703125, 19970.064453125, 20207.986328125,
        12595.33203125, 20975.7421875, 20196.736328125, 19417.716796875
      ],
      "variance_array": [
        255144928, 260831488, 249071952, 255127536, 260890240, 275951232,
        254866944, 235475024
      ]
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "LSTM Model forecast completed",
    "error": "",
    "result": [
      {
        "0": "63291.32",
        "1": "63291.32",
        "2": "63291.32",
        "3": "63291.32",
        "4": "63291.32",
        "5": "63291.32",
        "6": "62004.36",
        "date": "05/07/2024, 10:00:00 AM",
        "actual": "null"
      }, ...{}
    ]
  }
  ```

- ### POST /makeWganForecast

  Endpoint to make a new WGAN Forecast

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/make_wgan_prediction

  **Body**: <code>object</code> payload - The model forecast payload

  **Code**: <code>200</code> WGAN Model forecast completed  
   **Code**: <code>400</code> WGAN Model forecasting failed

  **Response**: <code>string</code> message - WGAN Model forcast completed  
   **Response**: <code>boolean</code> status - The status of the forecast  
   **Response**: <code>array</code> result - The forecast result  
   **Response**: <code>string</code> error - The error message if any

  **See**: [payload](WGANForecastPayload)

  #### Request

  ```json
  {
    "payload": {
      "training_parameters": {
        "to_train_count": 1000,
        "trainingDatasetSize": 95,
        "timeStep": 14,
        "lookAhead": 1,
        "epoch": 1,
        "hiddenLayer": 1,
        "multiSelectValue": "close",
        "modelType": "WGAN-GP",
        "intermediateResultStep": "50",
        "modelSaveStep": "50",
        "batchSize": 32,
        "transformation_order": [
          {
            "id": "1",
            "name": "OPEN",
            "value": "open"
          },
          {
            "id": "2",
            "name": "HIGH",
            "value": "high"
          },
          {
            "id": "3",
            "name": "LOW",
            "value": "low"
          },
          {
            "id": "4",
            "name": "CLOSE",
            "value": "close"
          },
          {
            "id": "5",
            "name": "VOLUME",
            "value": "volume"
          },
          {
            "id": "6",
            "name": "SMA_outReal",
            "value": "SMA_outReal",
            "key": "outReal"
          }
        ],
        "doValidation": false,
        "earlyStopping": false,
        "learningRate": 50,
        "scaledLearningRate": 0.001,
        "d_learningRate": 40,
        "g_learningRate": 10,
        "scaled_d_learningRate": 0.0004,
        "scaled_g_learningRate": 0.0001,
        "discriminator_iteration": 5
      },
      "talibExecuteQueries": [
        {
          "id": "3fbd49b1-10b1-4c13-b004-d1fc565722d2",
          "payload": {
            "func_query": {
              "name": "SMA",
              "startIdx": 0,
              "endIdx": null,
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
              "period": "4h",
              "ticker_name": "BTCUSDT"
            }
          },
          "inputEmpty": false
        }
      ],
      "model_id": "e57c3318-a643-491f-bc25-496616560418",
      "model_first_prediction_date": 1711396800000,
      "model_train_period": "4h"
    }
  }
  ```

  #### Response

  ```json
    {
    "message": "WGAN Model forecast completed",
    "error": "",
    "result": [
      {
        "0": "50071.195",
        "date": "05/06/2024, 10:00:00 AM",
        "actual": "63866.59000000"
    }, ...{}
    ]
  }
  ```

- ### POST /getPartialAutoCorrelation

  Endpoint to generate the ACF/PACF plot values

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/get_partial_auto_correlation

  **Body**: <code>string</code> asset_type - The asset type  
   **Body**: <code>string</code> ticker_name - The ticker name  
   **Body**: <code>string</code> period - The period  
   **Body**: <code>number</code> maxKag - The maximum lag  
   **Body**: <code>string</code> seriesName - The series name  
   **Body**: <code>number</code> confidenceLevel - The confidence level

  **Code**: <code>200</code> Partial Autocorrelation calculated successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Partial Autocorrelation calculated successfully  
   **Response**: <code>array</code> pacf_final - The partial autocorrelation values

  #### Request

  ```json
  {
    "asset_type": "crypto",
    "ticker_name": "BTCUSDT",
    "period": "4h",
    "maxLag": 20,
    "seriesName": "open",
    "confidenceLevel": 0.95
  }
  ```

  #### Response

  ```json
  {
    "message": "Partial Autocorrelation calculated successfully",
    "pacf_final": [
      {
        "lag": 0,
        "acf": 1,
        "pacf": 1,
        "lower_bound": 0,
        "upper_bound": 0
      },
      {
        "lag": 1,
        "acf": 0.999486811134762,
        "pacf": 0.999486811134762,
        "lower_bound": -0.016157565983096922,
        "upper_bound": 0.016157565983096922
      }, ...{}
    ]
  }
  ```

- ### POST /quickForecasting

  Endpoint to forecast the data using Chronos/Prophet models

  **Kind**: inner property of [<code>route/model</code>](../README.md#model-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /model/quick_forecasting

  **Body**: <code>string</code> module - The module name  
   **Body**: <code>string</code> symbol - The symbol name  
   **Body**: <code>string</code> period - The period  
   **Body**: <code>object</code> model_data - The data object for forecasting

  **Code**: <code>200</code> Quick forecasting completed  
   **Code**: <code>400</code> Quick forecasting failed

  **Response**: <code>string</code> message - Quick forecasting completed  
   **Response**: <code>array</code> forecast - The forecast result

  **See**: [model_data](QFData)

  #### Request

  ```json
  {
    "module": "crypto",
    "symbol": "BTCUSDT",
    "period": "4h",
    "model_data": {
      "forecasting_model": "chronos",
      "forecasting_model_type": "tiny",
      "parameters": {
        "to_predict_flag": "close",
        "look_ahead": 12,
        "samples": 10,
        "top_k": 50,
        "temperature": 1,
        "top_p": 1,
        "scaled_temperature": 1,
        "scaled_top_p": 1
      }
    }
  }
  ```

  #### Response

  ```json
  {
    "message": "Quick forecasting completed",
    "forecast": [
      {
        "date": "08/05/2024, 6:00:00 am",
        "openTime": 1715112000000,
        "low": 62988.64792457062,
        "close": 64146.526374519824,
        "high": 65397.035100464964
      },
      {
        "date": "08/05/2024, 10:00:00 am",
        "openTime": 1715126400000,
        "low": 62942.33278657265,
        "close": 64378.102064509665,
        "high": 65813.87134244667
      }
    ]
  }
  ```

[Go Back](../README.md#model-routes)
