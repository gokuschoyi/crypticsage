const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
let tf = require('@tensorflow/tfjs-node');
const { createTimer } = require('./timer')
const config = require('../config')
const Redis = require("ioredis");
// @ts-ignore
const redisPublisher = new Redis();

// remove file later
/* __________________________________________________________________________________________
Layer (type)                Input Shape               Output shape              Param #   
==========================================================================================
conv1d_Conv1D1 (Conv1D)     [[null,14,4]]             [null,14,32]              288       
__________________________________________________________________________________________
leaky_re_lu_LeakyReLU1 (Lea [[null,14,32]]            [null,14,32]              0         
__________________________________________________________________________________________
bidirectional_Bidirectional [[null,14,32]]            [null,128]                49664     
__________________________________________________________________________________________
dense_Dense1 (Dense)        [[null,128]]              [null,64]                 8256      
__________________________________________________________________________________________
leaky_re_lu_LeakyReLU2 (Lea [[null,64]]               [null,64]                 0         
__________________________________________________________________________________________
dropout_Dropout1 (Dropout)  [[null,64]]               [null,64]                 0         
__________________________________________________________________________________________
dense_Dense2 (Dense)        [[null,64]]               [null,32]                 2080      
__________________________________________________________________________________________
leaky_re_lu_LeakyReLU3 (Lea [[null,32]]               [null,32]                 0         
__________________________________________________________________________________________
dropout_Dropout2 (Dropout)  [[null,32]]               [null,32]                 0         
__________________________________________________________________________________________
dense_Dense3 (Dense)        [[null,32]]               [null,5]                  165       
==========================================================================================
Total params: 60453
Trainable params: 60453
Non-trainable params: 0
__________________________________________________________________________________________ */

const generator = ({ input_dimension, output_dimension, feature_size, weight_initializers }) => {
    const generator_model = tf.sequential();

    generator_model.add(tf.layers.conv1d({
        filters: 32,
        kernelSize: 2,
        strides: 1,
        padding: 'same',
        kernelInitializer: weight_initializers,
        batchInputShape: [null, input_dimension, feature_size],
    }))

    generator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))

    generator_model.add(tf.layers.bidirectional({
        layer: tf.layers.lstm({
            units: 80,
            activation: 'relu',
            kernelInitializer: weight_initializers,
            returnSequences: false,
            dropout: 0.3,
            recurrentDropout: 0.0
        })
    }))

    generator_model.add(tf.layers.dense({ units: 64, activation: 'linear' }))
    generator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    generator_model.add(tf.layers.dropout({ rate: 0.2 }))

    generator_model.add(tf.layers.dense({ units: 32, activation: 'linear' }))
    generator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    generator_model.add(tf.layers.dropout({ rate: 0.2 }))

    const input = tf.input({ shape: [input_dimension, feature_size] })
    const output = generator_model.apply(input)

    const predictions = tf.layers.dense({ units: output_dimension, inputShape: output.shape[1] }).apply(output)
    const g_model = tf.model({ inputs: input, outputs: predictions })
    // console.log(g_model.summary())

    return g_model
}

/* ________________________________________________________________________________________
Layer (type)                Input Shape               Output shape              Param #   
==========================================================================================
conv1d_Conv1D1 (Conv1D)     [[null,19,1]]             [null,19,32]              96        
__________________________________________________________________________________________
leaky_re_lu_LeakyReLU1 (Lea [[null,19,32]]            [null,19,32]              0         
__________________________________________________________________________________________
conv1d_Conv1D2 (Conv1D)     [[null,19,32]]            [null,19,64]              4160      
__________________________________________________________________________________________
leaky_re_lu_LeakyReLU2 (Lea [[null,19,64]]            [null,19,64]              0         
__________________________________________________________________________________________
flatten_Flatten1 (Flatten)  [[null,19,64]]            [null,1216]               0         
__________________________________________________________________________________________
dense_Dense1 (Dense)        [[null,1216]]             [null,64]                 77888     
__________________________________________________________________________________________
leaky_re_lu_LeakyReLU3 (Lea [[null,64]]               [null,64]                 0         
__________________________________________________________________________________________
dropout_Dropout1 (Dropout)  [[null,64]]               [null,64]                 0         
__________________________________________________________________________________________
dense_Dense2 (Dense)        [[null,64]]               [null,32]                 2080      
__________________________________________________________________________________________
leaky_re_lu_LeakyReLU4 (Lea [[null,32]]               [null,32]                 0         
__________________________________________________________________________________________
dropout_Dropout2 (Dropout)  [[null,32]]               [null,32]                 0         
__________________________________________________________________________________________
dense_Dense3 (Dense)        [[null,32]]               [null,1]                  33        
==========================================================================================
Total params: 84257
Trainable params: 84257
Non-trainable params: 0
__________________________________________________________________________________________ */

