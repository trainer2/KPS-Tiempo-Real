
/*
				Que hago: Interpolacion de distintas formas de la señal para ver como se altera su espectro

*/

/*								Creamos las variables globales importantes				*/

let context = new (window.AudioContext || window.webkitAudioContext)();

//let gainNode =context.createGain();
//gainNode.connect(context.destination);

const	sr   = 1.0*context.sampleRate;
const TWOPI = 6.28318530718;
const PI = TWOPI/2.0;
let reproduciendo = false;
let on1=true;
let on2=true;
let phi1=0.;
let phi2=0.;
let a=1;
let gain=1.;
/*let interpolar = (buf) => {
	if(di>0) ddc*buf[di-1] + ddf*buf[di]; 
	//else if(df!=d) ddc*buf[dc-1] + ddf*buf[di];
	//else ddf*buf[di];
	else 0;
}
*/
let ultimo=0;
function interpolarLineal(buf) {

	interpolado=[];
	if(a<=1) //Si a es 4, meto tres samples adicionales entre puntos de informacion exacta
	
	for (var j = 0; j < 1/a; j++) interpolado.push(ultimo+(buf[0]-ultimo)*j*a);

	for (var i = 0; i < buf.length-1; i++) {
		for (var j = 0; j < 1/a; j++) {

		interpolado.push((buf[i]+(buf[i+1]-buf[i])*j*a));		

		}
	}
	ultimo = buf[buf.length-1]; //en el siguiente llamado a esta funcion se empieza a cargar (linea 1)

	return interpolado;
}

//Usa sinc Pulses
//O está mal implementada, o el no tener información de tooodos los samples resulta en distorsión (no se si armónica) o aliasing o algo.
//Esto ultimo tiene sentido, porque estoy interpolando la señal "truncada a 0" afuera de un intervalo. Esa señal no puede ser bandlimited. Entonces estoy sintetizando los picos con aliasing, de alguna forma
//Por ejemplo: 0.1Hz interpolado a 0.2Hz agrega un armonico de 12khz
// 4850 interpolado a 2400 agrega un armoico de 21khz (y varios mas en otras franjas)
//ambos ej con sr 48khzs
function interpolarIdeal(buf){

	const pisr  = PI*sr;
	const ts = 1/sr;
	const ia = 1/a;

	interpolado=[];
	for (var i = 0; i < buf.length/a; i++) interpolado.push(.0);
	for (var i = 0; i < buf.length; i++)   interpolado[i/a] = buf[i];

	for (var i = 0; i < buf.length; i++)
			for (var j = 1; j < 1/a; j++){
				
				//Todo eficiencia: Reciclar el calculo de i/a y j*a. Incluso hacerlos sumas

				for(k=0; k<=i; k++) //No le puse el "=" y quedo REE angulosa la priemra vez
				interpolado[i/a+j] += buf[i]*sinc(j*a+(i-k)); //samples anteriores contribuyen a samples futuros
				for(k=buf.length-1; k>i; k--)
					interpolado[i/a+j] +=  buf[k]*sinc(j*a - (k-i)); //samples futuros contribuyen a samples anteriores
				//Todo esto se puede reducir a un unico:for(k=0; k<=bufsize; k++) interpolado[i/a+j] += buf[i]*sinc(j*a+(i-k));
			}

	ultimo = buf[buf.length-1];
	return interpolado;
	/*EJ: a = 1/4
	Tengo lo siguiente : [1,2,3,4]

	Sinc tiene sus ceros cada 1/sr.
	Si quiero interpolar "a" samples, tengo que avanzar de a pasitos
	0, 1/a.sr, 2/a.sr, ... (a-1) /a.sr
	Cada sinc desplazada pasa por un cero entre sample y sample. O sea, tienen offset 1/sr (si son samples futuros, ocurren despues, entonces resto 1/sr)

	sinc'(t) =  sin(PI*sr*t)/PI*sr*t

	Entonces:

	Lo llevo a [1,x, y, z, 2, b,c,d 3,w1, w2, w3,4]

	x= 1* sinc'(1/(4.sr)) + 2*sinc'(1/4.sr - 1/sr) + 3*sinc'(1/4.sr - 2/sr)
	y= 1*sinc'(2/(4.sr))  + 2*sinc'(2/4.sr - 1/sr) + 3*sinc'(2/4.sr - 2/sr)
	z= 1*sinc'(3/(4.sr))  + 2*sinc'(3/4.sr - 1/sr) + 3*sinc'(3/4.sr - 2/sr)

	b= 1* sinc'(1+1/4.sr) + 2*sinc'(1/4.sr) + 3*sinc'(1/4.sr - 2/sr)
-->

	x= 1* sinc'(1/(4.sr)) + 2*sinc'(-3/(4sr)) + 3*sinc'(-5/(4sr))
	c= 1* sinc'(6/(4.sr)) + 2*sinc'(2/(4sr)) + 3*sinc'(-2/(4sr))

	Puedo sacar el factor "sr" porque siempre se va a quedar. Y que quede:
	sinc(t) = sin(PI*t)/Pi*t
	x= 1* sinc'(1/4 + 2*sinc'(-3/4) + 3*sinc'(-5/4)
	c= 1* sinc'(6/4) + 2*sinc'(2/4) + 3*sinc'(-2/4)


	*/
}

