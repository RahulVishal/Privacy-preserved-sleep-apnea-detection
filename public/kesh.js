//import { google } from 'googleapis';// Load the Google API Client Library for JavaScript

var client;

async function config_google(label, callback, id) {
  console.log("Kesh's config_google");
  console.log(callback);
  var SCOPES = ['https://www.googleapis.com/auth/fitness.activity.read', 'https://www.googleapis.com/auth/fitness.heart_rate.read', 'https://www.googleapis.com/auth/fitness.oxygen_saturation.read', 'https://www.googleapis.com/auth/fitness.body.read'];
  var data = [];
  client = await google.accounts.oauth2.initTokenClient({
    client_id: '390511911431-o9jlj8ch6lt8l3agqk14va5561d0ohjt.apps.googleusercontent.com',
    scope: SCOPES.join(' '),
    callback: ratCallback
  });

  async function ratCallback(response) {
    console.log(response);
    // Save the access token
    sessionStorage.setItem('access_token', response.access_token);
    // Signed in to user data

    // Get the three data sources we want
    // 1. Heart Rate
    // 2. Sp02
    // 3. BMI

    // Get the data for each of the three data sources
    var heartRate = await data_of_type('derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm', response.access_token);
    //var sp02 = await data_of_type('derived:com.google.oxygen_saturation:com.google.android.gms:merge_oxygen_saturation', response.access_token);
    //var bmi = await data_of_type('derived:com.google.body.mass_index:com.google.android.gms:merge_body_mass_index', response.access_token);
    var steps = await data_of_type('derived:com.google.step_count.delta:com.google.android.gms:estimated_steps', response.access_token);
    var height = await data2('raw:com.google.height:com.google.android.apps.fitness:user_input', response.access_token);
    var weight = await data2('raw:com.google.weight:com.google.android.apps.fitness:user_input', response.access_token);

    //console.log(heartRate);
    //console.log(steps);

    //iterate through the heartrate array
    //for each element, find the matching element in the steps array such that the time is the same
    //if there is a match, add the value of the steps element to the heartrate element
    //return the new array

    var bmi = (weight / (height * height));
    for (var i = 0; i < heartRate.length; i++) {
      for (var j = 0; j < steps.length; j++) {
        //for(var k = 0; k < bmi.length; k++){
        if (heartRate[i].time == steps[j].time) {
          heartRate[i].steps = steps[j].value;
          heartRate[i].bmi = bmi;
          //heartRate[i].steps = bmi[k].value;
        }
      }
    }
    console.log(heartRate);
    data.push(heartRate);

    // Done, call model
    callback(id, data, label);
  }

  console.log("Kesh's config_google done");
  // Check if we have previously saved a token
  // FIXME: Set condition to false if the token is expired
  var access_token = sessionStorage.getItem('access_token');

  if (access_token) {
    ratCallback({ access_token: access_token });
  } else {
    client.requestAccessToken();
  }
}

async function data2(dataSourceId, access_token) {
  // type - url scope of data to be acquired
  // returns - array of time series data - [{time: , value: }, ...]
  console.log("Getting data of type: " + dataSourceId);
  return fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate?access_token=' + access_token, {
    method: 'POST',
    body: JSON.stringify({
      "aggregateBy": [{
        "dataSourceId": dataSourceId
      }],
      "bucketByTime": { "durationMillis": (86400000) },
      "startTimeMillis": 1678801197674,
      "endTimeMillis": 1680616497170
    }),
    type: 'text/csv'
  }).then((response) => {
    // Parse the response as JSON
    return response.json();
  }).then((data) => {
    // console.log("Data acquired");
    // console.log(data.bucket[0].startTimeMillis);
    // console.log(data.bucket[0].dataset[0]);
    // console.log(data.bucket[0].dataset[0].point);
    // console.log(data.bucket[0].dataset[0].point[0].value);

    // var tsd = data.bucket.map((d) => {
    //   if (d.dataset[0].point.length) { return { time: Math.floor(d.startTimeMillis / 100000), value: 50 } }
    //   return {
    //     time: Math.floor(d.startTimeMillis / 100000),
    //     // Sometimes it is fpval, sometimes intVal, how to handle?
    //     // answer: check if fpval exists, if not, use intVal
    //     value: d.dataset[0].point[0].value[0].fpVal ? d.dataset[0].point[0].value[0].fpVal : d.dataset[0].point[0].value[0].intVal
    //   }
    // })
    var tsd;

    for(i=0; i<data.bucket.length; i++){
      if (data.bucket[i].dataset[0].point.length){
        tsd = data.bucket[i].dataset[0].point[0].value[0].fpVal;
      }
    }
    console.log("Parsed");
    return tsd;
  });
}

async function data_of_type(dataSourceId, access_token) {
  // type - url scope of data to be acquired
  // returns - array of time series data - [{time: , value: }, ...]
  console.log("Getting data of type: " + dataSourceId);
  return fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate?access_token=' + access_token, {
    method: 'POST',
    body: JSON.stringify({
      "aggregateBy": [{
        "dataSourceId": dataSourceId
      }],
      "bucketByTime": { "durationMillis": (86400000 / 24) },
      "startTimeMillis": Date.now() - 86400000,
      "endTimeMillis": Date.now()
    }),
    type: 'text/csv'
  }).then((response) => {
    // Parse the response as JSON
    return response.json();
  }).then((data) => {
    // console.log("Data acquired");
    // console.log(data.bucket[0].startTimeMillis);
    // console.log(data.bucket[0].dataset[0]);
    // console.log(data.bucket[0].dataset[0].point);
    // console.log(data.bucket[0].dataset[0].point[0].value);

    var tsd = data.bucket.map((d) => {
      if (!d.dataset[0].point.length) { return { time: Math.floor(d.startTimeMillis / 100000), value: 50 } }
      return {
        time: Math.floor(d.startTimeMillis / 100000),
        // Sometimes it is fpval, sometimes intVal, how to handle?
        // answer: check if fpval exists, if not, use intVal
        value: d.dataset[0].point[0].value[0].fpVal ? d.dataset[0].point[0].value[0].fpVal : d.dataset[0].point[0].value[0].intVal
      }
    })
    console.log("Parsed");
    return tsd;
  });
}
