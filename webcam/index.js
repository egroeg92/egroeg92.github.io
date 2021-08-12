//Written by George Macrae 
//using bootstrap 4
//and Handtracking API https://github.com/victordibia/handtrack.js/

const video = document.getElementById("myvideo");
const handimg = document.getElementById("handimage");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
let trackButton = document.getElementById("trackbutton");
let nextImageButton = document.getElementById("nextimagebutton");
let updateNote = document.getElementById("updatenote");

let imgindex = 1
let isVideo = false;
let model = null;

// video.width = 500
// video.height = 400

const modelParams = {
    flipHorizontal: true,   // flip e.g for video  
    maxNumBoxes: 2,        // maximum number of boxes to detect
    iouThreshold: 0.7,      // ioU threshold for non-max suppression
    scoreThreshold: 0.5,    // confidence threshold for predictions.
}

function startVideo() {
  handTrack.startVideo(video).then(function (status) {
        console.log("video started", status);
        if (status) {
            isVideo = true
            runDetection()
        } else {
        }
   });
}

function toggleVideo() {
  if (!isVideo) {
        document.getElementById("trackbutton").innerHTML = "Set Volume and Turn Off Video";
    
        startVideo();
    } else {
        document.getElementById("trackbutton").innerHTML = "Turn On Video and Change Volume";

        handTrack.stopVideo(video)
        isVideo = false;
    }
}

trackButton.addEventListener("click", function(){
    toggleVideo();
});




function runDetection() {
    model.detect(video).then(predictions => {
            var distance = 0;

            // if two hands are detected get the positions of hands, calculate the distance and then set the volume to the distance.
            if (predictions.length == 2){
                
                var hand1 = predictions[0];
                var hand2 = predictions[1];
                
                var hand1Pos = getHandXY(hand1);
                var hand2Pos = getHandXY(hand2);
                
                distance = getDistance(hand1Pos,hand2Pos);
                
                setVolume(distance);
        
        }
        model.renderPredictions(predictions, canvas, context, video);
        if (isVideo) {
            requestAnimationFrame(runDetection);
        }
    });
}
function getHandXY(hand){
        var x = hand[Object.keys(hand)[0]][0];
        
        var y = hand[Object.keys(hand)[0]][1];
        
        return [x,y];
    }
function getDistance(a,b){
    var x = a[0] - b[0];
    var y = a[1] - b[1];
    return (Math.sqrt(x*x + y*y));
}
function runDetectionImage(img) {
    model.detect(img).then(predictions => {
        model.renderPredictions(predictions, canvas, context, img);
    });
}

// Load the model.
handTrack.load(modelParams).then(lmodel => {
    // detect objects in the image.
    model = lmodel;
    updateNote.innerText = "Loaded Model!";
    runDetectionImage(handimg);
    trackButton.disabled = false;
});



function setVolume(distance){
   var control = document.getElementById('vol-control');
    control.value =distance;
}

// Debuggin to not have to click button everytime

//function debugState(){
//    toggleVideo();
//}

//window.onLoad = debugState();
