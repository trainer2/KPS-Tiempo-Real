
/*				
		Referencias para mejorar (usan un JS mucho mas avanzado que el mio)
		https://github.com/luciopaiva/karplus   muy consiso 
		https://github.com/mrahtz/javascript-karplus-strong el que me inspiro
		
	
*/


/*								Creamos las variables globales importantes				*/

let context = new (window.AudioContext || window.webkitAudioContext)();

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


/*
function crearBuffer(fuente){
	/*		Creo un Buffer para cargarlo con samples 		*/
/*
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
*/



/* 				Generador de buffers			*/

class AudioSource{


	constructor(numChann=2){
		this.phi=0.; //Esto iria en class "Oscillator", pero no me voy a poner quisquilloso ahora. Viejo (seno menos eficiente)
		this.cos=1;
		this.sin=0;
		this.freq=0.;
		this.numChann=numChann;
		this.bufsize=512;
		this.finUltimo =context.currentTime;
		this.on=true; //deberia tener un puntero al boton de on. Y bue
		this.queuedBufs=0;
		this.buffers = null;
		this.source  = null;

	}

	crearBuffers(numChann, bufsize){ this.buffers= context.createBuffer(numChann, bufsize, sr);}

	cargarBuffers(buffersACargar = []){

		//No se puede asignar getChannelData(i)=buffer ... ese metodo no sirve. Seria mucho mas rapido. LASTIMA!! Me hubiera ahorrado tener que copiar todo cada vez!
	if(buffersACargar != []){

		var len = buffersACargar[0].length;
			/*		Creo un Buffer para cargarlo con samples 		*/
		this.crearBuffers(Math.min(this.numChann, buffersACargar.length), len, sr);

		for (var i = 0; i < Math.min(this.numChann, buffersACargar.length); i++) 
			for (var j = 0; j < len; j++) {
				this.buffers.getChannelData(i)[j] = buffersACargar[i][j];
			}
		}
	this.conectarSalida();
	}

	crearBufferSenoidal(metodo){
		
		this.crearBuffers(1,this.bufsize, sr);
		var buf = this.buffers.getChannelData(0);

		if(metodo==1){

			let sinCt= TWOPI*this.freq/sr;
			for (var j = 0; j < this.bufsize; j++) {
				buf[j] = Math.sin(this.phi)*gain;
				this.phi += sinCt;
			}
			this.conectarSalida();
		
		}

		else{

			let h= this.freq/sr;
			for (var j = 0; j < this.bufsize; j++) {
				buf[j] = this.sin*gain;
				var temp = this.sin;
				this.sin += h*this.cos;
				this.cos -= h*temp;
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
		this.relRecurrencia =1; //tipo de formula a usar

	}

	//Ciclo inicial //
	crearBufferRandom(guardarBuf=true){
		//No tengo en cuenta el vibrato para esta parte
		this.crearBuffers(this.numChann, this.bufsize, sr);

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
		this.crearBuffers(1, this.p, sr);

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