const discriminator = ({ timeStep, lookAhead, weight_initializers }) => {
    const discriminator_model = tf.sequential();

    discriminator_model.add(tf.layers.conv1d({
        filters: 32,
        kernelSize: 2,
        strides: 1,
        padding: 'same',
        kernelInitializer: weight_initializers,
        inputShape: [timeStep + lookAhead, 1]
    }))

    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))

    discriminator_model.add(tf.layers.conv1d({
        filters: 64,
        kernelSize: 2,
        strides: 1,
        padding: 'same',
        kernelInitializer: weight_initializers,
    }))

    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    discriminator_model.add(tf.layers.flatten())

    discriminator_model.add(tf.layers.dense({ units: 64, activation: 'linear', useBias: true }))
    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    discriminator_model.add(tf.layers.dropout({ rate: 0.2 }))

    discriminator_model.add(tf.layers.dense({ units: 32, activation: 'linear', useBias: true }))
    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    discriminator_model.add(tf.layers.dropout({ rate: 0.2 }))

    const fake_data = tf.input({ shape: [timeStep + lookAhead, 1] })
    const discriminator_output = discriminator_model.apply(fake_data)

    const realness_score = tf.layers.dense({ units: 1 }).apply(discriminator_output)
    const d_model = tf.model({ inputs: fake_data, outputs: realness_score })
    // console.log(d_model.summary())
    return d_model
}

const DEBUG_FLAG = false

// Calculate gradient penalty 
const gradientPenalty = (batchSize, time_step, look_ahead, discriminator_, fakeData, realData) => tf.tidy(() => {
    const LAMBDA = 10 // Gradient penalty lambda hyperparameter
    // console.log('Real Data : ', realData.arraySync()[0])
    // console.log('Fake Data : ', fakeData.arraySync()[0])
    const alpha = tf.randomUniform([batchSize, time_step + look_ahead, 1], -1.0, 1.0, 'float32');
    const interpolated = alpha.mul(realData).add(alpha.mul(fakeData.sub(realData)));

    // console.log('Real Data : ', realData.arraySync()[0])
    // console.log('Fake Data : ', fakeData.arraySync()[0])
    // console.log('APLHA : ', alpha.arraySync()[0])
    // console.log('DIFF : ', diff.arraySync()[0])
    // console.log('Interpolated : ', interpolated.arraySync()[0])


    /* const gradientsFn = tf.valueAndGrad((x) => {
        const pred = discriminator_.apply(x, { training: true })
        console.log('pred : ', pred.arraySync()[81])
        return pred
    });
    const { value, grad } = gradientsFn(interpolated) */

    const disc_output = discriminator_.apply(interpolated, { training: true })
    const gradient = tf.grad(() => disc_output)(interpolated)
    const grad_fo_calc = tf.tensor(gradient.arraySync())
    tf.dispose([disc_output, gradient])

    console.log('grad : ', grad_fo_calc.arraySync()[81][18])

    const gradientsNorm = tf.euclideanNorm(grad_fo_calc, 1); // l2 norm`
    const gp = gradientsNorm.sub(tf.scalar(1)).square().mean().mul(LAMBDA).asScalar();
    console.log('NORM:', gradientsNorm.dataSync()[0], 'PENA: ', gp.dataSync()[0])
    tf.dispose([gradientsNorm, grad_fo_calc, interpolated, alpha, LAMBDA])

    return gp
})

