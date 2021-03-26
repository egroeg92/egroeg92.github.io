let repTime =0;
let restTime =0;
let setNumber=0;

let count_down = 10;
let running = true;

async function start(){
    if(running){
        running = false;
        repTime = parseInt(document.getElementById("repT").value);
        setNumber = parseInt(document.getElementById("set").value);
        restTime = parseInt(document.getElementById("restT").value);
        
        let preamble = document.getElementById("preamble");
        let counter = document.getElementById("counter");
        preamble.innerHTML = "Start in: "
        preamble.style.visibility = "visible";
            
        counter.style.visibility = "visible";
        
        // var c = 5; 
        counter.innerHTML = count_down;

        var result = await countDown(count_down-1, counter);
        preamble.style.visibility="hidden";
        
        var done = await workOut(counter);
        counter.innerHTML ="DONE";
        running = true;
    }
}

async function workOut(){
    var currentSet = 1;
    
    preamble.innerHTML = "Set : "+(currentSet);
    preamble.style.visibility="visible";
    


    while(currentSet != (setNumber+1)){

        preamble.innerHTML= "Set : "+(currentSet);
        counter.innerHTML = repTime;
        await countDown(repTime-1,counter);
          currentSet++;
        
          if(currentSet== setNumber+1){
              break;
          }

        preamble.innerHTML ="Rest";
        counter.innerHTML =restTime;
        await countDown(restTime-1,counter);

 
    }

    return "done";
}

function countDown(start,html){
    return new Promise(reslove =>{
        var end = start-1;
        var timer = setInterval(function(){
            html.innerHTML = start;
            var n = start - 1;
            start = n;
            if(start == -1){
                clearInterval(timer);
                reslove('');
            }
        }, 1000);
    });
}