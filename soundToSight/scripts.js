let audioCtx;
let buffer;
let analyzer;
let source;
// let request;

let songLength;
var playing = false;
var file;
var player;

let interval = 100;
let canvas_width = 4 // canvas will be 1/4 of screen width

var frequencyData;
var loopInterval;

var canvas;
var canvas_ctx;
var freq_canvas;
var freq_ctx;

var freq_bars_bool = true;


var minAmp = 75;
var maxAmp = 255;

var row_units = 0;



const FREQ_MAX = 20000;
var displayFrequency = true;

var loop_i=0;
var loop_x=0;
var loop_y=0;

var currentTime;

var freqRange_min;
var freqRange_max;

var inverseRGB = false;

var colorMethod = 3;

function handleFileSelect(evt) {
    //reset audio buffer
    buffer=null;
    loop_i=0;
    loop_x=0;
    loop_y=0;


    var files = evt.target.files; // FileList object
    file = files[0];

    console.log(files);

}

function playFile() {
    var freader = new FileReader();

    freader.onload = function (e) {        
        player.src = e.target.result;
    };
    freader.readAsDataURL(file); 
     
}

// aync allows the buffer to load
async function getFile(){
    // const response = await fetch("symph7.mp3");

    // audioCtx = new AudioContext();
    console.log("getting file..");
    const response = await file;
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    songLength = audioBuffer.duration * 1000;
    return audioBuffer;
}

async function loadData(){
    if(buffer==null){
        try{
            console.log("loading..");
        
            //create audio context -> controls both creation of nodes it contains and exc of audio processing
            audioCtx = new AudioContext();
            //create audio source -> from the player element
            // source = audioCtx.createMediaElementSource(player);
            
            // AWAIT IS KEY
            // it takes time for the song to be loaded into buffer
            // await stops the code from anaylzing before buffer is loaded
            buffer = await getFile();
           
            // //create analyser -> a node that is able to provide fq analysis info in real time
            analyzer = audioCtx.createAnalyser();


            }
        catch(e){
                console.log("already loaded bitch");
                return false;
        }
    }
    return true;

}

function startBufferAtTime(time){
    source = audioCtx.createBufferSource();
    source.buffer = buffer;
    if(!playing){
        source.connect(audioCtx.destination);
    }
    
    source.connect(analyzer);
    source.start(0,time);
    // console.log("start Buffer");

}

async function loop(time,interval){


    loopInterval = setInterval(async function(){
        
        if(loop_i>=time){
            clearInterval(loopInterval);
        }
        else{            
            var color = await analyze();
            paint(color,loop_x,loop_y);
            loop_x++;
            if(loop_x>row_units){
                loop_x = 0;
                loop_y++;
            }
            
            loop_i = loop_i+interval;

        }

    },interval);
}

async function fastLoop(time,interval){
    playing = true;

    while(loop_i<time){
        await startBufferAtTime(loop_i/1000);
        
        var color = await analyze();
        await paint(color,loop_x,loop_y);
        loop_x++;
        if(loop_x>row_units){
            loop_x = 0;
            loop_y++;
        }           
        source.stop();
        loop_i = loop_i+interval;
    }
  
    playing = false;  
}