//Seria MUCHO mas eficiente precalcular los 1/a valores que vale siempre el numerador y ya.
function sinc(t){
	m=PI*t;
	return Math.sin(m)/m;
}

/*
function interpolar(buf) {
	if(df==d) return buf[di];
	if(di>0) return ddc*buf[di-1] + ddf*buf[di]; 
	else if(df!= d) return ddc*buf[dc-1] + ddf*buf[di];
	return buf[di];
}*/

function crearBuffer(fuente){

	/*		Creo un Buffer para cargarlo con samples 		*/
	fuente.buffers = context.createBuffer(fuente.numChann,			//Stereo
										 durSamp,   //Duracion en samples
										 sr);		//SampleRate

	bufs=[];
	let sinCt= TWOPI*fuente.freq/sr;
	let gain = gainKnob.value;
	gain*=gain;
	for (var i = 0; i < fuente.numChann; i++) {
		bufi = fuente.buffers.getChannelData(i);
		for (var j = 0; j < fuente.buffers.getChannelData(0).length; j++) {
			bufi[j] = Math.sin(fuente.phi)*gain;
			fuente.phi += sinCt;
		}
		bufs.push(bufi);
	}
	return bufs;
}


function crearBufferSenoidal(freq, phi){

	let sinCt= TWOPI*freq/sr;
		for (var j = 0; j < durSamp; j++) {
			buffTemp[j] = Math.sin(phi)*gain;
			phi += sinCt;
		}
	return [buffTemp, phi];
}




/* 				Generador de buffers			*/

class AudioSource{


	constructor(numChann=2){
		this.phi=0.; //Esto iria en class "Oscillator", pero no me voy a poner quisquilloso ahora
		this.freq=0.;
		this.numChann=numChann;
		this.bufsize=512;
		this.finUltimo =context.currentTime;
		this.on=true; //deberia tener un puntero al boton de on. Y bue
		this.queuedBufs=0;
		this.buffers = null;
		this.source  = null;

	}

	cargarBuffers(buffersACargar = []){

		//No se puede asignar getChannelData(i)=buffer ... ese metodo no sirve. Seria mucho mas rapido. LASTIMA!! Me hubiera ahorrado tener que copiar todo cada vez!
	if(buffersACargar != []){

		var len = buffersACargar[0].length;
			/*		Creo un Buffer para cargarlo con samples 		*/
		this.buffers = context.createBuffer(Math.min(this.numChann, buffersACargar.length),			//Stereo
										 len,   //Duracion en samples
										 sr);		//SampleRate

		for (var i = 0; i < Math.min(this.numChann, buffersACargar.length); i++) 
			for (var j = 0; j < len; j++) {
				this.buffers.getChannelData(i)[j] = buffersACargar[i][j];
			}
	}
	this.conectarSalida();
	}

