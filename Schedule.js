//https://stackoverflow.com/questions/28440262/web-audio-api-for-live-streaming/62870119#62870119
//https://sonoport.github.io/web-audio-clock.html (muy buena explicacion)
//https://www.html5rocks.com/en/tutorials/audio/scheduling/ (no entendi mucho)

/*			Schedule e interfaz grafica  	*/


let durSamp = 256.0;
let durTiempo = durSamp/sr;
let callInterval = 2000.0* durTiempo;//ms
let buffTemp = [];
for (var i = 0; i < durSamp; i++) 	buffTemp.push(0.);
const  nbuffers = Math.floor(callInterval/1000.0/durTiempo) +1; //La cantidad de buffers que necesito
console.log('Duración de un buffer:' + durTiempo.toString() + 's');
console.log('Sample Rate:' + sr.toString());
console.log('Buffers por stream:' +nbuffers.toString());
console.log('Stream Period:' + callInterval.toString() + 'ms');



/* Variables globales	*/

let processId="";
ti=0.;
let ultimoTiempo =0.;



/* Scheduler!!	*/

/*La joda acá es que tengo osciladores con KPS
La forma izi pizi que decidí ahora es solo generar buffers del tamaño de un periodo de nota
y reproducirlos uno atrás de otro. 
No me parece conveniente generar "la misma cantidad de buffers" a la vez para cada oscilador. O sea, me parece mejor que los bufsizes de cada KPS contengan un numero entero de ciclos
Lo que cambiaria entonces es que de una sola llamada genere, digamos 10 ciclos de la nota
Seria preferible eso

*/

function stream(){

	if(!reproduciendo) return;

	if(Fuente3.on)
		while(Fuente3.queuedBufs < 1 || context.currentTime +0.1 > Fuente3.finUltimo){

		Fuente3.siguienteCiclo();
		Fuente3.start(Fuente3.finUltimo);
		Fuente3.finUltimo+=Fuente3.p/sr;
		}
	

		  //Si tengo más de un oscilador, esto lo hago con un for
		  if(Fuente1.on) 
		  	while(Fuente1.queuedBufs < 3 || context.currentTime + 0.125 > Fuente1.finUltimo)
		  	{
		  		//crearBuffer(Fuente1);
		  		[buff, phi1] = crearBufferSenoidal(freqSlider1.value, phi1);
		  		interpolado= interpolarIdeal(buff);
		  		Fuente1.cargarBuffers([buff]);
		  		Fuente1.start(Fuente1.finUltimo);
		  		Fuente1.finUltimo += interpolado.length/sr;
		  	}

		  	if(Fuente2.on)

		  		while(Fuente2.queuedBufs < 3 || context.currentTime +0.125 > Fuente2.finUltimo){

			  		buffer2  = crearBuffer(Fuente2);
			  		Fuente2.cargarBuffers(buffer2);
			  		Fuente2.start(Fuente2.finUltimo);
		  			Fuente2.finUltimo +=durSamp/sr; //esto tambien puede ir aparte
		  		}
		
	//console.log('Ultimo buffer scheduled para t=' + (finUltimo).toString() +'s' );

}




