'use strict';
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let canvasTop = document.getElementById('canvasTop');
let contextTop = canvasTop.getContext('2d');
let FrequencySlider1 = document.getElementById('FrequencySlider1');
let LamdaSlider1 = document.getElementById('LamdaSlider1');
let AmplitudeSlider1 = document.getElementById('AmplitudeSlider1');
let FrequencySlider2 = document.getElementById('FrequencySlider2');
let LamdaSlider2 = document.getElementById('LamdaSlider2');
let AmplitudeSlider2 = document.getElementById('AmplitudeSlider2');
let direction1 = document.getElementsByName('direction1');
let direction2 = document.getElementsByName('direction2');
let dispVect = document.getElementById('dispVect');

// Simulation Constants
const PpM = 100.0; // pixels per meter
const PartRadius = 0.04; // particle radius in meter
const xOrigin = 0; // x origin in canvas pixel coordinate system
const yOrigin = 0; // y origin in canvas pixel coordinate system
const spacing = 0.1; // particle spacing in meter
const HorParts = 1 + (canvas.width/PpM)/spacing; // number of particles needed horizontally to always fill the canvas's width

// Wave Parameters
let phi1 = 0; // initial phase in rad
let A1; // amplitude in meter
let lamda1; // wavelength in meter
let f1; // frequency in hertz
let phi2 = 0; // initial phase in rad
let A2; // amplitude in meter
let lamda2; // wavelength in meter
let f2; // frequency in hertz

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

// draw displacement vector vertically from horizontal axis to y coordinate (input in meter)
function DrawDispVect(x, y, axis, color) {
    if (y >= 0) {
        if (y > 0.08) {
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(x*PpM, axis*PpM);
            context.lineTo(x*PpM, (axis - y + 0.08)*PpM);
            context.closePath();
            context.stroke();
    
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x*PpM, (axis - y)*PpM);
            context.lineTo(x*PpM + 4, (axis - y)*PpM + 8);
            context.lineTo(x*PpM - 4, (axis - y)*PpM + 8);
            context.lineTo(x*PpM, (axis - y)*PpM);
            context.closePath();
            context.fill();
        } else {
            let scale = y/0.08;
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x*PpM, (axis - y)*PpM);
            context.lineTo(x*PpM + 4*scale, (axis - y)*PpM + 8*scale);
            context.lineTo(x*PpM - 4*scale, (axis - y)*PpM + 8*scale);
            context.lineTo(x*PpM, (axis - y)*PpM);
            context.closePath();
            context.fill();
        }
    }

    if (y < 0) {
        if (y < -0.08) {
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(x*PpM, axis*PpM);
            context.lineTo(x*PpM, (axis - y - 0.08)*PpM);
            context.closePath();
            context.stroke();
    
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x*PpM, (axis - y)*PpM);
            context.lineTo(x*PpM + 4, (axis - y)*PpM - 8);
            context.lineTo(x*PpM - 4, (axis - y)*PpM - 8);
            context.lineTo(x*PpM, (axis - y)*PpM);
            context.closePath();
            context.fill();
        } else {
            let scale = -y/0.08;
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(x*PpM, (axis - y)*PpM);
            context.lineTo(x*PpM + 4*scale, (axis - y)*PpM - 8*scale);
            context.lineTo(x*PpM - 4*scale, (axis - y)*PpM - 8*scale);
            context.lineTo(x*PpM, (axis - y)*PpM);
            context.closePath();
            context.fill();
        }
    }
}

function DrawTransWave1(t,Yshift) {
    let particles = [];
    for (let i = 1; i <= HorParts; i++) {
        let x = (i-1)*spacing;

        let y1;
        if (direction1[0].checked) { // check if user choose left direction for wave 1
            y1 = Math.sin((2*Math.PI/lamda1)*((i-1)*spacing)+(2*Math.PI*f1)*t+phi1)*A1;
        } else {
            y1 = Math.sin((2*Math.PI/lamda1)*((i-1)*spacing)-(2*Math.PI*f1)*t+phi1)*A1;
        }
        
        let particle = new Particle(x, y1 + Yshift);
        particles.push(particle);
        DrawParticle(particles[i-1].x, particles[i-1].y);

        if (dispVect.checked) {
            DrawDispVect(particles[i-1].x, y1, -Yshift, '#FFFF00CC');
        }
    }
}

