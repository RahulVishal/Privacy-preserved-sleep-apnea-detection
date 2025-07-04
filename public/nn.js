const csv = require('csv-parser');
const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');

const inputData = [];
const outputLabels = [];

// Read the input data and output labels from the CSV file
fs.createReadStream('heart_rate.csv')
  .pipe(csv())
  .on('data', (row) => {
    inputData.push([parseFloat(row.time), parseFloat(row.Heart_Rate), 22, parseFloat(row.spo2)]);
    outputLabels.push(parseFloat(row.sleep_apnea));
  })
  .on('end', () => {
    // Normalize the input data to have zero mean and unit variance
    const flattenData = inputData.flat();
    const mean = flattenData.reduce((acc, val) => acc + val, 0) / flattenData.length;
    const variance = flattenData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / flattenData.length;
    const normalizedData = inputData.map(sequence => 
      sequence.map(value => (value - mean) / Math.sqrt(variance))
    );

    // Convert the input data and output labels to tensors
    const trainData = tf.tensor3d(normalizedData);
    const trainLabels = tf.tensor2d(outputLabels, [outputLabels.length, 1]);

    // Define the LSTM model architecture using TensorFlow.js
    const model = tf.sequential();
    model.add(tf.layers.lstm({
      units: 64, // number of LSTM cells
      inputShape: [null, 4], // input shape (null represents variable-length sequences)
    }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // output layer

    // Define the optimizer and loss function for training the model
    const optimizer = tf.train.adam();
    const loss = 'binaryCrossentropy';

    // Compile the model with the optimizer and loss function
    model.compile({ optimizer, loss });

    // Train the model with input data and labels
    model.fit(trainData, trainLabels, { epochs: 10 })
      .then(() => console.log('Model trained successfully.'));

    // Make predictions with the trained model
    const testData = tf.tensor3d(/* input data to predict on */);
    const predictions = model.predict(testData);
    predictions.print(); // print the predicted output values
  });
