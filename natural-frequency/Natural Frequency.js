'use strict';
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let canvasTop = document.getElementById('canvasTop');
let contextTop = canvasTop.getContext('2d');
let SpringStiffnessSlider = document.getElementById('SpringStiffnessSlider');
let MassSlider = document.getElementById('MassSlider');
let WindFrequencySlider = document.getElementById('WindFrequencySlider');
let bloweronoffswitch = document.getElementById('bloweronoffswitch');

// simulation constants
const L0 = 4; // spring natural length in meter
const RoS = 0.06 // ratio of the reserved length at the starting end of the spring to the natural length
const RoE = 0.18 // ratio of the reserved length at the ending end of the spring to the natural length
const PpM = 100; // number of pixels per meter
const CoilRadius = 30; // in pixels
const SpringFixedX = 1; // in meter
const SpringFixedY = 3.5; // in meter
const WindForceAmplitude = 4; // in N

// system parameters and object
let block;
let BlockSize;
let spring;
let windForce;
let ti;
let NatFreq;

// interactivity variables
let isDragging = false;
let blowerStart; // time recorded when the blower's switch flip to on, in sec
let blowerElapse; // time since blower start, in sec
let blowerPrevState = false; // recorded state of the blower in previous time step

class Particle {
    constructor(x, vx, mass) {
        // position
        this.x = x;
        // velocity
        this.vx = vx;
        // mass
        this.mass = mass;
    }

    // update state in state-space due to input force after an interval of dt, using semi-implicit Euler integration scheme
    UpdateState(Fx, dt) {
        this.vx = this.vx + (Fx/this.mass)*dt;
        this.x = this.x + this.vx*dt;
    }
}

class Spring {
    constructor(x1, x2) {
        this.x1 = x1;
        this.x2 = x2;
        this.L = this.x2 - this.x1;
        this.force = SpringStiffnessSlider.value*(L0 - this.L);
    }

    // update the state of spring
    UpdateSpring(newX1, newX2) {
        this.x1 = newX1;
        this.x2 = newX2;
        this.L = this.x2 - this.x1;
        this.force = SpringStiffnessSlider.value*(L0 - this.L);
    }

    // draw a spring from x1 to x2, in meter
    DrawSpring() {
        context.strokeStyle = '#BDB76B';
        context.lineCap = 'butt';
        context.lineJoin = 'round';
        context.lineWidth = 5*SpringStiffnessSlider.value/SpringStiffnessSlider.min;

        if (this.L < (RoS + RoE)*L0) {
            context.beginPath();
            context.moveTo(this.x1*PpM, SpringFixedY*PpM);
            context.lineTo(this.x2*PpM, SpringFixedY*PpM);
            context.stroke();
            context.closePath();

            let beginPointX = this.x1*PpM + RoS/(RoE+RoS)*this.L*PpM; // in pixels
            let beginPointY = SpringFixedY*PpM - CoilRadius; // in pixels

            context.lineWidth = 5*SpringStiffnessSlider.value/SpringStiffnessSlider.min + 10*(((RoS + RoE)*L0 - this.L)/((RoS + RoE)*L0));
            context.lineCap = 'square';

            context.beginPath();
            context.moveTo(beginPointX, beginPointY);
            context.lineTo(beginPointX, beginPointY + 2*CoilRadius);
            context.stroke();
            context.closePath();
        } else {
            let XcoilStart = this.x1*PpM + RoS*L0*PpM; // in pixels
            let XcoilEnd = this.x2*PpM - RoE*L0*PpM; // in pixels
            let coilLength = XcoilEnd - XcoilStart; // in pixels
            const CoilSteps = 12; // one revolution of coil is counted as one step
            let StepsLength = coilLength/CoilSteps; // in pixels
            let CoilSectionLength = Math.sqrt(CoilRadius*CoilRadius + (StepsLength/4)*(StepsLength/4)); // a section is a quarter of a step
            let theta = Math.atan2(CoilRadius, StepsLength/4); // angle to which each coil section make against the spring direction
    
            context.beginPath();
            context.moveTo(this.x1*PpM, SpringFixedY*PpM);
            context.lineTo(XcoilStart, SpringFixedY*PpM);
    
            let rx = XcoilStart;
            let ry = SpringFixedY*PpM;
            for (let i = 0; i < 4*CoilSteps; i++) {
                if (i % 4 == 0 || i % 4 == 3) {
                    rx = rx + CoilSectionLength*Math.cos(theta);
                    ry = ry - CoilSectionLength*Math.sin(theta);
                    context.lineTo(rx, ry);
                }
                else {
                    rx = rx - CoilSectionLength*Math.cos(Math.PI-theta);
                    ry = ry + CoilSectionLength*Math.sin(Math.PI-theta);
                    context.lineTo(rx, ry);
                }
            }
    
            context.lineTo(this.x2*PpM, SpringFixedY*PpM);
            
            context.stroke();
            context.closePath();
        }
    }
}

