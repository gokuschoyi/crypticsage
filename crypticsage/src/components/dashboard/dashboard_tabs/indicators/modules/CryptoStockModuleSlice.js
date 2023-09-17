import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';

const initialState = {
    talibDescription: [],
    talibDescriptionCopy: [],
    cryptoDataInDb: [],
    stocksDataInDb: [],
    streamedTickerData: [],
    selectedFunctions: []
}

const cryptoStockModuleSlice = createSlice({
    name: 'cryptoStockModule',
    initialState,
    reducers: {
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
        setCryptoDataInDbRedux: (state, action) => {
            state.cryptoDataInDb = action.payload;
        },
        setStocksDataInDbRedux: (state, action) => {
            state.stocksDataInDb = action.payload;
        },
        setStreamedTickerDataRedux: (state, action) => {
            state.streamedTickerData.push(action.payload);
        },
        resetStreamedTickerDataRedux: (state) => {
            state.streamedTickerData = [];
        },
        setSelectedFunctions: (state, action) => {
            const { name, hint, group_name, outputs, function_selected_flag, inputs, optInputs, result } = action.payload;
            const currentState = state.selectedFunctions;
            const foundFunction = currentState.find((func) => func.name === name);
            if (!foundFunction) {
                state.selectedFunctions.push({
                    name: name,
                    hint: hint,
                    outputs: outputs,
                    group_name: group_name,
                    function_selected_flag: function_selected_flag,
                    functions: [
                        {
                            id: uuidv4(),
                            inputs: inputs,
                            optInputs: optInputs,
                            result: result,
                            show_chart_flag: true,
                            differentiatorValue: optInputs.length > 0 ? optInputs[0].defaultValue : ''
                        }
                    ]
                })
            } else {
                const foundIndex = currentState.findIndex((func) => func.name === name);
                currentState[foundIndex].functions.push(
                    {
                        id: uuidv4(),
                        inputs: inputs,
                        optInputs: optInputs,
                        result: result,
                        show_chart_flag: false,
                        differentiatorValue: optInputs.length > 0 ? optInputs[0].defaultValue : ''
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
                    let diffValue = updatedFunction.optInputs[0].defaultValue;
                    console.log(diffValue);

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
            const { name, id, result } = action.payload;
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
                    updatedFunction.result = result;

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;

                }
            }
            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;
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
        },
        removeFromSelectedFunction: (state, action) => {
            const { id, name, group_name } = action.payload;
            const currentState = state.selectedFunctions;
            const talibDesc = state.talibDescription;
            const foundFunction = currentState[currentState.findIndex((func) => func.name === name)];
            const foundFunctionIndex = foundFunction.functions.findIndex((func) => func.id === id);
            foundFunction.functions.splice(foundFunctionIndex, 1);
            // console.log(foundFunction.functions.length);
            if (foundFunction.functions.length === 0) {
                const foundIndex = currentState.findIndex((func) => func.name === name);
                currentState.splice(foundIndex, 1);

                const foundGroupIndex = talibDesc.findIndex((grp) => grp.group_name === group_name);
                const foundGroup = talibDesc[foundGroupIndex];
                const foundFunctionIndex = foundGroup.functions.findIndex((func) => func.name === name);
                foundGroup.functions[foundFunctionIndex].function_selected_flag = false;
                talibDesc[foundGroupIndex] = foundGroup;
            }

            state.selectedFunctions = currentState;
            state.talibDescription = talibDesc;
        },
        resetCryptoStockModule: (state) => {
            state.talibDescription = [];
            state.talibDescriptionCopy = [];
            state.cryptoDataInDb = [];
            state.stocksDataInDb = [];
            state.streamedTickerData = [];
            state.selectedFunctions = [];
        }
    }
})

const { reducer, actions } = cryptoStockModuleSlice;
export const {
    setTalibDescription
    , setSelectedFlagInTalibDescription
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
    , removeFromSelectedFunction
    , resetCryptoStockModule
} = actions;
export default reducer;