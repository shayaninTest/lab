'use strict';
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let canvasTop = document.getElementById('canvasTop');
let contextTop = canvasTop.getContext('2d');
let SpringStiffnessSlider = document.getElementById('SpringStiffnessSlider');
let MassSlider = document.getElementById('MassSlider');
let AirDragCheck = document.getElementById('AirDragCheck');

// simulation constants
const g = 9.807; // acceleration due to Earth's gravity in SI unit
const L0 = 3; // spring natural length in meter
const RoS = 0.15 // ratio of the reserved length at the starting end of the spring to the natural length
const RoE = 0.22 // ratio of the reserved length at the ending end of the spring to the natural length
const PpM = 100; // number of pixels per meter
// ceiling shape parameter in meter
const CeilingShape = {
    width: 2,
    height: 0.4,
    cornerRadius: 0.12,
}
const CoilRadius = 40; // in pixels
const AirDensity = 1.225; // in SI
const AirViscosity = 0.0000181; // in SI

// system parameters and object
let ceiling;
let ball;
let spring;
let ti;
let BallRadius;
let ballVel;
let ballVelAngle;
let Cd;

// interactivity variables
let isDragging = false;

class Particle {
    constructor(x, y, vx, vy, mass) {
        // position
        this.x = x;
        this.y = y;
        // velocity
        this.vx = vx;
        this.vy = vy;
        // mass
        this.mass = mass;
    }

    // update state in state-space due to input force after an interval of dt, using semi-implicit Euler integration scheme
    UpdateState(Fx, Fy, dt) {
        this.vx = this.vx + (Fx/this.mass)*dt;
        this.vy = this.vy + (Fy/this.mass)*dt;
        this.x = this.x + this.vx*dt;
        this.y = this.y + this.vy*dt;
    }
}

