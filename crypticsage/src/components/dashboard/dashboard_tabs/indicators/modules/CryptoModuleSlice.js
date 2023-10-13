import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
const baseUrl = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_BASEURL : process.env.REACT_APP_NGROK_URL;

export const executeAllSelectedFunctions = createAsyncThunk(
    'cryptoModule/sendApiRequests',
    async (finalTalibExecuteQuery, thunkAPI) => {
        const allResponses = []
        for (const queryObj of finalTalibExecuteQuery) {
            const { id, payload } = queryObj;
            try {
                const response = await axios.post(`${baseUrl}/indicators/execute_talib_function`, { payload }, {})
                allResponses.push({ id, result: response.data.result })
            } catch (error) {
                console.log(error)
            }
        }
        // console.log("Execute response",allResponses)
        return allResponses;
    })

const initialState = {
    toolTipOn: false,
    barsFromTo: { from: 0, to: 0 },
    selectedTickerName: '',
    selectedTickerPeriod: '4h',
    talibDescription: [],
    talibDescriptionCopy: [],
    cryptoDataInDb: [],
    streamedTickerData: [],
    selectedFunctions: [],
    modifiedSelectedFunctionWithDataToRender: [],
    processSelectedFunctionsOnMoreData: false,
}

const cryptoModuleSlice = createSlice({
    name: 'cryptoModule',
    initialState,
    reducers: {
        toggleToolTipSwitch: (state) => {
            state.toolTipOn = !state.toolTipOn;
        },
        setBarsFromTo: (state, action) => {
            state.barsFromTo = action.payload;
        },
        toggleProcessSelectedFunctionsOnMoreData: (state, action) => {
            state.processSelectedFunctionsOnMoreData = action.payload;
        },
        setTalibDescription: (state, action) => {
            state.talibDescription = action.payload;
            state.talibDescriptionCopy = action.payload;
        },
        setSelectedFlagInTalibDescription: (state, action) => {
            const { group, name, inputs, optInputs } = action.payload;
            const currentState = state.talibDescription;

            // Find the group in currentState
            const foundGroupIndex = currentState.findIndex((grp) => grp.group_name === group);

            if (foundGroupIndex !== -1) {
                const foundGroup = currentState[foundGroupIndex];

                // Find the function within the group
                const foundFunctionIndex = foundGroup.functions.findIndex((func) => func.name === name);

                if (foundFunctionIndex !== -1) {
                    // Update the inputs and optInputs of the function
                    foundGroup.functions[foundFunctionIndex].inputs = inputs;
                    foundGroup.functions[foundFunctionIndex].optInputs = optInputs;
                    foundGroup.functions[foundFunctionIndex].function_selected_flag = true;

                    // Update the state.talibDescription with the updated group
                    currentState[foundGroupIndex] = foundGroup;
                }
            }

            state.talibDescription = currentState;
        },
        setSelectedTickerName: (state, action) => {
            state.selectedTickerName = action.payload;
        },
        setSelectedTickerPeriod: (state, action) => {
            state.selectedTickerPeriod = action.payload;
            state.cryptoDataInDb = [];
            state.talibDescription = state.talibDescriptionCopy;
            state.selectedFunctions = [];
            state.modifiedSelectedFunctionWithDataToRender = [];
        },
        setCryptoDataInDbRedux: (state, action) => {
            state.cryptoDataInDb = action.payload;
        },
        setStreamedTickerDataRedux: (state, action) => {
            state.streamedTickerData.push(action.payload);
        },
        resetStreamedTickerDataRedux: (state) => {
            state.streamedTickerData = [];
        },
        setSelectedFunctions: (state, action) => {
            const { name, hint, group_name, outputs, function_selected_flag, inputs, optInputs, result, splitPane } = action.payload;
            const currentState = state.selectedFunctions;
            const diffVal = optInputs.length > 0 ? optInputs[0].defaultValue : ''
            const foundFunction = currentState.find((func) => func.name === name);
            if (!foundFunction) {
                let newId = uuidv4();
                const objectToPush = {
                    name: name,
                    hint: hint,
                    outputs: outputs,
                    group_name: group_name,
                    function_selected_flag: function_selected_flag,
                    splitPane: splitPane,
                    functions: [
                        {
                            id: newId,
                            name: name,
                            display_name: `${name}_${diffVal}`,
                            inputs: inputs,
                            optInputs: optInputs,
                            outputAvailable: result.length > 0 ? true : false,
                            show_chart_flag: true,
                            differentiatorValue: diffVal,
                            show_settings: false,
                        }
                    ]
                }
                state.selectedFunctions.push(objectToPush)

                // console.log(result)
                result.forEach((differentOutputs) => {
                    const objectForChart = {
                        id: newId,
                        name: name,
                        display_name: `${name}_${diffVal}`,
                        result: differentOutputs.data,
                        visible: true,
                        key: differentOutputs.key,
                        differentiatorValue: diffVal,
                        isDataNew: false,
                        splitPane: splitPane,
                    }
                    state.modifiedSelectedFunctionWithDataToRender.push(objectForChart)
                })

            } else {
                // console.log('Existing in redux')
                const foundIndex = currentState.findIndex((func) => func.name === name);
                currentState[foundIndex].functions.push(
                    {
                        id: uuidv4(),
                        name: name,
                        display_name: `${name}_${diffVal}`,
                        inputs: inputs,
                        optInputs: optInputs,
                        outputAvailable: result.length > 0 ? true : false,
                        show_chart_flag: false,
                        differentiatorValue: diffVal,
                        show_settings: false,
                    }
                );
                state.selectedFunctions = currentState;
            }
        },
        setSelectedFunctionInputValues: (state, action) => {
            const { fieldName, value, id, name } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.inputs = updatedFunction.inputs.map((input) => {
                        if (input.name === fieldName) {
                            return {
                                ...input,
                                value: value,
                                errorFlag: false,
                                helperText: '',
                            };
                        }
                        return input;
                    });

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;
        },
        setFunctionInputErrorFlagAndMessage: (state, action) => {
            const { name, id, inputs } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.inputs = inputs;

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;

        },
        setSelectedFunctionOptionalInputValues: (state, action) => {
            const { fieldName, value, id, name } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.optInputs = updatedFunction.optInputs.map((input) => {
                        if (input.name === fieldName) {
                            const defaultValue = value; // Convert value to integer if needed
                            const errorFlag = defaultValue === '' ? true : false;
                            const helperText = errorFlag ? 'Default value cannot be null' : '';
                            return {
                                ...input,
                                defaultValue,
                                errorFlag,
                                helperText,
                            };
                        }
                        return input;
                    });
                    updatedFunction.differentiatorValue = updatedFunction.optInputs[0].defaultValue;
                    // let diffValue = updatedFunction.optInputs[0].defaultValue;
                    // console.log(diffValue);

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;
        },
        setTalibResult: (state, action) => {
            const { name, id, optInputs, result } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            // setting outputAvailable to true
            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.outputAvailable = true;

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;

                }
            }
            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;

            const diffVal = optInputs.length > 0 ? optInputs[0].defaultValue : ''
            result.forEach((differentOutputs) => {
                const objectForChart = {
                    id: id,
                    name: name,
                    display_name: `${name}_${diffVal}`,
                    result: differentOutputs.data,
                    visible: false,
                    key: differentOutputs.key,
                    differentiatorValue: diffVal,
                    isDataNew: false
                }

                // Check if an object with the same 'key' exists in the array
                const existingObjectIndex = state.modifiedSelectedFunctionWithDataToRender.findIndex((item) => item.id === id && item.key === objectForChart.key);
                if (existingObjectIndex !== -1) {
                    // If an object with the same 'key' exists, update it
                    objectForChart.visible = true;
                    objectForChart.isDataNew = true;
                    state.modifiedSelectedFunctionWithDataToRender[existingObjectIndex] = objectForChart;
                } else {
                    // If no object with the same 'key' exists, push the new object
                    state.modifiedSelectedFunctionWithDataToRender.push(objectForChart);
                }
            })
        },
        toggleShowHideChartFlag: (state, action) => {
            const { id, name } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the show_chart_flag
                    updatedFunction.show_chart_flag = !updatedFunction.show_chart_flag;

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;

            const currentStateModified = state.modifiedSelectedFunctionWithDataToRender;

            const filteredFunctionsById = currentStateModified.filter((func) => func.id === id);

            if (filteredFunctionsById.length > 0) {
                filteredFunctionsById.forEach((filteredFunc) => {
                    filteredFunc.visible = !filteredFunc.visible;
                    const foundFunctionIndexModified = currentStateModified.findIndex((func) => func.id === id && filteredFunc.key === func.key);
                    currentStateModified[foundFunctionIndexModified] = filteredFunc;
                })
            }

            state.modifiedSelectedFunctionWithDataToRender = currentStateModified;
        },
        toggleShowSettingsFlag: (state, action) => {
            const { name, id } = action.payload;
            const currentState = state.selectedFunctions;

            /* currentState.forEach((func) => {
                func.functions.forEach((func) => {
                    func.show_settings = false;
                })
            })
 */
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {

                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {

                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the show_settings flag
                    updatedFunction.show_settings = !updatedFunction.show_settings; // maybe true here

                    // Update the function within the found function's functions array

                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }
            state.selectedFunctions = currentState;
        },
        resetShowSettingsFlag: (state) => {
            const currentState = state.selectedFunctions;
            currentState.forEach((func) => {
                func.functions.forEach((func) => {
                    func.show_settings = false;
                })
            })
            state.selectedFunctions = currentState;
        },
        removeFromSelectedFunction: (state, action) => {
            const { id, name, group_name } = action.payload;
            const currentState = state.selectedFunctions;
            const talibDesc = state.talibDescription;
            const foundFunction = currentState[currentState.findIndex((func) => func.name === name)];
            const foundFunctionIndex = foundFunction.functions.findIndex((func) => func.id === id);
            foundFunction.functions.splice(foundFunctionIndex, 1);

            if (foundFunction.functions.length === 0) {
                const foundIndex = currentState.findIndex((func) => func.name === name);
                currentState.splice(foundIndex, 1);

                const foundGroupIndex = talibDesc.findIndex((grp) => grp.group_name === group_name);
                const foundGroup = talibDesc[foundGroupIndex];
                const foundFunctionIndex = foundGroup.functions.findIndex((func) => func.name === name);
                foundGroup.functions[foundFunctionIndex].function_selected_flag = false;
                talibDesc[foundGroupIndex] = foundGroup;
            }

            const modifiedSFWithDataTR = state.modifiedSelectedFunctionWithDataToRender;

            const filteredFunctiosnById = modifiedSFWithDataTR.filter((func) => func.id === id);

            if (filteredFunctiosnById.length > 0) {
                filteredFunctiosnById.forEach((filteredFunc) => {
                    const foundFunctionIndexInModified = modifiedSFWithDataTR.findIndex((func) => func.id === id && filteredFunc.key === func.key);
                    modifiedSFWithDataTR.splice(foundFunctionIndexInModified, 1);
                })
            }

            state.modifiedSelectedFunctionWithDataToRender = modifiedSFWithDataTR;

            state.selectedFunctions = currentState;
            state.talibDescription = talibDesc;
        },
        resetDataLoadedState: (state) => {
            state.selectedTickerPeriod = '4h';
            state.talibDescription = state.talibDescriptionCopy;
            state.selectedFunctions = [];
            state.modifiedSelectedFunctionWithDataToRender = [];
            state.barsFromTo = { from: 0, to: 0 };
        },
        resetCryptoStockModule: (state) => {
            state.selectedTickerName = '';
            state.barsFromTo = { from: 0, to: 0 };
            state.selectedTickerPeriod = '4h';
            state.talibDescription = [];
            state.talibDescriptionCopy = [];
            state.cryptoDataInDb = [];
            state.streamedTickerData = [];
            state.selectedFunctions = [];
            state.modifiedSelectedFunctionWithDataToRender = [];
        },
        setIsDataNewFlag: (state, action) => {
            const currentState = state.modifiedSelectedFunctionWithDataToRender;
            currentState.filter((func) => func.isDataNew === true).forEach((func) => {
                func.isDataNew = false;
            })
            state.modifiedSelectedFunctionWithDataToRender = currentState;
        }
    }, extraReducers: (builder) => {
        builder.addCase(executeAllSelectedFunctions.fulfilled, (state, action) => {
            const currentMSFWDTR = state.modifiedSelectedFunctionWithDataToRender;
            const newData = action.payload

            const updatedMSFWDTR = currentMSFWDTR.map((item) => {
                const matchingData = newData.find((data) => data.id === item.id && data.result.some((res) => res.key === item.key));
                if (matchingData) {
                    const newResult = matchingData.result.find((res) => res.key === item.key).data;
                    return {
                        ...item,
                        result: newResult,
                        isDataNew: true,
                    };
                }
                return item;
            });
            state.modifiedSelectedFunctionWithDataToRender = updatedMSFWDTR;
            // console.log("State modified",updatedMSFWDTR)
        })
    }
})

const { reducer, actions } = cryptoModuleSlice;
export const {
    toggleToolTipSwitch
    , setBarsFromTo
    , toggleProcessSelectedFunctionsOnMoreData
    , setTalibDescription
    , setSelectedFlagInTalibDescription
    , setSelectedTickerName
    , setSelectedTickerPeriod
    , setCryptoDataInDbRedux
    , setStocksDataInDbRedux
    , setStreamedTickerDataRedux
    , resetStreamedTickerDataRedux
    , setSelectedFunctions
    , setSelectedFunctionInputValues
    , setFunctionInputErrorFlagAndMessage
    , setSelectedFunctionOptionalInputValues
    , setTalibResult
    , toggleShowHideChartFlag
    , toggleShowSettingsFlag
    , resetShowSettingsFlag
    , removeFromSelectedFunction
    , resetDataLoadedState
    , resetCryptoStockModule
    , setIsDataNewFlag
} = actions;
export default reducer;