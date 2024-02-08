from sklearn.preprocessing import MinMaxScaler
import numpy as np


def findIndex(transformation_order, to_predict):
    index = None
    for i, item in enumerate(transformation_order):
        if item["value"] == to_predict:
            index = i
            break
    return index


def getYlabels(trainData, y_label_index):
    y_value = trainData.iloc[
        :, [i for i in range(len(trainData.columns)) if i == y_label_index]
    ]
    return y_value


def scalar_function(x, y):
    X_Scalar = MinMaxScaler(feature_range=(-1, 1))
    Y_Scalar = MinMaxScaler(feature_range=(-1, 1))
    X_Scalar.fit(x)
    Y_Scalar.fit(y)

    return X_Scalar, Y_Scalar


def tranform_data(xTrain_norm, yTrain_norm):
    X_data = np.array(xTrain_norm)
    y_data = np.array(yTrain_norm)
    X = list()
    y = list()
    past_y = list()
    n_steps_in = 14
    n_steps_out = 5
    length = len(X_data)

    for i in range(0, length, 1):
        # print(i)
        X_value = X_data[i: i + n_steps_in][:, :]
        y_value = y_data[i + n_steps_in: i + (n_steps_in + n_steps_out)][:, 0]
        past_y_value = y_data[i: i + n_steps_in][:, :]
        # print(i, len(X_value), len(y_value))
        if len(X_value) == n_steps_in and len(y_value) == n_steps_out:
            X.append(X_value)
            y.append(y_value)
            past_y.append(past_y_value)

    return X, y, past_y


def generate_batches(data, batch_size):
    if len(data.shape) == 2:
        num_samples, seq_length = data.shape
    else:
        num_samples, seq_length, features = data.shape

    num_batches, remainder = divmod(num_samples, batch_size)

    # Initialize an empty list to store batches
    batch_list = []

    # Handle the initial batch
    if remainder > 0:
        initial_batch = data[:remainder]
        batch_list.append(initial_batch)

    # Reshape the remaining data into batches
    whole_batches = data[remainder:]
    reshapedWholeBatches = whole_batches.reshape(num_batches, batch_size, seq_length, *data.shape[2:])
    batch_list.extend(reshapedWholeBatches)

    return batch_list


def yield_batches(real_input, real_price, past_y, batchSize):
    num_samples, seq_length, features = real_input.shape
    num_batches, remainder = divmod(num_samples, batchSize)

    # Handle the initial batch
    if remainder > 0:
        initial_batch_input = real_input[:remainder]
        initial_batch_price = real_price[:remainder]
        initial_batch_past_y = past_y[:remainder]
        yield initial_batch_input, initial_batch_price, initial_batch_past_y

    # Reshape the remaining data into batches
    real_input_batches = real_input[remainder:]
    real_price_batches = real_price[remainder:]
    past_y_batches = past_y[remainder:]

    reshaped_input_batches = real_input_batches.reshape(num_batches, batchSize, seq_length, features)
    reshaped_price_batches = real_price_batches.reshape(num_batches, batchSize, -1)
    reshaped_past_y_batches = past_y_batches.reshape(num_batches, batchSize, seq_length, -1)

    for input_batch, price_batch, past_y_batch in zip(reshaped_input_batches, reshaped_price_batches, reshaped_past_y_batches):
        yield input_batch, price_batch, past_y_batch
