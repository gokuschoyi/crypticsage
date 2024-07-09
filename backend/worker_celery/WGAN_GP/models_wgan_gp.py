from keras.layers import Bidirectional, LSTM, Dense, Flatten, Conv1D, Dropout, LeakyReLU
from keras import Sequential
import keras


def Generator(weight_initializer, input_dim, feature_size, output_dim) -> keras.models.Model:
    model = Sequential()
    model.add(
        Conv1D(
            32,
            kernel_size=2,
            strides=1,
            padding="same",
            kernel_initializer=weight_initializer,
            batch_input_shape=(None, input_dim, feature_size),
        )
    )
    model.add(LeakyReLU(alpha=0.1))
    model.add(
        Bidirectional(
            LSTM(
                64,
                activation="relu",
                kernel_initializer=weight_initializer,
                return_sequences=False,
                dropout=0.3,
                recurrent_dropout=0.0,
            )
        )
    )
    # model.add(Flatten())

    model.add(Dense(64, activation="linear"))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))
    model.add(Dense(32, activation="linear"))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))

    model.add(Dense(output_dim))
    return model


def Discriminator(weight_initializer, time_step, look_ahead) -> keras.models.Model:
    model = Sequential()
    model.add(
        Conv1D(
            32,
            kernel_size=2,
            strides=1,
            kernel_initializer=weight_initializer,
            padding="same",
            input_shape=(time_step + look_ahead, 1),
        )
    )
    model.add(LeakyReLU(alpha=0.1))
    model.add(
        Conv1D(
            64,
            kernel_size=2,
            strides=1,
            kernel_initializer=weight_initializer,
            padding="same",
        )
    )
    model.add(LeakyReLU(alpha=0.1))
    model.add(Flatten())

    model.add(Dense(64, activation="linear", use_bias=True))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))
    model.add(Dense(32, activation="linear", use_bias=True))
    model.add(LeakyReLU(alpha=0.1))
    model.add(Dropout(0.2))

    model.add(Dense(1, activation="linear"))
    return model
