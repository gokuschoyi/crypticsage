import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';

const initialState = {
    talibDescription: [],
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
        },
        setFunctionSelectedFlag: (state, action) => {
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
            const { name, hint, outputs, function_selected_flag, inputs, optInputs, result } = action.payload;
            const currentState = state.selectedFunctions;
            const foundFunction = currentState.find((func) => func.name === name);
            if (!foundFunction) {
                state.selectedFunctions.push({
                    name: name,
                    hint: hint,
                    outputs: outputs,
                    function_selected_flag: function_selected_flag,
                    functions: [{ id: uuidv4(), inputs: inputs, optInputs: optInputs, result: result }]
                })
            } else {
                const foundIndex = currentState.findIndex((func) => func.name === name);
                currentState[foundIndex].functions.push({ id: uuidv4(), inputs: inputs, optInputs: optInputs, result: result });
                state.selectedFunctions = currentState;
            }
        },
        resetCryptoStockModule: (state) => {
            state.talibDescription = [];
            state.cryptoDataInDb = [];
            state.stocksDataInDb = [];
            state.streamedTickerData = [];
            state.selectedFunctions = [];
        }
    }
})

const { reducer, actions } = cryptoStockModuleSlice;
export const {
    setTalibDescription,
    setFunctionSelectedFlag,
    setCryptoDataInDbRedux,
    setStocksDataInDbRedux,
    setStreamedTickerDataRedux,
    resetStreamedTickerDataRedux,
    setSelectedFunctions,
    resetCryptoStockModule
} = actions;
export default reducer;