class WindForce {
    constructor(f, A) {
        this.f = f; // in Hz
        this.A = A; // in N
    }
    Value() {
        if (bloweronoffswitch.checked == true) {
            blowerElapse = (new Date().getTime()/1000) - blowerStart;
            return this.A*(1 - Math.cos(2*Math.PI*this.f*blowerElapse))/2; // force range from 0 to amplitude
        } else {
            return 0;
        }
    }
    DrawWind() {
        blowerElapse = (new Date().getTime()/1000) - blowerStart;
        let unitF = (1 - Math.cos(2*Math.PI*this.f*blowerElapse))/2; // force value normalized to 1
        let gradient;
        if (blowerElapse % (1/this.f) < (1/(2*this.f))) { // check for an increasing function
            gradient = context.createLinearGradient(844, 343, 844 - 844*unitF, 343);
            gradient.addColorStop(0.5, '#DDF2FF99');
        } else {
            gradient = context.createLinearGradient(844*unitF, 343, 844*(unitF - 1), 343);
            gradient.addColorStop(0.5, '#DDF2FF99');
        }
        gradient.addColorStop(0, '#DDF2FF00');
        gradient.addColorStop(1, '#DDF2FF00');
        context.fillStyle = gradient;
        context.lineCap = 'butt';
        context.lineWidth = 18;
        context.beginPath();
        context.moveTo(844, 333);
        context.lineTo(0, 242);
        context.lineTo(0, 442);
        context.lineTo(844, 351);
        context.fill();
        context.closePath();
    }
}

// draw a block at the position x and y (in meter)
function DrawBlock(x, y) {
    BlockSize = 0.7937*Math.pow(MassSlider.value, 1/3);
    context.fillStyle = '#DDF2FF';
    context.beginPath();
    context.roundRect((x-BlockSize/2)*PpM, (y+0.5-BlockSize)*PpM, BlockSize*PpM, BlockSize*PpM, 14);
    context.closePath();
    context.fill();
}

function DrawNatFreqLine() {
    let NatPointerX = 837 + (952 - 837)*(NatFreq - 0.2);

    context.strokeStyle = '#DDF2FF';
    context.lineCap = 'butt';
    context.lineJoin = 'round';
    context.lineWidth = 4;
    context.beginPath();
    context.setLineDash([12, 12]);
    context.moveTo(280, 620);
    context.lineTo(420, 620);
    context.moveTo(588, 620);
    context.lineTo(NatPointerX - 15, 620);
    context.arc(NatPointerX - 15, 605, 15, 0.5*Math.PI, 0, true);
    context.lineTo(NatPointerX, 515);
    context.stroke();
    context.setLineDash([]);
    context.closePath();

    context.fillStyle = '#DDF2FF';
    context.beginPath();
    context.moveTo(NatPointerX, 515);
    context.lineTo(NatPointerX - 10, 515);
    context.lineTo(NatPointerX, 495);
    context.lineTo(NatPointerX + 10, 515);
    context.lineTo(NatPointerX, 515);
    context.closePath();
    context.fill();
}