	conectarSalida(){
	/*		Lo ruteo a la salida para que se escuche 		*/
	this.source = context.createBufferSource(); 
	this.source.buffer = this.buffers;
	this.source.connect(context.destination);
	this.source.connect(analyzer);
	this.source.onended = () => { this.queuedBufs--;}
	}


	start(t){this.source.start(t); this.queuedBufs++; }

}


const maxDelaySamps = 5000; 	    //Elijo este valor a ojo
class KPS_Source extends AudioSource{

	constructor(numChann){

		super(numChann); //llama al constructor del parent class primero

		this.p=this.bufsize;			//p y bufsize son intercambiables cuando no hay vibrato. Si hay, p siempre se calcula como offset desde this.bufsize
		this.lastBuffer = Array(maxDelaySamps); //Por ahora solo hago mono
		for(var i=0; i<maxDelaySamps; i++) this.lastBuffer[i]=0.;

		/*		vibrato            */
		this.vibratoOn=false;
		this.maxVibAmt=0.; //Entre 0 y 1
		this.vibAmt=0.; //Current. Entre -1 y 1
		this.vibRate =0; //Frecuencia en Hz
		this.vibSlope =0; //igual que "sinCt".  
		//bufsize --> frecuencia 'f' (para KPS).
		//Amplitud de vibrato: f*maxVibAmt
		//Frecuencia: vibRate. 
		//En sr/vibRate samples voy de -max a -max como triangular (pasando por 0, max, 0)


		this.b =1.; //Blend
		this.sinv =1.; //1/S
		this.copies=1; //copias del wavetable inicial
		this.relRecurrencia =1;

	}

	//Ciclo inicial //
	crearBufferRandom(guardarBuf=true){
		//No tengo en cuenta el vibrato para esta parte
		this.buffers = context.createBuffer(this.numChann,			//Stereo
										 this.bufsize,   //Duracion en samples
										 sr);		//SampleRate

		let lenCiclo = Math.round(this.bufsize/this.copies);
		//Ciclo inicial
		let promedio =0.;
		//for (var c = 0; c < this.numChann; c++) {
		var buf=this.buffers.getChannelData(0);
			for (var i = 0; i < lenCiclo; i++) {
				buf[i] = 2*(Math.random()-0.5) * gain;
				promedio += buf[i];
			}
		
		//Sacar DC Offset
		promedio /= lenCiclo;
		for (var i = 0; i < lenCiclo; i++)  buf[i] -= promedio; 


		//Copias del ciclo inicial (para mayor decay time en agudos)
		//Por ahora mono
		var buf=this.buffers.getChannelData(0);
		for (var c = lenCiclo; c < this.bufsize; c+=lenCiclo) {
			for (var i = 0; i < lenCiclo; i++) {
				buf[c+i] =buf[i];
			}
		}




		if(guardarBuf)  
			for (var i = 0; i < this.bufsize; i++) this.lastBuffer[i] = buf[i]; 

		//Desactivar por optimizacion
		for (var i = this.bufsize; i < this.maxDelaySamps; i++)  this.lastBuffer[i] =0.;  //LLeno de 0's lo restante por si cambio de frecuencia en tiempo real

		this.conectarSalida();
	}

	//Ciclos siguientes //
	siguienteCiclo(){
		this.p= this.bufsize;
		if(this.vibratoOn) this.p+= Math.round(this.bufsize*this.vibAmt);
		this.p=Math.min(this.p, maxDelaySamps);
		this.buffers = context.createBuffer(1,			//Stereo
										 this.p,   //Duracion en samples
										 sr);		//SampleRate

		if(this.relRecurrencia ==1)		    this.promediarUltimoBuffer();
		else if(this.relRecurrencia ==2)	this.promediarVecinos();
		else if(this.relRecurrencia ==3)	this.multiplicativeS();
		else if(this.relRecurrencia ==4)	this.Siegel();
	
		this.conectarSalida();
	}


