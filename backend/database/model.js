const { connectToDatabase } = require('../services/db-conn');

const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))

const fs = require('fs');

const saveUserModel = async (modelData) => {
    const client = await connectToDatabase();
    const db = client.db('crypticsage');
    const model_collection = db.collection('models');
    try {
        const existing_model = await model_collection.findOne({ model_id: modelData.model_id });

        if (existing_model) {
            return [false, 'Model already exists'];
        } else {
            const result = await model_collection.insertOne(modelData);
            return [true, 'Model data saved'];
        }
    } catch (error) {
        log.error(error.stack);
        throw error;
    }
}

const saveSessionData = async (sessionData) => {
    const client = await connectToDatabase();
    const db = client.db('crypticsage');
    const session_collection = db.collection('model_sessions');
    try {
        const result = await session_collection.insertMany(sessionData);
        if (result.acknowledged) {
            return [true, 'Session data saved'];
        } else {
            return [false, 'Session data not saved'];
        }
    } catch (error) {
        log.error(error.stack);
        throw error;
    }
}

const getAdditionaSessionData = async (uid) => {
    try {
        const client = await connectToDatabase();
        const db = client.db('crypticsage');
        const model_collection = db.collection('models');

        const match = {
            $match: {
                user_id: uid,
                model_type: 'WGAN-GP'
            }
        }

        const lookup = {
            $lookup: {
                from: "model_sessions",
                let: { modelId: "$model_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: ["$model_id", "$$modelId"],
                                    },
                                    { $gt: ["$session", 1] },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            model_data: 1,
                            checkpoints: 1,
                            selectedCheckpoint: 1,
                            session: 1
                        },
                    },
                ],
                as: "runDetails",
            }
        }

        const addFields = [
            {
                $addFields: {
                    additional_training_run_results: {
                        $map: {
                            input: "$runDetails",
                            as: "run",
                            in: {
                                $mergeObjects: [
                                    "$$run.model_data",
                                    {
                                        checkpoints: "$$run.checkpoints",
                                        selectedCheckpoint:
                                            "$$run.selectedCheckpoint",
                                        session: "$$run.session",
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    additional_training_run_results: {
                        $map: {
                            input:
                                "$additional_training_run_results",
                            as: "result",
                            in: {
                                $mergeObjects: [
                                    { latest_forecast_result: {} },
                                    "$$result",
                                    {
                                        wgan_final_forecast: {
                                            predictions: {
                                                $slice: [
                                                    "$$result.wgan_final_forecast.predictions",
                                                    {
                                                        $multiply: [
                                                            "$$result.training_parameters.lookAhead",
                                                            -1,
                                                        ],
                                                    },
                                                ],
                                            },
                                            rmse: "$$result.wgan_final_forecast.rmse",
                                        },
                                        epoch_results: {
                                            $slice: [
                                                "$$result.epoch_results",
                                                -1,
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            }
        ]

        const project = {
            $project: {
                _id: 0,
                model_id: 1,
                additional_training_run_results: 1,
            }
        }

        const pipeline = [
            match,
            lookup,
            ...addFields,
            project
        ]

        const additionalSessionData = await model_collection.aggregate(pipeline).toArray();
        return additionalSessionData.filter((model) => model.additional_training_run_results.length > 0);
    } catch (error) {
        log.error(error.stack);
        throw error;
    }
}

const fetchUserModels = async (user_id) => {
    try {
        const client = await connectToDatabase();
        const db = client.db('crypticsage');
        const model_collection = db.collection('models');

        const match = {
            $match: {
                user_id: user_id
            }
        }

        const lookup = {
            $lookup: {
                from: "model_sessions",
                let: {
                    modelId: "$model_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: ["$model_id", "$$modelId"],
                                    },
                                    {
                                        $eq: ["$session", 1],
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: "runDetails",
            }
        }

        const project = {
            $project: {
                _id: 0,
                model_id: 1,
                model_name: 1,
                model_type: 1,
                model_created_date: 1,
                ticker_name: 1,
                ticker_period: 1,
                model_data: {
                    $cond: {
                        if: {
                            $eq: ["$model_type", "LSTM"],
                        },
                        then: {
                            $mergeObjects: [
                                "$model_data",
                                {
                                    predicted_result: {
                                        $mergeObjects: [
                                            "$model_data.predicted_result",
                                            {
                                                predictions_array: {
                                                    $slice: [
                                                        "$model_data.predicted_result.predictions_array",
                                                        {
                                                            $multiply: [
                                                                "$model_data.training_parameters.lookAhead",
                                                                -1,
                                                            ],
                                                        },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                        else: "$model_data",
                    },
                },
            }
        }

        const add_fields = [
            {
                $addFields: {
                    runDetails: {
                        $arrayElemAt: ["$runDetails", 0],
                    },
                },
            },
            {
                $addFields: {
                    model_data: "$runDetails.model_data",
                },
            },
            {
                $addFields: {
                    "model_data.wgan_final_forecast.predictions":
                    {
                        $cond: {
                            if: {
                                $eq: ["$model_type", "WGAN-GP"],
                            },
                            then: {
                                $slice: [
                                    "$model_data.wgan_final_forecast.predictions",
                                    {
                                        $multiply: [
                                            "$model_data.training_parameters.lookAhead",
                                            -1,
                                        ],
                                    },
                                ],
                            },
                            else: "$$REMOVE", // This will remove the field if the condition is false
                        },
                    },

                    "model_data.epoch_results": {
                        $slice: ["$model_data.epoch_results", -1],
                    },
                },
            },
            {
                $addFields: {
                    "model_data.wgan_final_forecast": {
                        $cond: {
                            if: {
                                $eq: ["$model_type", "LSTM"],
                            },
                            then: "$$REMOVE",
                            else: "$model_data.wgan_final_forecast",
                        },
                    },
                },
            },
            {
                $addFields: {
                    "model_data.predicted_result.initial_forecast":
                    {
                        $slice: [
                            "$model_data.predicted_result.scaled",
                            {
                                $multiply: [
                                    "$model_data.training_parameters.lookAhead",
                                    -1,
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $addFields: {
                    "model_data.predicted_result": {
                        $cond: {
                            if: {
                                $eq: ["$model_type", "WGAN-GP"],
                            },
                            then: "$$REMOVE",
                            else: "$model_data.predicted_result",
                        },
                    },
                },
            }
        ]

        const pipeline = [
            match,
            lookup,
            ...add_fields,
            project,
            {
                $unset: [
                    "model_data.predicted_result.dates",
                    "model_data.predicted_result.standardized",
                    "model_data.predicted_result.scaled",
                    "model_data.correlation_data",
                ],
            },
        ]

        // Perform the aggregation
        const userModels = await model_collection.aggregate(pipeline).toArray();

        if (userModels.length > 0) {
            userModels.map((model) => {
                let { model_data: m_data, model_id, model_type } = model
                // let m_data = model.model_data
                m_data['latest_forecast_result'] = {}

                let path = ''
                if (model_type === 'LSTM') {
                    path = `./models/${model_id}`
                } else {
                    path = `./worker_celery/saved_models/${model_id}`
                }

                if (fs.existsSync(path)) {
                    model['model_data_available'] = true
                } else {
                    model['model_data_available'] = false
                }

                return {
                    ...model,
                    model_data: m_data
                }
            })
            // return userModels
        }
        else {
            return []
        }

        const additionalData = await getAdditionaSessionData(user_id)

        if (additionalData.length > 0) {
            const combined = userModels.map((model) => {
                if (model.model_type === 'WGAN-GP') {
                    const matchingObj = additionalData.find((ob) => ob.model_id === model.model_id);
                    if (matchingObj) {
                        return {
                            ...model,
                            additional_training_run_results: matchingObj.additional_training_run_results
                        };
                    } else {
                        return { ...model, additional_training_run_results: [] }
                    }
                } else {
                    return model;
                }
            });
            return combined
        }

        return userModels
    } catch (error) {
        log.error(error.stack);
        throw error;
    }
}

const deleteUserModelAndSessions = async (uid, model_id) => {
    try {
        const client = await connectToDatabase();
        const db = client.db('crypticsage');

        const model_collection = db.collection('models');
        const session_collection = db.collection('model_sessions');

        const modelDelResult = await model_collection.deleteOne({ user_id: uid, model_id: model_id });
        const sessionDelResult = await session_collection.deleteMany({ user_id: uid, model_id: model_id });
        console.log(`Deleted ${modelDelResult.deletedCount} document(s) from the models collection.`);
        console.log(`Deleted ${sessionDelResult.deletedCount} document(s) from the model_sessions collection.`);

        console.log('Transaction committed.');
        return [true, 'Model and sessions deleted'];

    } catch (error) {
        log.error(error.stack);
        return [false, 'Model and sessions delete error'];
    }
}

const renameModelForUser = async (user_id, model_id, model_name) => {
    try {
        const client = await connectToDatabase();
        const db = client.db('crypticsage');
        const model_collection = db.collection('models')

        const query = { user_id, model_id }
        const update = { $set: { model_name } }
        const updated = await model_collection.updateOne(query, update)

        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getSavedWGANGPModelIds = async () => { // Fetching WGAN-GP models only for clearing unsaved models
    try {
        const client = await connectToDatabase();
        const db = client.db('crypticsage');
        const inProgressCollection = db.collection('models');
        const agg = [
            {
                '$match': {
                    'model_type': 'WGAN-GP'
                }
            }, {
                '$project': {
                    'model_id': 1
                }
            }, {
                '$group': {
                    '_id': null,
                    'ids': {
                        '$push': '$model_id'
                    }
                }
            }
        ];
        const cursor = inProgressCollection.aggregate(agg);
        const result = await cursor.toArray();
        return result[0].ids
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


// <------------------------------------ MIGRATION FUNCTIONS ------------------------------------>


const migrateLSTMData = async () => {
    const client = await connectToDatabase();
    const db = client.db('crypticsage');
    const model_collection = db.collection('models');

    const proj = {
        _id: 0,
        model_id: 1,
        user_id: 1,
        model_created_date: 1,
        model_data: 1
    }

    const pipelineLSTM = [
        {
            $match: {
                model_type: 'LSTM'
            }
        },
        {
            $project: proj
        }
    ]

    const models = await model_collection.aggregate(pipelineLSTM).toArray();
    return models;
}

const migrateWGANData = async () => {
    const client = await connectToDatabase();
    const db = client.db('crypticsage');
    const model_collection = db.collection('models');

    const proj = {
        _id: 0,
        model_id: 1,
        user_id: 1,
        model_created_date: 1,
        model_data: 1,
    }

    const pipelineWGAN = [
        {
            $match: {
                model_type: 'WGAN-GP'
            }
        },
        {
            $project: proj
        }
    ]

    const models = await model_collection.aggregate(pipelineWGAN).toArray();
    return models;

}

// <------------------------------------ MIGRATION FUNCTIONS ------------------------------------>

module.exports = {
    saveUserModel
    , saveSessionData
    , fetchUserModels
    , deleteUserModelAndSessions
    , renameModelForUser
    , getSavedWGANGPModelIds
    , migrateLSTMData
    , migrateWGANData
};