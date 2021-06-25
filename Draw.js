

/*					Sliders y knobs				*/
var freqSlider1 = document.getElementById('freqSlider1');
var freqSliderReading1=document.getElementById('freqTxt1');
var freqSlider2 = document.getElementById('freqSlider2');
var freqSliderReading2=document.getElementById('freqTxt2');
var aSlider = document.getElementById('a');
var aReading = document.getElementById('aTxt');
var gainKnobElem = document.getElementById('gainKnob');
var gainKnobReading = document.getElementById('gainTxt');
var on1Elem = document.getElementById('On1');
var on2Elem = document.getElementById('On2');
let playButton = document.querySelector("#play1");

freqSlider1.oninput = function() { freqSliderReading1.innerHTML = this.value; try {Fuente1.freq= this.value;} catch {}}
freqSlider2.oninput = function() { freqSliderReading2.innerHTML = this.value; try {Fuente2.freq= this.value;} catch {}}
gainKnob.oninput = function()    { gainKnobReading.innerHTML    = this.value; gain = this.value;}
on1Elem.oninput = function()     { Fuente1.on= !Fuente1.on; Fuente1.finUltimo = context.currentTime;}
on2Elem.oninput = function()     { Fuente2.on= !Fuente2.on; Fuente2.finUltimo = context.currentTime;}


/*							FUENTE 3 			*/


var freqSlider3 = document.getElementById('freqSlider3');
var freqSliderReading3=document.getElementById('freqTxt3');
freqSlider3.oninput = function() { 
	freqSliderReading3.innerHTML = this.value; 
	try {
		Fuente3.freq= this.value;
		
		//un buffer de p samples da una onda de periodo p+1/2 samples
		//Por ejemplo: buffers de 2 samples a 48khz me genera un tono de 19200Hz, y no uno de 24.000!! 



		//periodo: p+ 1/(2S)     
		//Frec = sr/(p+ 1/(2S))
		//  frec.(p +1/(2S))=sr
		// --> p = sr/frec -1/(2S)  en samples
		Fuente3.bufsize= Math.round(sr/(this.value-0.5*Fuente3.sinv));


		//Llevando la afinación más allá:
		//pongamos S= k/p -->   periodo = p+ 0.5/S = p+0.5kp = p(1+k/2)
		//p es el tamaño del buffer de delay
		//  p(1+k/2) es el periodo resultante de la onda
		//--> Frecuencia = (p(1+k/2)^-1    (falta sr)

		//Si quiero que suene la frecuencia F entonces, tengo que setear... p y S

		document.getElementById('bufSize3').innerHTML=Fuente3.bufsize;
		showFreqReal3();
		if(document.getElementById('autoSButton').checked) setFreqReal3();
	} 

	catch {}
}

document.getElementById('autoSButton').oninput = function() {setFreqReal3();}

function showFreqReal3(){
	document.getElementById('freqReal3').innerHTML=sr/(Fuente3.bufsize+ 0.5*Fuente3.sinv);
}
function setFreqReal3(){
	// S= k/p
	//Frecuencia = (p(1+k/2)^-1)
	//-->1/Frec = p(1+k/2)
	// 2/(Frec.p)-2 = k
	//pS = 2/(Frec.p)-2
	// S = 2/(frec.p^2)-2/p

	//o: p = sr/frec -1/(2S)
	//   1/2S = sr/frec-p
	// 2S = (sr/frec-p)^-1
	//Una de las dos es correcta


	console.log(0.5/(sr/Fuente3.freq-Fuente3.bufsize));
	sSlider.value= 0.5/(Math.abs(sr/Fuente3.freq-Fuente3.bufsize));
	sSlider.oninput();
	showFreqReal3();
}



var on3Elem = document.getElementById('On3');
on3Elem.oninput = function()     { Fuente3.on= !Fuente3.on; Fuente3.finUltimo = context.currentTime;}


/*							VIBRATO 			*/
var vibratoSlider = document.getElementById('vibSlider');
var vibratoTxt = document.getElementById('vibTxt');
var onVibrato  = document.getElementById('onVib');
onVibrato.oninput = function() { Fuente3.vibratoOn = !Fuente3.vibratoOn;}
vibratoSlider.oninput = function (){
	vibratoTxt.innerHTML = this.value.toString() + '%';
	Fuente3.maxVibAmt = this.value/100;
	Fuente3.vibSlope = Fuente3.vibRate*Fuente3.maxVibAmt*4/sr; 

}
var vibratoSliderHz = document.getElementById('vibSliderHz');
var vibratoTxtHz = document.getElementById('vibTxtHz');
vibratoSliderHz.oninput = function (){
	vibratoTxtHz.innerHTML = this.value.toString() + 'Hz';
	Fuente3.vibRate = this.value;

	//Vibrato
	Fuente3.vibSlope = Fuente3.vibRate*Fuente3.maxVibAmt*4/sr; 

}


/*							BLEND  			*/
var bSlider = document.getElementById('bSlider');
var bTxt    = document.getElementById('bTxt');
bSlider.oninput = function (){
	bTxt.innerHTML = this.value;
	Fuente3.b = this.value;
}


