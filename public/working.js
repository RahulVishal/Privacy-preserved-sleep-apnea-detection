async function train(id, data, label) {
  console.log('training...');
  data = data[0];
  //console.log(data);
  // Get model from server
  model = await tf.loadLayersModel('/model.json' );
  const optimizer = tf.train.adam();
  const loss = 'binaryCrossentropy';
  label == 'control' ? label = 0 : label = 1;
  // Compile the model with the optimizer and loss function
  model.compile({ optimizer, loss });

  var x1 = [], x2 = [], x3 = [];
  
  //print the weight of the model
  console.log("old weights: ")
  for (let i = 0; i < model.getWeights().length; i++) {
    console.log(model.getWeights()[i].dataSync());
    x1[i] = model.getWeights()[i].dataSync();
}
  //iterate through data and add the value of label to the end of each array
  for (var i = 0; i < data.length; i++) {
    data[i].label = label;
  }
  //console.log(data.summary());
  const csvDataset = tf.data.array(data,
    {
      columnConfigs: {
        sleep_apnea: {
          isLabel: true
        }
      }
    });
  

  //const numOfFeatures = (await csvDataset.columnNames());
  //console.log(numOfFeatures);
  const dataset = csvDataset.map((a) => {
    //console.log(a);
    return { xs: [a.time-16810000, a.value, a.steps, a.bmi], ys: [a.label] };
  });
  console.log("dat:");
  console.table(await dataset.toArray());
  //log hello to the console
  const inputs = (await dataset.toArray()).map(a => a.xs);
  const outputs = (await dataset.toArray()).map(a => a.ys[0]);
  console.log(outputs);
  console.log(inputs);


  // Normalize the input data to have zero mean and unit variance
  //const flattenData = inputs.flat();
  const flattenData = inputs.reduce((acc, val) => acc.concat(val), []);
  const mean = flattenData.reduce((acc, val) => acc + val, 0) / flattenData.length;
  const variance = flattenData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / flattenData.length;
  const normalizedData = inputs.map(sequence =>
    sequence.map(value => (value - mean) / Math.sqrt(variance))
  );

  //print mean,variance,normalizedData
  console.log(mean);
  console.log(variance);
  console.log(normalizedData);


  // Split the input and output data into sequences of length 3
  const sequenceLength = 3;
  const numSequences = Math.floor(normalizedData.length / sequenceLength);
  const truncatedInput = normalizedData.slice(0, numSequences * sequenceLength);
  const trainData1 = tf.tensor3d(
    Array.from({ length: numSequences }, (_, i) => truncatedInput.slice(i * sequenceLength, (i + 1) * sequenceLength))
  );
  console.log(trainData1.shape);
  const truncatedOutput = outputs.slice(0, numSequences * sequenceLength);
  const trainLabels = tf.tensor2d(
    Array.from({ length: numSequences }, (_, i) => [truncatedOutput[(i + 1) * sequenceLength - 1]])
  );
  console.log(trainLabels.shape);
  trainData1.print();
  const trainData = tf.reshape(trainData1,[8,6,2]);
  // Train the model with input data and labels
  console.log("Printing the loss function");
  // await model.fit(trainData, trainLabels,  {epochs: 10} , 
  //   {callbacks: {
  //     onEpochEnd: (epoch, logs) => {
  //       console.log(`Printing loss`);
  //     }
  //   }});
  const fitConfig = {
    epochs: 10,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
      }
    }
  };
  
  model.fit(trainData, trainLabels, fitConfig);
  //await model.fit(trainData, trainLabels, { epochs: 10 });

  // Make predictions with the trained model
  const testData1 = tf.tensor3d([[[16807835, 88, 200, 22]]]);
  const testData = tf.reshape(testData1,[1,2,2]);
  console.log(testData.shape);
  const predictions = model.predict(testData);
  predictions.print();
  await model.save(tf.io.browserHTTPRequest(
    '/getbackdata?' + new URLSearchParams({ id: id }),
    { method: 'POST' }));
    for (let i = 0; i < model.getWeights().length; i++) {
      console.log(model.getWeights()[i].dataSync());
      x2[i] = (model.getWeights())[i].dataSync();
    }

    for (let i = 0; i < model.getWeights().length; i++) {
      for(let j = 0; j < x2[i].length; j++){
        //console.log(x2[i][j] - x1[i][j]);
      }
    }
  return model;// print the predicted output values
}

async function initModel(id) {
  console.log("init model");
  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 64, // number of LSTM cells
    inputShape: [null,4], // input shape (null represents variable-length sequences)
  }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // output layer

  // Define the optimizer and loss function for training the model
  const optimizer = tf.train.adam();
  const loss = 'binaryCrossentropy';

  // Compile the model with the optimizer and loss function
  model.compile({ optimizer, loss });
  
  await model.save(tf.io.browserHTTPRequest(
    '/getbackdata?' + new URLSearchParams({ id: id }),
    { method: 'POST' }));
  return model;
}