class Spring {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.dx = x2 - x1;
        this.dy = y2 - y1;
        this.L = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
        this.angle = Math.atan2(this.dy, this.dx); // angle from +x axis measure in clockwise direction
        this.force = SpringStiffnessSlider.value*(L0 - this.L);
    }

    // update the state of spring
    UpdateSpring(newX1, newY1, newX2, newY2) {
        this.x1 = newX1;
        this.y1 = newY1;
        this.x2 = newX2;
        this.y2 = newY2;
        this.dx = this.x2 - this.x1;
        this.dy = this.y2 - this.y1;
        this.L = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
        this.angle = Math.atan2(this.dy, this.dx); // angle from +x axis measure in clockwise direction
        this.force = SpringStiffnessSlider.value*(L0 - this.L);
    }

    // draw a spring from (x1, y1) to (x2, y2) in meter
    DrawSpring() {
        // draw a small circle at the end of the spring
        context.fillStyle = '#696969';
        context.beginPath();
        context.arc(this.x2*PpM, this.y2*PpM, 10*Math.sqrt(SpringStiffnessSlider.value/SpringStiffnessSlider.min), 0, 2*Math.PI, true);
        context.closePath();
        context.fill();

        // draw a spring itself
        context.strokeStyle = '#BDB76B';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 5*SpringStiffnessSlider.value/SpringStiffnessSlider.min;

        if (this.L < (RoS + RoE)*L0) {
            context.beginPath();
            context.moveTo(this.x1*PpM, this.y1*PpM);
            context.lineTo(this.x2*PpM, this.y2*PpM);
            context.stroke();
            context.closePath();

            let h = Math.sqrt((RoS/(RoE+RoS)*this.L)*(RoS/(RoE+RoS)*this.L) + (CoilRadius/PpM)*(CoilRadius/PpM));
            let theta = Math.atan2(CoilRadius, PpM*RoS/(RoE+RoS)*this.L);
            let beginPointX = this.x1*PpM + h*PpM*Math.cos(this.angle - theta); // in pixels
            let beginPointY = this.y1*PpM + h*PpM*Math.sin(this.angle - theta); // in pixels

            context.lineWidth = 5*SpringStiffnessSlider.value/SpringStiffnessSlider.min + 10*(((RoS + RoE)*L0 - this.L)/((RoS + RoE)*L0));
            context.lineCap = 'square';

            context.beginPath();
            context.moveTo(beginPointX, beginPointY);
            context.lineTo(beginPointX - 2*CoilRadius*Math.cos(Math.PI/2 - this.angle), beginPointY + 2*CoilRadius*Math.sin(Math.PI/2 - this.angle));
            context.stroke();
            context.closePath();
        } else {
            let XcoilStart = this.x1*PpM + RoS*L0*PpM*Math.cos(this.angle); // in pixels
            let YcoilStart = this.y1*PpM + RoS*L0*PpM*Math.sin(this.angle); // in pixels
            let XcoilEnd = this.x2*PpM - RoE*L0*PpM*Math.cos(this.angle); // in pixels
            let YcoilEnd = this.y2*PpM - RoE*L0*PpM*Math.sin(this.angle); // in pixels
            let dXcoil = XcoilEnd - XcoilStart; // in pixels
            let dYcoil = YcoilEnd - YcoilStart; // in pixels
            let coilLength = Math.sqrt(dXcoil*dXcoil + dYcoil*dYcoil); // in pixels
            const CoilSteps = 8; // one revolution of coil is counted as one step
            let StepsLength = coilLength/CoilSteps; // in pixels
            let CoilSectionLength = Math.sqrt(CoilRadius*CoilRadius + (StepsLength/4)*(StepsLength/4)); // a section is a quarter of a step
            let theta = Math.atan2(CoilRadius, StepsLength/4); // angle to which each coil section make against the spring direction
    
            context.beginPath();
            context.moveTo(this.x1*PpM, this.y1*PpM);
            context.lineTo(XcoilStart, YcoilStart);
    
            let rx = XcoilStart;
            let ry = YcoilStart;
            for (let i = 0; i < 4*CoilSteps; i++) {
                if (i % 4 == 0 || i % 4 == 3) {
                    rx = rx + CoilSectionLength*Math.cos(theta-this.angle);
                    ry = ry - CoilSectionLength*Math.sin(theta-this.angle);
                    context.lineTo(rx, ry);
                }
                else {
                    rx = rx - CoilSectionLength*Math.cos(Math.PI-theta-this.angle);
                    ry = ry + CoilSectionLength*Math.sin(Math.PI-theta-this.angle);
                    context.lineTo(rx, ry);
                }
            }
    
            context.lineTo(this.x2*PpM, this.y2*PpM);
            
            context.stroke();
            context.closePath();
        }
    }
}

// draw a ceiling above the position x and y (in meter)
function DrawCeiling(x, y) {
    // draw a small circle at the spring attached position
    context.fillStyle = '#696969';
    context.beginPath();
    context.arc(x*PpM, y*PpM, 12, 0, 2*Math.PI, true);
    context.closePath();
    context.fill();

    let cornerR = CeilingShape.cornerRadius*PpM; // corner radius in meter
    let X = x*PpM; // x position in meter
    let Y = y*PpM; // y position in meter
    let ceilingHalfWidth = (CeilingShape.width/2)*PpM; // in meter
    let ceilingHeight = CeilingShape.height*PpM; // in meter
    context.fillStyle = '#C9C9C9';
    context.beginPath();
    context.moveTo(X, Y);
    context.lineTo(X-ceilingHalfWidth+cornerR, Y);
    context.arc(X-ceilingHalfWidth+cornerR, Y-cornerR, cornerR, 0.5*Math.PI, Math.PI, false);
    context.lineTo(X-ceilingHalfWidth, Y-ceilingHeight);
    context.lineTo(X+ceilingHalfWidth, Y-ceilingHeight);
    context.lineTo(X+ceilingHalfWidth, Y-cornerR);
    context.arc(X+ceilingHalfWidth-cornerR, Y-cornerR, cornerR, 0, 0.5*Math.PI, false);
    context.lineTo(X, y*PpM);
    context.closePath();
    context.fill();
}

// draw a ball at the position x and y (in meter)
function DrawBall(x, y) {
    context.fillStyle = '#DDF2FF';
    context.beginPath();
    context.arc(x*PpM, y*PpM, BallRadius*PpM, 0, 2*Math.PI, true);
    context.closePath();
    context.fill();
}