/*							STRETCH 			*/
var sSlider = document.getElementById('sSlider');
var sTxt    = document.getElementById('sTxt');
sSlider.oninput = function (){
	sTxt.innerHTML = this.value;
	Fuente3.sinv = 1/this.value;
	Fuente3.bufsize= Math.round(sr/(Fuente3.freq-0.5*Fuente3.sinv));
	document.getElementById('bufSize3').innerHTML=Fuente3.bufsize;
	showFreqReal3();
}

/*							Copias del wavetable 			*/
var cKnob = document.getElementById('cKnob');
var cTxt    = document.getElementById('cTxt');
cKnob.oninput = function (){
	cTxt.innerHTML = this.value;
	Fuente3.copies = this.value ;
}




/*					Relacion de Recurrencia			*/
function cambiarRelacionRecurrencia(){
  var lista  = document.getElementById('formula');
  var rel = lista.options[formula.selectedIndex].value;
  Fuente3.relRecurrencia = rel;

}




/*							ENCENDER 			*/


Fuente1.on   = on1Elem.checked;
Fuente2.on   = on2Elem.checked;
Fuente3.on   = on3Elem.checked;
Fuente3.vibratoOn   = onVibrato.checked;

/*					play 				*/


playButton.addEventListener("click", function() {

try {Fuente1} 
catch{
	Fuente1= new AudioSource(1);
	Fuente2= new AudioSource(1);
	Fuente3= new AudioSource(1);
	Fuente1.freq = freqSlider1.value;
	Fuente2.freq = freqSlider1.value;
	Fuente1.on   = on1Elem.checked;
	Fuente2.on   = on2Elem.checked;
	Fuente3.on   = on3Elem.checked;

}

  if(reproduciendo) return;
  ti = context.currentTime;
  reproduciendo = true;
  Fuente1.finUltimo = context.currentTime;
  Fuente2.finUltimo = context.currentTime;
  Fuente3.finUltimo = context.currentTime;
  Fuente3.crearBufferRandom();
  processId= setInterval(stream ,callInterval); 
});

				/*				Stop 				*/

let stopButton = document.querySelector("#stop");

stopButton.addEventListener("click", function() {
  if(reproduciendo) ultimoTiempo  = Math.floor(context.currentTime-ti);
  reproduciendo = false;
 // clearInterval(processId);
})


let retBut = document.getElementById('boton3');
function retrigger(){
	Fuente3.crearBufferRandom();
}


/*aSlider.oninput = function()    {

		a= this.value;
		denominador = '';
		if(a>=5) {
			denominador=a-4;
			aReading.innerHTML= '1/' + denominador.toString();
			a= 1/denominador;
		}
		else if(a<5) {
			
			aReading.innerHTML= a.toString();
		}
}*/
//aSlider.oninput();

/*							ESCRIBIR VALORES INICIALES 			*/


freqSlider1.oninput();
freqSlider2.oninput();
freqSlider3.oninput();
vibSlider.oninput();
vibSliderHz.oninput();
gainKnob.oninput();
bSlider.oninput();
sSlider.oninput();
cKnob.oninput();



/* 				Que dibuje el espectro y la forma de onda		*/

let canvas = document.getElementById("audio_visual");
let drawContext=canvas.getContext("2d");
let tiempoElem = document.getElementById('tiempoTxt');
let analyzer = context.createAnalyser();
    analyzer.fftSize = 1024; 
const A0 = canvas.width/7.;
let pausado  =false;
let spectrum = new Uint8Array(analyzer.frequencyBinCount);
let onda     = new Uint8Array(analyzer.frequencyBinCount);
requestAnimationFrame(dibujar); 


function dibujar(timestamp){

	if(reproduciendo) tiempoElem.innerHTML = Math.floor(context.currentTime-ti); //Imprimo cuanto tiempo transcurrió desde que empezó a llamarse este ciclo
	else tiempoElem.innerHTML = ultimoTiempo;
	analyzer.getByteFrequencyData(spectrum); //Le digo que my array "spectrum" es una referencia al actual frame de analisis
	analyzer.getByteTimeDomainData(onda);
	dibujarEspectroOnda();
	requestAnimationFrame(dibujar); //Esta es la forma para que se dibujen los frames siguientes, volviendo a llamar a la funcion
}

drawContext.fillStyle = 'rgb(255,255,255)';
drawContext.lineWidth = 2;
drawContext.strokeStyle = 'rgb(0,0,0)';


function dibujarEspectroOnda(){

	drawContext.clearRect(0,0,canvas.width, canvas.height); 

	let x=0.;

	/*Con rectangulos	*/

	   for(var i = 1; i < spectrum.length; i++) {

    	anchoi = 1.0* A0/ i;
        barHeight = spectrum[i]*canvas.height/255.0;
        drawContext.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        drawContext.fillRect(x,canvas.height,anchoi,-barHeight); //rect

        x += anchoi;
      }

    drawContext.stroke();

	/*   Dibujo la onda */
 	if(pausado) return;
	drawContext.beginPath();
	drawContext.moveTo(0,canvas.height/2);
	anchoi = 1.0*canvas.width / onda.length;
	x=0;
	for (var i = 0; i < onda.length; i++) {
		var y = onda[i]*canvas.height/256;

		drawContext.lineTo(x,y); 
		x+= anchoi;
	}
	
	drawContext.lineTo(canvas.width, canvas.height/2);
	drawContext.stroke();

};