async function analyze(){
    // The getByteFrequencyData() method of the AnalyserNode interface copies the 
    // current frequency data into a Uint8Array (unsigned byte array) passed into it.

    // The frequency data is composed of integers on a scale from 0 to 255.
    
    // Each item in the array represents the decibel value for a specific frequency. 
    // The frequencies are spread linearly from 0 to 1/2 of the sample rate. 
    // For example, for 48000 sample rate, the last item of the array will represent the decibel value for 24000 Hz
    
    frequencyData = new Uint8Array(analyzer.frequencyBinCount);

    analyzer.getByteFrequencyData(frequencyData);
    var fft = analyzer.fftSize;
    var sampleRate = audioCtx.sampleRate;

    var freq_interval = (sampleRate/2) / (frequencyData.length);
    var frequency = 0;
    var rgb;
    var amp;
    // create a colour
    // go through all frequencies at an instance and combine
    
    var totalRgb = [0,0,0];
    var totalRgbA = [0,0,0,0];
    var i;
    for(i = 1; i < frequencyData.length ; i++){
        amp = frequencyData[i];
        if(amp>=minAmp && amp<=maxAmp){
            // amp = amp-minAmp;
            frequency = i * freq_interval;
            rgb = await getRgb(frequency);
            
            if(colorMethod == 1){
            
                rgba = await rgbWithAlpha(rgb, amp/255);
                totalRgb = addArray(totalRgb,rgba);
                
            }
            else if( colorMethod == 2){
                totalRgbA = addColor_2(totalRgbA,rgb,amp/255);
                // console.log(totalRgbA);
            }
            else if( colorMethod == 3){
               totalRgbA = addColor_3(totalRgbA,rgb,amp/255); 
            }


        }
    }
    // colours were too close to white without "inversing" them
    if (inverseRGB){
        totalRgb = inverseArray(totalRgb);
    }

    //if playing in real time
    //show frequency bars
    if(freq_bars_bool && displayFrequency){
        var drawFreq = function(){
            if(displayFrequency){
                requestAnimationFrame(drawFreq);
            }
            freq_ctx.clearRect(0,0,freq_canvas.width,freq_canvas.height);


            for(i = 1; i < frequencyData.length ; i++){
                amp = frequencyData[i];
                if (amp >0){
                    paintFrequencies(amp,i,frequencyData.length);
                }
            }
            drawAmpLimit();
            drawFreqLimit();
            if(!displayFrequency){
                freq_ctx.clearRect(0,0,freq_canvas.width,freq_canvas.height);
            }
        };
        drawFreq();
    }

    if(colorMethod != 1){
        totalRgb = totalRgbA.slice(0,3);

    }


    return totalRgb;
}
function drawFreqLimit(){
    
   var x_max = (freqRange_max/FREQ_MAX) * freq_canvas.width;
   var x_min = (freqRange_min/FREQ_MAX) * freq_canvas.width; 

   freq_ctx.strokeStyle = "green";
   freq_ctx.beginPath();
   freq_ctx.moveTo(x_min, 0);
   freq_ctx.lineTo(x_min, freq_canvas.height);
   freq_ctx.stroke();

   freq_ctx.strokeStyle = "red";

   freq_ctx.beginPath();
   freq_ctx.moveTo(x_max, 0);
   freq_ctx.lineTo(x_max, freq_canvas.height);
   freq_ctx.stroke();

   freq_ctx.font = "10px Arial";
   freq_ctx.fillStyle = "red";
   freq_ctx.fillText("Max Frequency", x_max-75 , 30);
   
   freq_ctx.fillStyle = "green";
   freq_ctx.fillText("Min Frequency", x_min+5 , 30);
//    freq_ctx.fillText("Min Amplitude", freq_canvas.width-40, y_min+25);

}
function drawAmpLimit(){
    var y_max = (maxAmp / 255) * freq_canvas.height;
    var y_min = (minAmp / 255) * freq_canvas.height;

    y_max = freq_canvas.height-y_max;
    y_min = freq_canvas.height-y_min;

    freq_ctx.strokeStyle = "green";

    freq_ctx.beginPath();
    freq_ctx.moveTo(0, y_max);
    freq_ctx.lineTo(freq_canvas.width, y_max);
    freq_ctx.stroke();

    freq_ctx.strokeStyle = "red";

    freq_ctx.beginPath();
    freq_ctx.moveTo(0, y_min);
    freq_ctx.lineTo(freq_canvas.width, y_min);
    freq_ctx.stroke();


    freq_ctx.font = "10px Arial";
    freq_ctx.fillStyle = "red";

    freq_ctx.fillText("Min Amplitude", freq_canvas.width-80, y_min-15);
    freq_ctx.fillStyle = "green";

    freq_ctx.fillText("Max Amplitude", freq_canvas.width-80, y_max+20);
}
function paintFrequencies(amplitude,bin,length){
    // freq_ctx.clearRect(0,0,freq_canvas.width,freq_canvas.height);
        if(amplitude>=minAmp && amplitude<=maxAmp ){
            freq_ctx.fillStyle = "green";
        }
        else{
            freq_ctx.fillStyle = "red";
        } 
        var x_unit = freq_canvas.width / length;
        var y_unit = freq_canvas.height / 255;
        // console.log(bin*x_unit);

        // var y = (amplitude/255) * 100;
        var y = amplitude;

        freq_ctx.fillRect(bin*x_unit, freq_canvas.height,x_unit, -y * y_unit );
    
}

