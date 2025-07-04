async function trainLstmModel(file) {
    const input = [];
    const output = [];
  
    // Read the input data and output labels from the CSV file
    const response = await fetch(file);
    const text = await response.text();
    const rows = text.split('\n').slice(1, -1);
    for (const row of rows) {
      const [time, Heart_Rate, spo2, sleep_apnea] = row.split(',');
      input.push([parseFloat(time), parseFloat(Heart_Rate), parseFloat(spo2)]);
      output.push(parseFloat(sleep_apnea));
    }
  
    // Normalize the input data to have zero mean and unit variance
    const flattenData = input.flat();
    const mean = flattenData.reduce((acc, val) => acc + val, 0) / flattenData.length;
    const variance = flattenData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / flattenData.length;
    const normalizedData = input.map(sequence => 
      sequence.map(value => (value - mean) / Math.sqrt(variance))
    );
  
    // Split the input and output data into sequences of length 3
    const sequenceLength = 3;
    const numSequences = Math.floor(normalizedData.length / sequenceLength);
    const truncatedInput = normalizedData.slice(0, numSequences * sequenceLength);
    const trainData = tf.tensor3d(
      Array.from({ length: numSequences }, (_, i) => truncatedInput.slice(i * sequenceLength, (i + 1) * sequenceLength))
    );
    const truncatedOutput = output.slice(0, numSequences * sequenceLength);
    const trainLabels = tf.tensor2d(
      Array.from({ length: numSequences }, (_, i) => [truncatedOutput[(i + 1) * sequenceLength - 1]])
    );
    trainLabels = trainLabels.reshape([numSequences, sequenceLength, 1]);

    // Define the LSTM model architecture using TensorFlow.js Layers API
    const model = tf.sequential();
    model.add(tf.layers.lstm({
      units: 64, // number of LSTM cells
      inputShape: [null, 3], // input shape (null represents variable-length sequences)
      returnSequences: true 
    }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid'})); // output layer
  
    // Define the optimizer and loss function for training the model
    const optimizer = tf.train.adam();
    const loss = 'binaryCrossentropy';
  
    // Compile the model with the optimizer and loss function
    model.compile({ optimizer, loss });
  
    // Train the model with input data and labels
    await model.fit(trainData, trainLabels, { epochs: 10 });
  
    // Make predictions with the trained model
    const testData = tf.tensor3d([[[17, 118, 88]]]);
    const predictions = model.predict(testData);
    predictions.print(); // print the predicted output values
  }
  