function CalcDrag(vel) {
    if (AirDragCheck.checked == true) {
        let Reynold = AirDensity*vel*2*BallRadius/AirViscosity;
        if (Reynold >= 2000000) {
            Cd = 0.2; // drag coefficient of a sphere in turbulent flow
        } else if (Reynold > 200000) {
            Cd = 0.2 + 0.3*((2000000 - Reynold)/1800000); // drag coefficient of a sphere in transitional flow (approx by linear interpolation)
        } else if (48 < Reynold) {
            Cd = 0.5; // drag coefficient of a sphere in laminar flow
        } else if (0 < Reynold) {
            Cd = 24/Reynold; // drag coefficient of a sphere in creeping flow
        } else {
            Cd = 24/(Reynold + 0.0000001);
        }
        return 0.5*AirDensity*Cd*Math.PI*BallRadius*BallRadius*vel*vel;
    }
    else {
        return 0;
    }
}

function DrawValue() {
    contextTop.font = "16px Arial";
    contextTop.fillStyle = '#000000';
    contextTop.fillText(SpringStiffnessSlider.value + " N/m", 99, 620);
    contextTop.fillText(parseFloat(MassSlider.value).toFixed(1) + " kg", 93, 651);
}

function OnEachStep() {
    if (isDragging == false) {
        let dt = new Date().getTime()/1000 - ti;
        ti = new Date().getTime()/1000;

        // set a hard limit for dt in case of stuttering or tab switching
        if (dt > 0.02) {
            dt = 1/60;
        }
    
        ball.mass = MassSlider.value;
        BallRadius = 0.4*Math.pow(MassSlider.value, 1/3);
        ballVel = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
        ballVelAngle = Math.atan2(ball.vy, ball.vx);
        let Xforce = spring.force*Math.cos(spring.angle) - CalcDrag(ballVel)*Math.cos(ballVelAngle);
        let Yforce = spring.force*Math.sin(spring.angle) + ball.mass*g - CalcDrag(ballVel)*Math.sin(ballVelAngle);
        ball.UpdateState(Xforce, Yforce, dt);
        spring.UpdateSpring(ceiling.x, ceiling.y, ball.x, ball.y);
    
        context.clearRect(0, 0, canvas.width, canvas.height);
        contextTop.clearRect(0, 0, canvas.width, canvas.height);
        DrawBall(ball.x, ball.y);
        spring.DrawSpring();
        DrawCeiling(ceiling.x, ceiling.y);

        DrawValue();
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

    ceiling = new Particle(3.5, CeilingShape.height, 0, 0, 9999999);
    ball = new Particle(ceiling.x, ceiling.y + L0 + (MassSlider.value*g/SpringStiffnessSlider.value), 0, 0, MassSlider.value); // start at equilibrium position
    spring = new Spring(ceiling.x, ceiling.y, ball.x, ball.y);
    ti = new Date().getTime()/1000;
    animFrame();
}

window.onload = init;

function onDrag(evt) {
    isDragging = true;
    ball.x = convToCanvasX(evt.pageX)/PpM;
    ball.y = convToCanvasY(evt.pageY - window.scrollY)/PpM; // window.scrollY help corrected the pointer position when scrolling down the page
    spring.UpdateSpring(ceiling.x, ceiling.y, ball.x, ball.y);
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    contextTop.clearRect(0, 0, canvas.width, canvas.height);
    DrawBall(ball.x, ball.y);
    spring.DrawSpring();
    DrawCeiling(ceiling.x, ceiling.y);

    DrawValue();
    }

function onDrop() {
    isDragging = false;
    ti = new Date().getTime()/1000;
    ball.vx = 0;
    ball.vy = 0;
    canvasTop.removeEventListener('pointermove', onDrag);
    canvasTop.removeEventListener('pointerup', onDrop);
    }

// convert window x coordinate to canvas x coordinate
function convToCanvasX(WinX) {
    let rect = canvas.getBoundingClientRect();
    return WinX - rect.left;
}

// convert window y coordinate to canvas y coordinate
function convToCanvasY(WinY) {
    let rect = canvas.getBoundingClientRect();
    return WinY - rect.top;
}