async function paint(rgb,x,y){
    // console.log("paint ("+x+" "+y+" ("+rgb+")");
    canvas_ctx.fillStyle = "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
    canvas_ctx.fillRect(x*pixelSize,y*pixelSize,pixelSize,pixelSize);

}


//adding color on top in a linear way

// keep adding a new color ON TOP of the total to blend it
// if it was underneath then it would just be covered up as soon as the top colour become opaque
//
// always keep the most opaque colour undereath
// 
function addColor_2(b,t,ta){
    
// To blend using alpha channels, you can use these formulas:

// r = new Color();
// r.A = 1 - (1 - fg.A) * (1 - bg.A);
// if (r.A < 1.0e-6) return r; // Fully transparent -- R,G,B not important
// r.R = fg.R * fg.A / r.A + bg.R * bg.A * (1 - fg.A) / r.A;
// r.G = fg.G * fg.A / r.A + bg.G * bg.A * (1 - fg.A) / r.A;
// r.B = fg.B * fg.A / r.A + bg.B * bg.A * (1 - fg.A) / r.A;
    var colour = [0,0,0,0];
    var a = (1 - (1-ta))*(1-b[3]);
    if(a <= 0 ) return colour; //transparent
    //r
    colour[0] = t[0] * ta / a + b[0] * b[3] * (1-ta) / a;
    //g
    
    colour[1] = t[1] * ta / a + b[1] * b[3] * (1-ta) / a;
    //b
    colour[2] = t[2] * ta / a + b[2] * b[3] * (1-ta) / a;

    colour[3] =a;

    return colour;

}
function addColor_3(b,t,ta){
    // blendColors(c1, c2, t)
    // ret
    // [r, g, b].each n ->
    //     ret[n] = blendColorValue(c1[n], c2[n], t)
    // ret.alpha = blendAlphaValue(c1.alpha, c2.alpha, t)
    // return ret
// blendColorValue(a, b, t)
// return sqrt((1 - t) * a^2 + t * b^2)

    
    var blendingCo = ta;
    // console.log(blendingCo);
    var r= blendColorValue(b[0],t[0],blendingCo);
    var g= blendColorValue(b[1],t[1],blendingCo);
    var b= blendColorValue(b[2],t[2],blendingCo);
    return [r,g,b,blendingCo];

}
function blendColorValue(a,b,t){
    return Math.sqrt((1-t)*Math.pow(a,2)+t*Math.pow(b,2));
}
function addArray(a1,a2){

    var array = a1.slice();
    for (var i = 0; i<array.length; i++){
        var x = array[i];
        var y = a2[i];
        var tot = x+y;
        if(tot<=255){
            array[i]=tot;
        }
    }

    return array;

}
function inverseArray(a1){
    var array = a1.slice();
    for(var i = 0; i<array.length;i++){
        array[i] = 255-a1[i];
    }
    
    return array;
}
function rgbWithAlpha(rgb, a){
    var rgba = rgb.map(e => e*a);
    
    return rgba;
}
function playButton(player){
    if (file == null){

    }
    if (!playing){
        document.getElementById('play').value = 'Pause';
        analyzer();
    
    }else{
        document.getElementById('play').value = "Play";
    }
    playing =!playing;
    
}

function getColorWaveLength(f){    

    // audible range is ~20-20000hz
    // how ever higher frequencies are rarely heard
    // so you get a better range of colours if you make the range of sound frequencies you are mapping from smaller 

    //light frequency in tHz. sound mapped from ~20-20000hz -> 400-800tHz
    var lightFrequency = 400;

    if( f > freqRange_min){
        lightFrequency = ((f/freqRange_max) + 1)*400;
    }

    
    //speed of light * 1000m/s
    var SoL = 299792;
    //  sol (1000 m/s) / tHz ( 1/1000000000000) = nm (E-9)
    var wavelength = SoL/lightFrequency;

    // wave length range between 374.74 and 749.48

    return wavelength;

}