function DrawValue() {
    contextTop.font = "30px Arial";
    contextTop.fillStyle = '#0071BC';
    contextTop.fillText(NatFreq.toFixed(2) + " Hz", 448, 645);

    contextTop.font = "16px Arial";
    contextTop.fillStyle = '#000000';
    contextTop.fillText(parseFloat(WindFrequencySlider.value).toFixed(2) + " Hz", 903, 450);
    contextTop.fillText(SpringStiffnessSlider.value + " N/m", 96, 609);
    contextTop.fillText(parseFloat(MassSlider.value).toFixed(1) + " kg", 92, 647);
}

function OnEachStep() {
    if (isDragging == false) {
        let dt = new Date().getTime()/1000 - ti;
        ti = new Date().getTime()/1000;

        // set a hard limit for dt in case of stuttering or tab switching
        if (dt > 0.02) {
            dt = 1/60;
        }

        // set the blower to start at 0 everytime the switch is flipped to on
        if (blowerPrevState == false && bloweronoffswitch.checked == true) {
            blowerStart = new Date().getTime()/1000;
        }
        blowerPrevState = bloweronoffswitch.checked;
    
        block.mass = MassSlider.value;
        windForce.f = WindFrequencySlider.value;
        block.UpdateState(spring.force - windForce.Value(), dt);
        spring.UpdateSpring(SpringFixedX, block.x);

        NatFreq = Math.sqrt(SpringStiffnessSlider.value/MassSlider.value)/(2*Math.PI);
    
        context.clearRect(0, 0, canvas.width, canvas.height);
        contextTop.clearRect(0, 0, canvas.width, canvas.height);
        spring.DrawSpring();
        DrawBlock(block.x, SpringFixedY);
        DrawNatFreqLine();
        DrawValue();

        // check for collision, the block will bounce with half the velocity if collision happened (75% reduction of KE)
        if (block.x - BlockSize/2 < 1) {
            block.vx = -0.5*block.vx;
            block.x = 1 + BlockSize/2; // prevent block from stucking in the wall and causing unrealistic behavior
        }
        if (block.x + BlockSize/2 > 8.39) {
            block.vx = -0.5*block.vx;
            block.x = 8.39 - BlockSize/2; // prevent block from stucking in the wall and causing unrealistic behavior
        }
        
        if (bloweronoffswitch.checked == true) {
            windForce.DrawWind();
        }
    }
}
 
function animFrame() {
    requestAnimationFrame(animFrame, canvas);
    OnEachStep();
}

function init() {
    canvasTop.addEventListener('pointerdown', function () {
        canvasTop.addEventListener('pointermove', onDrag);
        canvasTop.addEventListener('pointerup', onDrop);
        });

    block = new Particle(SpringFixedX + L0, 0, MassSlider.value); // start at equilibrium position
    spring = new Spring(SpringFixedX, block.x);
    windForce = new WindForce(WindFrequencySlider.value, WindForceAmplitude);
    ti = new Date().getTime()/1000;
    animFrame();
}

window.onload = init;

function onDrag(evt) {
    isDragging = true;
    block.x = convToCanvasX(evt.pageX)/PpM;
    
    // prevent user from dragging the block pass the wall and the blower
    if (block.x - BlockSize/2 < 1) {
        block.x = 1 + BlockSize/2;
    }
    if (block.x + BlockSize/2 > 8.39) {
        block.x = 8.39 - BlockSize/2;
    }

    spring.UpdateSpring(SpringFixedX, block.x);
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    contextTop.clearRect(0, 0, canvas.width, canvas.height);
    spring.DrawSpring();
    DrawBlock(block.x, SpringFixedY);
    DrawNatFreqLine();
    DrawValue();
    
    if (bloweronoffswitch.checked == true) {
        windForce.DrawWind();
    }
    }

function onDrop() {
    isDragging = false;
    ti = new Date().getTime()/1000;
    block.vx = 0;
    canvasTop.removeEventListener('pointermove', onDrag);
    canvasTop.removeEventListener('pointerup', onDrop);
    }

// convert window x coordinate to canvas x coordinate
function convToCanvasX(WinX) {
    let rect = canvas.getBoundingClientRect();
    return WinX - rect.left;
}