// Training Step for the WGAN-GP
const trainStep = (data, time_step, look_ahead, generator_, discriminator_) => {
    const [xTrainTensor, yTrainTensor, pastYTrainTensor] = data;
    const batchSize = xTrainTensor.shape[0];
    let dLossValue_ = 0;
    let gLossValue_ = 0;
    let gMse_ = 0;
    const lambda1 = 0.5; // Extra loss term for speeding up training
    let generatorData_;
    const lambda2 = 0.5; // Extra loss term for speeding up training

    try {
        const realOutput = () => tf.tidy(() => {
            const realYReshape = tf.tidy(() => { return yTrainTensor.reshape([yTrainTensor.shape[0], yTrainTensor.shape[1], 1]) })
            return tf.cast(pastYTrainTensor, 'float32').concat(tf.cast(realYReshape, 'float32'), 1);
        })

        const latentData = () => tf.tidy(() => {
            const generator_data = tf.tidy(() => { return generator_.apply(xTrainTensor, { training: true }) });
            console.log('Latent Data call value : ', generator_data.arraySync()[0])
            const generator_data_reshape = tf.tidy(() => { return generator_data.reshape([generator_data.shape[0], generator_data.shape[1], 1]) })
            return tf.cast(pastYTrainTensor.concat(generator_data_reshape, 1), 'float32');
        })

        // Train the discriminator
        const dOptimizer = tf.train.adam(0.0004, 0.5, 0.9)
        for (let i = 0; i < 5; i++) {
            // Calculate discriminator loss, compute gradients of the loss with respect to discriminator's inputs
            const dLossValue = dOptimizer.minimize(() => {
                // Generate Real data
                const real_data = realOutput()
                // Generate fake data
                const latent_data = latentData()

                // Wasserstein Loss - If this value is 0 that means 
                // both the distributions are same and discriminator is 
                // guessing 50% of the time
                const DReal = discriminator_.apply(real_data, { training: true }) // shape [batchSize, 1]
                const DFake = discriminator_.apply(latent_data, { training: true }) // shape [batchSize, 1]
                const real_loss = tf.cast(DReal.mean(), 'float32')
                const fake_loss = tf.cast(DFake.mean(), 'float32')
                const wassersteinLoss = tf.mean(fake_loss.sub(real_loss))

                console.log('Fake data loss: ', fake_loss.dataSync()[0], 'Real data loss: ', real_loss.dataSync()[0], 'dCost : ', wassersteinLoss.dataSync()[0])

                // Calculate gradient penalty 
                const gp = gradientPenalty(batchSize, time_step, look_ahead, discriminator_, latent_data, real_data)

                if (DEBUG_FLAG) {
                    console.log('Noise Data DIS REAL : ', real_data.arraySync()[0][14])
                    console.log('Noise Data DIS : ', latent_data.arraySync()[0][14])

                    console.log('D PRED FAKE VALUE: ', DFake.arraySync()[0][0], 'D PRED REAL VALUE: ', DReal.arraySync()[0][0])
                    console.log('Fake data loss: ', DFake.mean().dataSync()[0], 'Real data loss: ', DReal.mean().dataSync()[0])
                }

                // const discriminatorLoss = tf.add(dCost, gp).asScalar();
                // console.log('D LOSS LOOP DISPOSE ' + tf.memory().numTensors);
                return tf.add(wassersteinLoss, gp).asScalar();
            }, true, discriminator_.getWeights());


            dLossValue_ = dLossValue.dataSync()[0]
            tf.dispose([dLossValue])

            console.log('<-------------------DISCRIMINATOR---------------------->')
        }
        dOptimizer.dispose()

        console.log('<-------------------GENERATOR---------------------->')
        const gOptimizer = tf.train.adam(0.0001, 0.5, 0.9);
        // Train the generator only once. 
        const gLossValue = gOptimizer.minimize(() => {
            // Generate Real data
            const real_data = tf.tidy(() => { return yTrainTensor.reshape([yTrainTensor.shape[0], yTrainTensor.shape[1], 1]) })

            // Generate fake data
            const generator_data = tf.tidy(() => { return generator_.apply(xTrainTensor, { training: true }) });
            const generator_data_reshape = tf.tidy(() => { return generator_data.reshape([generator_data.shape[0], generator_data.shape[1], 1]) })
            const latent_data = tf.cast(pastYTrainTensor.concat(generator_data_reshape, 1), 'float32');
            generatorData_ = tf.keep(latent_data)


            // Calculate the generator loss
            const g_mean = discriminator_.apply(latent_data, { training: true }).mean().mul(-1)
            const gMse = tf.losses.meanSquaredError(real_data, generator_data_reshape)
            const gSign = tf.abs(tf.sign(real_data).sub(tf.sign(generator_data_reshape))).mean();

            console.log('Noise Data GEN REAL: ', real_data.arraySync()[0][0])
            console.log('Noise Data GEN : ', latent_data.arraySync()[0][14])
            console.log('gmean minus true', g_mean.dataSync()[0], 'gmse', gMse.dataSync()[0], 'gsign', gSign.dataSync()[0])

            if (DEBUG_FLAG) {

            }

            return g_mean.add(gMse.mul(lambda1)).add(gSign.mul(lambda2)).asScalar();
        }, true, generator_.getWeights());
        gLossValue_ = gLossValue.dataSync()[0]
        gOptimizer.dispose()
        tf.dispose([gLossValue])

        return { generatorData_, discriminatorLoss: dLossValue_, generatorLoss: gLossValue_, g_mse: gMse_ };
    }
    catch (e) {
        console.log('Error in training discriminator')
        console.log(e.stack)
    }
}