//wavelength to rgb value
//http://www.physics.sfasu.edu/astro/color/spectra.html
async function getRgb(f){
 
    var wl = getColorWaveLength(f);
    var r = 0;
    var g = 0;
    var b = 0;
    if(wl >= 370 && wl < 440){
		r = -255 * (wl-440)/(60);
		g = 0;
		b = 255;
	}
	else if ( wl >= 440 && wl < 490 ){
        // console.log(1);

        r = 0;
		g = 255*(wl-440)/(50);
		b = 255;
	}
	else if(wl >= 490 && wl < 510){
        // console.log(2);

        r = 0;
		g = 255;
		b = -255*(wl-510)/(20);
	}
	else if(wl>=510 && wl< 580){
        // console.log(3);

        r = 255*(wl - 510)/(70);
		g = 255;
		b = 0;
	}
	else if(wl >= 580 && wl < 645){
        // console.log(4);

		r = 255;
		g = -255*(wl-645)/65;
		b = 0;
	}
	else{ //645 - 780
        // console.log(5);

		r = 255;
		g = 0;
		b  = -255*(wl-780)/135;
	}
	return [Math.round(r),Math.round(g),Math.round(b)];
}


function resetCanvas(){
    loop_i=0;
    loop_x=0;
    loop_y=0;
}
function displayFreq(){
    console.log("display freq "+displayFrequency);
    displayFrequency = !displayFrequency;
}
function changeMinAmp(){
    minAmp = document.getElementById("minAmp").value;
    if (parseInt(minAmp)> parseInt(maxAmp)){
        minAmp = maxAmp;
        document.getElementById("minAmp").value = minAmp;
    }
}
function changeMaxAmp(){
    maxAmp= document.getElementById("maxAmp").value;
    if (parseInt(maxAmp)<parseInt(minAmp)){
        maxAmp = minAmp;
        document.getElementById("maxAmp").value = maxAmp;
    }
}
function changeMaxFreq(){
    freqRange_max = document.getElementById("maxFreq").value;
    if( parseInt(freqRange_max) < parseInt(freqRange_min)){
        freqRange_max = freqRange_min;
        document.getElementById("maxFreq").value = freqRange_max;
    }
}
function changeMinFreq(){
    freqRange_min = document.getElementById("minFreq").value;
    console.log(freqRange_min + " min");
    console.log(freqRange_max + " max");
    
    if( parseInt(freqRange_min) > parseInt(freqRange_max)){
        
        freqRange_min = freqRange_max;
        document.getElementById("minFreq").value = freqRange_min;
    }
}
function changeInt(){
    interval = parseInt(document.getElementById("interval").value) ;
}
function changeColorMethod(){
    colorMethod = document.getElementById("add").value;

}
async function setUpCanvas(sl){
    changeInt();

    row_units = Math.sqrt(sl/interval);
    
    var w = screen.width/canvas_width;    
    pixelSize = w/row_units;
    canvas.width = w;
    canvas.height = w;

    changeMinAmp();
    changeMaxAmp();
    changeMaxFreq();
    changeMinFreq();

    setUpFreqCanvas();

}

function setUpFreqCanvas(){
    try{
    freq_canvas.width = document.getElementById("input_container").offsetWidth;
    freq_canvas.border
    }catch(e){

    }
}

window.onload = function setListner(){

    player = document.getElementById('player');
    canvas = document.getElementById('myCanvas');
    canvas_ctx = canvas.getContext("2d");
    freq_canvas = document.getElementById('freqCanvas');
    freq_ctx = freq_canvas.getContext("2d");
    freq_bars_bool = true;

    document.getElementById('files').addEventListener('change', handleFileSelect, false);
    
    document.getElementById('instant').onclick = async function(){
        colorMethod = document.getElementById("add").value;

        freq_bars_bool= false;
        var loading_msg =document.getElementById("loading");
        loading_msg.innerHTML="Loading...";

        var loaded = await loadData();
        console.log(loaded);
        if (loaded){

            resetCanvas();
            await setUpCanvas(songLength);

            await fastLoop(songLength,interval);
            resetCanvas();

        }
        loading_msg.innerHTML="Done.";
    }

    document.getElementById('play').onclick = async function(){
        colorMethod = document.getElementById("add").value;
        if(!playing){
            var loaded = await loadData();
            if(loaded){
                console.log(loop_i);

                if(loop_x==0){
                    setUpCanvas(songLength);
                }

                console.log(loop_i/1000);
                startBufferAtTime(loop_i/1000);
                loop(songLength,interval);
                
                document.getElementById('play').value = "pause";
            }
            else{
                playing = !playing
            }

        
        }else{
            source.stop();
            clearInterval(loopInterval);         
            document.getElementById('play').value = "play";
            // freq_bars_bool= false;
            
        }
        playing = !playing;

    }

}
window.addEventListener('resize', setUpFreqCanvas);

// window.onresize = setUpFreqCanvas();