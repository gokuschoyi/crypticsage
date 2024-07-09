/**
 * @typedef {Object} User
 * @property {string} displayName - The user's display name.
 * @property {string} email - The user's email address.
 * @property {string} password - The user's password.
 * @property {string} mobile_number - The user's mobile number.
 * @property {string} profile_image - The URL of the user's profile image.
 * @property {boolean} emailVerified - Indicates whether the user's email is verified.
 * @property {string} date - The user's registration date in the format 'MM/DD/YYYY, HH:mm:ss AM/PM'.
 * @property {string} uid - The user's unique identifier.
 * @property {Object} preferences - User preferences object.
 * @property {boolean} preferences.theme - User's theme preference.
 * @property {boolean} preferences.dashboardHover - User's dashboard hover preference.
 * @property {boolean} preferences.collapsedSidebar - User's collapsed sidebar preference.
 * @property {string} signup_type - The type of signup method (e.g., 'facebook').
 * @property {Object} lesson_status - User's lesson status data.
 * @property {Object} quiz_status - User's quiz status data.
 */

/**
 * @typedef {object} UserLoginPayload
 * @property {string} accessToken Access token of the user
 * @property {boolean} admin_status Admin status of the user
 * @property {string} email Email of the user
 * @property {string} displayName Name of the user
 * @property {boolean} emailVerified Email verification status of the user
 * @property {string} uid Unique ID of the user
 * @property {object} preferences User preferences
 * @property {string} mobile_number Mobile number of the user
 * @property {string} signup_type Signup type of the user
 * @property {object} lesson_status Lesson status of the user
 * @property {boolean} passwordEmptyFlag Password empty flag of the user
 * @property {string} profile_image Profile image of the user
 * 
 */

/**
 * @typedef {object} RecentLessonQuiz
 * @property {object} mostRecentLesson Most recent lesson
 * @property {object} mostRecentQuiz Most recent quiz
 */

/**
 * @typedef {object} UserNamePasswordSignup
 * @property {string} signup_type Signup type of the user
 * @property {string} userName Username of the user
 * @property {string} password Password of the user
 * @property {string} email Email of the user
 * @property {string} mobile_number Mobile number of the user
 */

/**
 * @typedef {object} GoogleSignup
 * @property {string} signup_type Signup type of the user
 * @property {string} credential Google credential
 */

/**
 * @typedef {object} FacebookSignup
 * @property {string} signup_type Signup type of the user
 * @property {object} userInfo Facebook user info
 */

/**
 * @typedef {object} Word
 * @property {string} word - The word of the day
 * @property {string} meaning - The meaning of the word
 * @property {string} url - The URL of the word
 */

/**
 * @typedef {Object} Quiz
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {string} lessonId
 * @property {string} lessonName
 * @property {string} quizId
 * @property {string} quizTitle
 * @property {boolean} quizDescription
 * @property {array} questions
 * @property {boolean} [quiz_completed]
 * @property {string} [quiz_completed_date]
 * @property {number} [quiz_score]
 * @property {number} [quiz_total]
 */

/**
 * @typedef {Object} Lesson
 * @property {string} lessonID
 * @property {string} lessonName
 * @property {Quiz[]} allQuizzes
 */

/**
 * @typedef {Object} Section
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {Lesson[]} lessons
 */

/**
 * @typedef {Object} OutputObject
 * @property {Section[]} quizzes
 */

/**
 * @typedef {Object} LessonStatus
 * @property {string} section_id - The section id.
 * @property {string} lesson_id - The lesson id.
 * @property {string} lesson_name - The lesson name.
 * @property {string|null} next_chapter_id - The next chapter id.
 * @property {string|null} prev_chapter_id - The previous chapter id.
 * @property {string|null} parent_section_id - The parent section id.
 * @property {boolean} lesson_start - The lesson start status.
 * @property {number} lesson_progress - The lesson progress.
 * @property {boolean} lesson_completed - The lesson completion status.
 * @property {string} lesson_completed_date - The lesson completion date.
 */

/**
 * @typedef {Object} TalibExecuteQuery
 * @property {string} id - The ID of the function data.
 * @property {boolean} inputEmpty - Indicates if the input is empty.
 * @property {Object} payload - The payload containing function query, parameter input keys, optional input keys, output keys, and database query.
 * @property {Object} payload.func_query - The function query.
 * @property {string} payload.func_query.name - The name of the function.
 * @property {number} payload.func_query.startIdx - The start index.
 * @property {?number} payload.func_query.endIdx - The end index.
 * @property {string} payload.func_query.inReal - The input real value.
 * @property {number} payload.func_query.optInTimePeriod - The optional input time period.
 * @property {Object} payload.db_query - The database query.
 * @property {string} payload.db_query.asset_type - The asset type.
 * @property {string} payload.db_query.period - The period.
 * @property {string} payload.db_query.ticker_name - The ticker name.
 * @property {Object} payload.func_param_input_keys - The function parameter input keys.
 * @property {Object} payload.func_param_optional_input_keys - The function parameter optional input keys.
 * @property {Object} payload.func_param_output_keys - The function parameter output keys.
 * @see [startModelTraining]{@link module:route/model~/startModelTraining}
 */

/**
 * @typedef {TalibExecuteQuery[]} FTalibExecuteQueries
 * @see [startModelTraining]{@link module:route/model~/startModelTraining}
 */