async function train(XTrain, yTrain, pastY, epochs, time_step, look_ahead, feature_size, batchSize) {
    const t = createTimer('GAN model training')
    t.startTimer()
    // Define the optimizer for both discriminator and generator
    // const gOptimizer = tf.train.adam(0.0001, 0.5, 0.9);
    // const dOptimizer = tf.train.adam(0.0004, 0.5, 0.9)
    const weight_initializers = tf.initializers.randomNormal({ mean: 0.0, stddev: 0.02 })
    const generator_ = generator({ input_dimension: time_step, output_dimension: look_ahead, feature_size, weight_initializers })
    const discriminator_ = discriminator({ timeStep: time_step, lookAhead: look_ahead, weight_initializers })

    const trainHist = {
        losses: [],
        D_losses: [],
        G_losses: [],
        per_epoch_times: [],
        total_ptime: []
    };
    let Real_price
    let Generated_price
    let preds = []

    const xTrainTensor = tf.tensor(XTrain);
    const yTrainTensor = tf.tensor(yTrain);
    const pastYTrainTensor = tf.tensor(pastY); // 27
    const data = [xTrainTensor, yTrainTensor, pastYTrainTensor];
    for (let epoch = 0; epoch < epochs; epoch++) {

        console.log('Gene weights 1st layer', generator_.getWeights(true)[0].arraySync()[0][0][0])
        console.log('Disc weights 1st layer', discriminator_.getWeights(true)[0].arraySync()[0][0][0])

        const {
            generatorData_,
            discriminatorLoss,
            generatorLoss,
            g_mse
        } = await trainStep(data, time_step, look_ahead, generator_, discriminator_);

        console.log('Generator Loss : ', generatorLoss, 'Discriminator Loss : ', discriminatorLoss)
        // @ts-ignore
        trainHist.losses.push({
            d_loss: discriminatorLoss,
            g_loss: generatorLoss,
            mse: g_mse,
            epoch: epoch + 1
        })
        // @ts-ignore
        trainHist.D_losses.push(discriminatorLoss);
        // @ts-ignore
        trainHist.G_losses.push(generatorLoss);
        Real_price = yTrain
        // @ts-ignore
        Generated_price = generatorData_.arraySync()

        tf.dispose([generatorData_])
        // Save the model every 100 epochs
        /* if ((epoch + 1) % 100 === 0) {
            // await generator.save(`gen_model_${epoch + 1}.json`);
            console.log('epoch', epoch + 1, 'discriminator_loss', discriminatorLoss.dataSync(), 'generator_loss', generatorLoss.dataSync());
        } */

        // @ts-ignore
        // trainHist.per_epoch_times.push(perEpochPtime);
        log.error(`Epoch ${epoch + 1} of ${epochs}, G_loss: ${generatorLoss}, D_loss: ${discriminatorLoss}`);
    }

    t.stopTimer(__filename.slice(__dirname.length + 1))
    // console.log(Real_price[0], Generated_price[0])
    for (let i = 0; i < Real_price.length; i++) {
        preds.push({ real: parseFloat(Real_price[i][0].toFixed(8)), generated: parseFloat(Generated_price[i][14][0].toFixed(8)), epoch: i + 1 })
    }
    generator_.dispose()
    discriminator_.dispose()
    tf.dispose([xTrainTensor, yTrainTensor, pastYTrainTensor])

    const formattedTime = t.calculateTime()
    console.log(`Training completed in ${formattedTime}`)

    // Return the training history
    return [trainHist, preds, Generated_price];
}

module.exports = {
    train,
}