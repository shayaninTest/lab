'use strict';
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let canvasTop = document.getElementById('canvasTop');
let contextTop = canvasTop.getContext('2d');
let FrequencySlider = document.getElementById('FrequencySlider');
let LamdaSlider = document.getElementById('LamdaSlider');
let AmplitudeSlider = document.getElementById('AmplitudeSlider');
let WaveType = document.getElementById('WaveType');

// Simulation Constants
const PpM = 100.0; // pixels per meter
const PartRadius = 0.08; // particle radius in meter
const xOrigin = 0; // x origin in canvas pixel coordinate system
const yOrigin = 350; // y origin in canvas pixel coordinate system
const spacing = 0.2; // particle spacing in meter
const HorParts = 1 + (canvas.width/PpM + 2*AmplitudeSlider.max)/spacing; // number of particles needed horizontally to always fill the canvas's width
const LongRows = 1 + (3/spacing); // number of rows to draw for longitudinal wave to have the vertical size of 3 meters
const CombinedRows = 1 + (4/spacing); // number of rows to draw for combined wave to have the vertical size of 4 meters

// Wave Parameters
let phi = 0; // initial phase in rad
let A; // amplitude in meter
let lamda; // wavelength in meter
let f; // frequency in hertz

class Particle {
    constructor(x, y) {
        // position
        this.x = x;
        this.y = y;
    }
}

// Draw a particle at x and y meter position, relative to xOrigin and yOrigin, in a regular cartesian coordinate systen.
function DrawParticle(x, y) {
    context.fillStyle = '#DDF2FF';
    context.beginPath();
    context.arc(x*PpM+xOrigin, -y*PpM+yOrigin, PartRadius*PpM, 0, 2*Math.PI, true);
    context.closePath();
    context.fill();
}

function DrawTransWave(t,Yshift) {
    let particles = [];
    for (let i = 1; i <= HorParts; i++) {
        let particle = new Particle(-AmplitudeSlider.max + (i-1)*spacing, Math.sin((2*Math.PI/lamda)*((i-1)*spacing)-(2*Math.PI*f)*t+phi)*A + Yshift);
        particles.push(particle);
        DrawParticle(particles[i-1].x, particles[i-1].y);
    }
}

function DrawLongWave(t,Yshift) {
    for (let n = 1; n <= LongRows; n++) {
        let particles = [];
        for (let i = 1; i <= HorParts; i++) {
            let particle = new Particle(-AmplitudeSlider.max + (i-1)*spacing + Math.sin((2*Math.PI/lamda)*((i-1)*spacing)-(2*Math.PI*f)*t+phi)*A, spacing*(n-1) + Yshift);
            particles.push(particle);
            DrawParticle(particles[i-1].x, particles[i-1].y);
        }
    }        
}

function DrawCombinedWave(t,Yshift) {
    for (let n = 1; n <= CombinedRows; n++) {
        let particles = [];
        let scale = Math.pow(Math.E, -(2*Math.PI/lamda)*spacing*(CombinedRows-n));
        for (let i = 1; i <= HorParts; i++) {
            let particle = new Particle(-AmplitudeSlider.max + (i-1)*spacing + scale*Math.sin((2*Math.PI/lamda)*(i-1)*spacing-(2*Math.PI*f)*t+phi+Math.PI/2)*A, spacing*(n-1) + scale*Math.sin((2*Math.PI/lamda)*(i-1)*spacing-(2*Math.PI*f)*t+phi)*A + Yshift);
            particles.push(particle);
            DrawParticle(particles[i-1].x, particles[i-1].y);
        }
    }        
}

function DrawValue() {
    contextTop.font = "16px Arial";
    contextTop.fillStyle = '#000000';
    contextTop.fillText(parseFloat(AmplitudeSlider.value).toFixed(2) + " m", 139, 590);
    contextTop.fillText(parseFloat(LamdaSlider.value).toFixed(2) + " m", 159, 620);
    contextTop.fillText(parseFloat(FrequencySlider.value).toFixed(2) + " Hz", 115, 651);
}

function OnEachStep() {
    lamda = LamdaSlider.value;
    A = AmplitudeSlider.value;
    f = FrequencySlider.value;
    context.clearRect(0, 0, 1400, 800);
    contextTop.clearRect(0, 0, 1400, 800);
    
    if (WaveType.value == "trans") {
        DrawTransWave(new Date().getTime()/1000, 0.5);
    }
    
    if (WaveType.value == "longi") {
        DrawLongWave(new Date().getTime()/1000, -1);
    }

    if (WaveType.value == "combined") {
        DrawCombinedWave(new Date().getTime()/1000, -3.5);
    }

    DrawValue();
}

window.onload = animFrame; 
 
function animFrame() {
    requestAnimationFrame(animFrame, canvas);
    OnEachStep();
};