


/* 				Dibujar el espectro y la forma de onda		*/

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