function DrawTransWave2(t,Yshift) {
    let particles = [];
    for (let i = 1; i <= HorParts; i++) {
        let x = (i-1)*spacing;

        let y2;
        if (direction2[0].checked) { // check if user choose left direction for wave 2
            y2 = Math.sin((2*Math.PI/lamda2)*((i-1)*spacing)+(2*Math.PI*f2)*t+phi2)*A2;
        } else {
            y2 = Math.sin((2*Math.PI/lamda2)*((i-1)*spacing)-(2*Math.PI*f2)*t+phi2)*A2;
        }
        
        let particle = new Particle(x, y2 + Yshift);
        particles.push(particle);
        DrawParticle(particles[i-1].x, particles[i-1].y);

        if (dispVect.checked) {
            DrawDispVect(particles[i-1].x, y2, -Yshift, '#00FF00CC');
        }
    }
}

function DrawFinalWave(t,Yshift) {
    let particles = [];
    for (let i = 1; i <= HorParts; i++) {
        let x = (i-1)*spacing;
        
        let y1;
        if (direction1[0].checked) { // check if user choose left direction for wave 1
            y1 = Math.sin((2*Math.PI/lamda1)*((i-1)*spacing)+(2*Math.PI*f1)*t+phi1)*A1;
        } else {
            y1 = Math.sin((2*Math.PI/lamda1)*((i-1)*spacing)-(2*Math.PI*f1)*t+phi1)*A1;
        }

        let y2;
        if (direction2[0].checked) { // check if user choose left direction for wave 2
            y2 = Math.sin((2*Math.PI/lamda2)*((i-1)*spacing)+(2*Math.PI*f2)*t+phi2)*A2;
        } else {
            y2 = Math.sin((2*Math.PI/lamda2)*((i-1)*spacing)-(2*Math.PI*f2)*t+phi2)*A2;
        }
        
        let y = y1 + y2;
        let particle = new Particle(x, y + Yshift);
        particles.push(particle);
        DrawParticle(particles[i-1].x, particles[i-1].y);

        if (dispVect.checked) {
            DrawDispVect(particles[i-1].x, y1, - Yshift, '#FFFF00CC');
            DrawDispVect(particles[i-1].x, y2, - Yshift - y1, '#00FF00CC');
        }
    }
}

function DrawValue() {
    contextTop.font = "16px Arial";
    contextTop.fillStyle = '#000000';
    contextTop.fillText(parseFloat(AmplitudeSlider1.value).toFixed(2) + " m", 146, 67);
    contextTop.fillText(parseFloat(LamdaSlider1.value).toFixed(2) + " m", 278, 67);
    contextTop.fillText(parseFloat(FrequencySlider1.value).toFixed(2) + " Hz", 449, 67);
    contextTop.fillText(parseFloat(AmplitudeSlider2.value).toFixed(2) + " m", 146, 287);
    contextTop.fillText(parseFloat(LamdaSlider2.value).toFixed(2) + " m", 278, 287);
    contextTop.fillText(parseFloat(FrequencySlider2.value).toFixed(2) + " Hz", 449, 287);
}

function OnEachStep() {
    lamda1 = LamdaSlider1.value;
    A1 = AmplitudeSlider1.value;
    f1 = FrequencySlider1.value;
    lamda2 = LamdaSlider2.value;
    A2 = AmplitudeSlider2.value;
    f2 = FrequencySlider2.value;
    context.clearRect(0, 0, canvas.width, canvas.height);
    contextTop.clearRect(0, 0, canvas.width, canvas.height);
    
    DrawTransWave1(new Date().getTime()/1000, -1.7);
    DrawTransWave2(new Date().getTime()/1000, -3.9);
    DrawFinalWave(new Date().getTime()/1000, -6.5);
    DrawValue();
}

window.onload = animFrame; 
 
function animFrame() {
    requestAnimationFrame(animFrame, canvas);
    OnEachStep();
};