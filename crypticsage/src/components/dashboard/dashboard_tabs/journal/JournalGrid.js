import React from 'react'
import { Box, useTheme, Button, Dialog, DialogTitle, DialogActions, DialogContent, Alert, Snackbar } from '@mui/material'
import JOURNAL_DATA from './JournalData';
import { DataGrid, GridToolbar, GridRowModes, GridActionsCellItem } from '@mui/x-data-grid';

import { toast } from 'react-toastify';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';

const useFakeMutation = () => {
    return React.useCallback(
        (user) =>
            new Promise((resolve, reject) =>
                setTimeout(() => {
                    if (user.tradeName?.trim() === '') {
                        reject();
                    } else {
                        resolve(user);
                    }
                }, 200),
            ),
        [],
    );
};

function computeMutation(newRow, oldRow) {
    if (newRow.tradeName !== oldRow.tradeName) {
        return `Name from '${oldRow.tradeName}' to '${newRow.tradeName}'`;
    }
    if (newRow.ticker !== oldRow.ticker) {
        return `Age from '${oldRow.ticker || ''}' to '${newRow.ticker || ''}'`;
    }
    return null;
}

const JournalGrid = () => {
    const theme = useTheme()
    const rowData = () => {
        const rows = []
        JOURNAL_DATA.map((data, key) => {
            rows.push({
                id: key + 1,
                tradeName: data.tradeName,
                journalEntryDate: data.journalEntryDate,
                ticker: data.ticker,
                position: data.position,
                size: data.size,
                entryDate: data.entryDate,
                exitDate: data.exitDate,
                reward: data.rewardRisk,
                points: data.points,
                entryRate: data.entryRate,
                exitRate: data.exitRate,
                conviction: data.conviction,
                strategy: data.strategy,
                success: data.success,
                influence: data.influence,
                issue: data.issue,
                sell: data.sell,
                postTrade: data.postTrade
            })
        })
        return rows
    }

    const columns = [
        { field: 'id', headerName: 'ID', width: 50, hideable: true },
        {
            field: 'edit',
            headerName: 'Edit',
            width: 80,
            cellClassName: 'actions',
            renderCell: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon />}
                            label="Save"
                            onClick={handleSaveClick(id)}
                            key={id + 5}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon />}
                            label="Cancel"
                            className="textPrimary"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                            key={id + 10}
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        className="textPrimary"
                        onClick={handleEditClick(id)}
                        color="inherit"
                        key={id + 15}
                    />
                ];
            },
        },
        {
            field: 'delete', headerName: 'Delete', width: 80, hideable: true,
            renderCell: ({ id }) => {
                return [
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                        key={id + 20}
                    />]
            }
        },
        { field: 'journalEntryDate', headerName: 'Journal Date', type: 'date', width: 150, hideable: true },
        { field: 'tradeName', headerName: 'Trade Name', width: 150, editable: true, hideable: true },
        { field: 'ticker', headerName: 'Ticker', width: 150, editable: true, hideable: true },
        { field: 'position', headerName: 'Position', width: 150, hideable: true },
        { field: 'size', headerName: 'Size', width: 150, hideable: true },
        { field: 'points', headerName: 'Points', width: 150, hideable: true },
        { field: 'entryRate', headerName: 'Entry Rate', width: 150, hideable: true },
        { field: 'exitRate', headerName: 'Exit Rate', width: 150, hideable: true },
        { field: 'reward', headerName: 'Reward', width: 150, hideable: true },
        { field: 'entryDate', headerName: 'Entry Date', type: 'date', width: 150, hideable: true },
        { field: 'exitDate', headerName: 'Exit Date', type: 'date', width: 150, hideable: true },
        { field: 'conviction', headerName: 'Conviction', width: 150, hideable: true },
        { field: 'strategy', headerName: 'Strategy', width: 150, hideable: true },
        { field: 'success', headerName: 'Success', width: 150, hideable: true },
        { field: 'influence', headerName: 'Influence', width: 150, hideable: true },
        { field: 'issue', headerName: 'Issue', width: 150, hideable: true },
        { field: 'sell', headerName: 'Sell', width: 150, hideable: true },
        { field: 'postTrade', headerName: 'Post Trade', width: 150, hideable: true },
    ];

    const mutateRow = useFakeMutation();
    const noButtonRef = React.useRef(null);
    const [promiseArguments, setPromiseArguments] = React.useState(null);

    const [alert, setAlert] = React.useState(null);

    const handleCloseSnackbar = () => setAlert(null);

    const processRowUpdate = React.useCallback(
        (newRow, oldRow) =>
            new Promise((resolve, reject) => {
                const mutation = computeMutation(newRow, oldRow);
                if (mutation) {
                    // Save the arguments to resolve or reject the promise later
                    setPromiseArguments({ resolve, reject, newRow, oldRow });
                } else {
                    resolve(oldRow); // Nothing was changed
                }
            }),
        [],
    );

    const handleNo = () => {
        const { oldRow, resolve } = promiseArguments;
        resolve(oldRow); // Resolve with the old row to not update the internal state
        setPromiseArguments(null);
    };

    const handleYes = async () => {
        const { newRow, oldRow, reject, resolve } = promiseArguments;

        try {
            // Make the HTTP request to save in the backend
            const response = await mutateRow(newRow);
            setAlert({ children: 'User successfully saved', type: 'success' });
            resolve(response);
            console.log(response)
            setPromiseArguments(null);
        } catch (error) {
            setAlert({ children: "Name can't be empty", severity: 'error' });
            reject(oldRow);
            setPromiseArguments(null);
        }
    };

    const handleEntered = () => {
        // The `autoFocus` is not used because, if used, the same Enter that saves
        // the cell triggers "No". Instead, we manually focus the "No" button once
        // the dialog is fully open.
        // noButtonRef.current?.focus();
    };

    const renderConfirmDialog = () => {
        if (!promiseArguments) {
            return null;
        }

        const { newRow, oldRow } = promiseArguments;
        const mutation = computeMutation(newRow, oldRow);

        return (
            <Dialog
                maxWidth="xs"
                TransitionProps={{ onEntered: handleEntered }}
                open={!!promiseArguments}
            >
                <DialogTitle sx={{ color: `${theme.palette.secondary.main}` }}>Are you sure?</DialogTitle>
                <DialogContent sx={{ color: `${theme.palette.secondary.main}` }} dividers>
                    {`Pressing 'Yes' will change ${mutation}.`}
                </DialogContent>
                <DialogActions >
                    <Button
                        sx={{
                            color: `${theme.palette.secondary.main}`,
                            ':hover': {
                                color: `black !important`,
                                backgroundColor: 'white !important',
                            },
                        }}
                        ref={noButtonRef} onClick={handleNo}
                    >
                        No
                    </Button>
                    <Button
                        sx={{
                            color: `${theme.palette.secondary.main}`,
                            ':hover': {
                                color: `black !important`,
                                backgroundColor: 'white !important',
                            },
                        }}
                        onClick={handleYes}
                    >
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    const [rows, setRows] = React.useState(rowData());
    const [rowModesModel, setRowModesModel] = React.useState({});

    const handleRowEditStart = (params, event) => {
        event.defaultMuiPrevented = true;
    };

    const handleRowEditStop = (params, event) => {
        event.defaultMuiPrevented = true;
    };

    const handleEditClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    const handleDeleteClick = (id) => () => {
        // console.log(id)
        setRows(rows.filter((row) => row.id !== id));
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
    };

    const editSuccess = () => toast.success('Changes Saved', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: `editSuccess${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
        type: alert.type,
        onClose: () => handleCloseSnackbar()
    });

    return (
        <Box
            className='history-grid-component'
            sx={{
                width: '100%',
                height: '500px',
                '& .MuiDataGrid-toolbarContainer': {
                    display: 'block'
                },
                '& .MuiDataGrid-toolbarContainer button': {
                    marginRight: '5px !important',
                    color: `${theme.palette.warning.main} !important`,
                },
                '& .MuiDataGrid-toolbarContainer button:hover': {
                    color: `black !important`,
                    backgroundColor: 'white !important',
                },
                '& .MuiTablePagination-root': {
                    color: `${theme.palette.warning.main} !important`,
                },
            }}
        >
            {renderConfirmDialog()}
            <DataGrid
                initialState={{
                    columns: {
                        columnVisibilityModel: {
                            position: false,
                            reward: false,
                            influence: false,
                            issue: false,
                            sell: false,
                            postTrade: false,
                        },
                    },
                }}
                sx={{ color: `${theme.palette.secondary.main}` }}	
                disableColumnMenu={true}
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
                onRowEditStart={handleRowEditStart}
                onRowEditStop={handleRowEditStop}
                components={{ Toolbar: GridToolbar }}
                processRowUpdate={processRowUpdate}
                experimentalFeatures={{ newEditingApi: true }}
            // checkboxSelection={true}
            />
            {!!alert && (
                editSuccess()
            )}
        </Box>
    )
}

export default JournalGrid