	promediarUltimoBuffer(){

		var buf=this.buffers.getChannelData(0);
		//Primer sample
		buf[0] = 0.5*(this.lastBuffer[0] + this.lastBuffer[this.p-1]); 

		//Samples restantes

		for (var i = 1; i < this.p; i++){


				//Promedio : Filtro pasabajos
				if(Math.random()<this.sinv)
					buf[i] = 0.5*(this.lastBuffer[i]+this.lastBuffer[i-1]); 
				else buf[i] = this.lastBuffer[i];

				//Parametro b
				if(Math.random()>this.b) buf[i] = -buf[i];

				//Almacenando en delay line
				this.lastBuffer[i-1]=buf[i-1];

				//Vibrato
				this.vibAmt += this.vibSlope;
				if(Math.abs(this.vibAmt) >= this.maxVibAmt) this.vibSlope *=-1;
		}
		this.lastBuffer[this.p-1]=buf[this.p-1];
		return;
	}

	promediarVecinos(){
		//1-2-1 weighting
		var buf=this.buffers.getChannelData(0);

		//Primer sample
		buf[0]        = .25*(2*this.lastBuffer[0] + this.lastBuffer[this.p-1]+this.lastBuffer[1]); 
		buf[this.p-1] = .25*(2*this.lastBuffer[this.p-1] + this.lastBuffer[this.p-2]+this.lastBuffer[0]); 

		//Samples restantes

		for (var i = 1; i < this.p-1; i++){


				//Promedio : Filtro pasabajos
				if(Math.random()<this.sinv)
					 buf[i] = .25*(2*this.lastBuffer[i] + this.lastBuffer[i-1]+this.lastBuffer[i+1]); 
				else buf[i] = this.lastBuffer[i];

				//Parametro b
				if(Math.random()>this.b) buf[i] = -buf[i];

				//Almacenando en delay line
				this.lastBuffer[i-1]=buf[i-1];

				//Vibrato
				this.vibAmt += this.vibSlope;
				if(Math.abs(this.vibAmt) >= this.maxVibAmt) this.vibSlope *=-1;
		}
		this.lastBuffer[this.p-2]=buf[this.p-2];
		this.lastBuffer[this.p-1]=buf[this.p-1];
		return;
	}

	multiplicativeS(){
		//Todo: Agregar un control para c y d y ver que pasa, no?
		var buf=this.buffers.getChannelData(0);
		let d = 0.5*this.sinv;
		let c = 1-d;

		//Primer sample
		buf[0] = c*this.lastBuffer[0] + d*this.lastBuffer[this.p-1]; 

		//Samples restantes

		for (var i = 1; i < this.p; i++){

				//Promedio :
				buf[i] = c*this.lastBuffer[i]+d*this.lastBuffer[i-1];  //aca está el unico cambio respecto al normal
				
				//Parametro b
				if(Math.random()>this.b) buf[i] = -buf[i];

				//Almacenando en delay line
				this.lastBuffer[i-1]=buf[i-1];

				//Vibrato
				this.vibAmt += this.vibSlope;
				if(Math.abs(this.vibAmt) >= this.maxVibAmt) this.vibSlope *=-1;
		}
		this.lastBuffer[this.p-1]=buf[this.p-1];
		return;
	}


	//Fast Decays. Identico salvo UNA cosita
	//Genera DC Offset
	Siegel(){
		var buf=this.buffers.getChannelData(0);
		
		//Primer sample
		buf[0] = 0.5*(this.lastBuffer[0] + this.lastBuffer[this.p-1]); 

		//Samples restantes

		for (var i = 1; i < this.p; i++){

				//Promedio :
				if(Math.random()<this.sinv)
					 buf[i] = 0.5*(this.lastBuffer[i]+buf[i-1]);  //aca está el unico cambio respecto al normal
				else buf[i] = this.lastBuffer[i];

				//Parametro b
				if(Math.random()>this.b) buf[i] = -buf[i];

				//Almacenando en delay line
				this.lastBuffer[i]=buf[i];

				//Vibrato
				this.vibAmt += this.vibSlope;
				if(Math.abs(this.vibAmt) >= this.maxVibAmt) this.vibSlope *=-1;
		}
		this.lastBuffer[this.p-1]=buf[this.p-1];
		return;
	}


}

Fuente1 = new AudioSource(1);

Fuente2 = new AudioSource(1);

Fuente3 = new KPS_Source(1);