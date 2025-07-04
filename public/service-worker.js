// Copilot give me tensorflow
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.0/dist/tf.min.js")

self.addEventListener("push", (event) => {
  console.log(this.tf);

  let notification = event.data.json();
  self.registration.showNotification(notification.title, notification.options);

  // Ask server for model
  fetch("/epoch_model")
    .then((response) => {
      // Parse the response
      return response.json();
    })
    .then((json) => {
      // Here you have the model
      model = json
    
      // Train with model on local data using tfjs
      // How to train with tfjs: https://js.tensorflow.org/tutorials/core-concepts.html

      // This next piece of code should run after you have finished training
      // It will send the model back to the server
      fetch("/epoch_model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client: notification.options.body,
          model: json,
        }),
      })
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          console.log("Model sent to server");
        })
        .catch((json) => {
          console.error("Model not sent");
        });
        // END - AFTER RECIEVING MODEL
    })
    .catch(function (ex) {
      // CATCH - TROUBLE RECEIVEING MODEL
      console.log("parsing failed", ex);
    });
});