/**
 * @typedef {Object} TransformationOrderProperty
 * @property {string} id - The ID of the transformation.
 * @property {string} name - The name of the transformation.
 * @property {string} value - The value of the transformation.
 * @property {string} key - The key of the transformation.
 */

/**
 * @typedef {TransformationOrderProperty[]} TransformationOrder
 * @see [model_training_parameters]{@link ModelTrainingParameters}
 * @see [get_corelation_matrix]{@link module:route/model~/calculateCoRelationMatrix}
 */

/**
 * @typedef {Object} ModelTrainingParameters
 * @property {string} model_type - The type of the model.
 * @property {string} to_predict - The attribute to predict.
 * @property {number} training_size - The size of the training data in percentage.
 * @property {number} time_step - The time step.
 * @property {number} look_ahead - The number of steps to look ahead.
 * @property {number} epochs - The number of epochs for training.
 * @property {number} batchSize - The batch size for training.
 * @property {TransformationOrder} transformation_order - The order of transformations to apply.
 * @property {boolean} do_validation - Indicates whether to perform validation during training.
 * @property {boolean} early_stopping_flag - Indicates whether early stopping is enabled.
 * @property {number} n_critic - The number of critic updates per generator update.
 * @property {number} slice_index - The index to slice the data for training.
 * @property {number} d_learning_rate - The learning rate for the discriminator.
 * @property {number} g_learning_rate - The learning rate for the generator.
 * @property {number} intermediate_result_step - The step interval for saving intermediate results.
 * @property {number} model_save_checkpoint - The checkpoint interval for saving the model.
 * @see [startModelTraining]{@link module:route/model~/startModelTraining}
 * @see [retrainModel]{@link module:route/model~/retrainModel}
 */


/**
 * @typedef {Object} AdditionalData
 * @property {string} model_id - The ID of the model.
 * @property {string} checkpoint - The checkpoint of the model to load.
 * @see [retrainModel]{@link module:route/model~/retrainModel}
 */ 

/**
 * @typedef {Object} SavePayload
 * @property {string} save_type - The type of the save.
 * @property {Object} to_save - The object to save.
 * @property {string} model_type - The type of the model.
 */

// /**
//  * @typedef {Object} SavePayload
//  * @property {string} model_id - The ID of the model.
//  * @property {string} model_name - The name of the model.
//  * @property {string} model_type - The type of the model.
//  * @property {string} ticker_name - The ticker name.
//  * @property {string} ticker_type - The ticker type.
//  * @property {number} train_duration - The training duration.
//  * @property {array} correlation_data - The correlation matrix data.
//  * @property {FTalibExecuteQueries} talibExecuteQueries - The array of the talib query to be executed.
//  * @property {ModelTrainingParameters} modelTrainingParameters - The model training parameters.
//  * @property {Object} wgan_final_forecast - The final forecast of the WGAN model.
//  * @property {array} epoch_results - The results of each epoch.
//  * @see [saveModel]{@link module:route/model~/saveModel}
//  */

/**
 * @typedef {Object} UpdatePredictionPayload
 * @property {string} model_created_date - The date the model was created.
 * @property {string} model_id - The ID of the model.
 * @property {array} epoch_results - The results of each epoch.
 * @property {number} train_duration - The training duration.
 * @property {ModelTrainingParameters} training_parameters - The model training parameters.
 * @property {array} wgan_intermediate_forecast - The intermediate forecast of the WGAN model.
 * @property {array} wgan_final_forecast - The final forecast of the WGAN model.
 * @see [updateNewPredictions]{@link module:route/model~/updateNewPredictions}
 */


/**
 * @typedef {Object} LSTMForecastPayload
 * @property {ModelTrainingParameters} training_parameters - The model training parameters.
 * @property {FTalibExecuteQueries} talibExecuteQueries - The array of the talib query to be executed.
 * @property {string} model_id - The ID of the model.
 * @property {number} model_first_prediction_date - The first prediction date of the model.
 * @property {number} model_train_period - The training period of the model.
 * @property {array} mean_array - The mean array.
 * @property {array} variance_array - The variance array.
 * @see [makeNewForecast]{@link module:route/model~/makeNewForecast}
*/

/**
 * @typedef {Object} WGANForecastPayload
 * @property {ModelTrainingParameters} training_parameters - The model training parameters.
 * @property {FTalibExecuteQueries} talibExecuteQueries - The array of the talib query to be executed.
 * @property {string} model_id - The ID of the model.
 * @property {number} model_first_prediction_date - The first prediction date of the model.
 * @property {number} model_train_period - The training period of the model.
 * @see [makeWganForecast]{@link module:route/model~/makeWganForecast}
 */

/**
 * @typedef {Object} QFData
 * @property {string} forecasting_model - The forecasting model.
 * @property {string} forecasting_model_type - The forecasting model type.
 * @property {Object} parameters - The parameters of the forecasting model.
 * @property {number} parameters.look_ahead - The look ahead parameter.
 * @property {number} parameters.samples - The samples parameter.
 * @property {number} parameters.scaled_temperature - The scaled temperature parameter.
 * @property {number} parameters.scaled_top_p - The scaled top p parameter.
 * @property {number} parameters.temperature - The temperature parameter.
 * @property {string} parameters.to_predict_flag - The to predict flag parameter.
 * @property {number} parameters.top_p - The top p parameter.
 * @property {number} parameters.top_k - The top k parameter.
 * @see [quickForecasting]{@link module:route/model~/quickForecasting}
 */

exports.definitions = {};