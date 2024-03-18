'use strict';
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let canvasTop = document.getElementById('canvasTop');
let contextTop = canvasTop.getContext('2d');
let addDeviceButton = document.getElementById('addDeviceButton');
let removeDeviceButton = document.getElementById('removeDeviceButton');
let previousButton = document.getElementById('previousButton');
let nextButton = document.getElementById('nextButton');
let showCalculation = document.getElementById('showCalculation');
let calculationImage = document.getElementById('calculationImage');

// constants
const PpCM = 20; // number of pixels per centimeter
const deviceHalfD = 5; // mirrors or lens half diameter in cm
const mirrorThickness = 20; // in pixels
const bubbleShape = {
    // in pixels
    h: 100,
    w: 140,
    corner: 10, // corner radius
    elevation: 30, // how high a bubble is hovering over the devices
    hPointer: 20,
    wPointer: 20,
}
const nLens = 1.90 // refractive index of lens's material, 1.90 is the highest value of n available in the consumer market according to google search in 2024 (high n make lens less bulge)
const objClickableAreaRadius = 6; // in pixels
const colorCycle = ['#d6d929', '#51cf73', '#6bd9db']; // color cycle for each image formation

// variables for saving a pointer position in pointermove loops
let lastPointerX;
let lastPointerY;

let equipments = []; // array of all interactable stuffs in the simulation
let equiNum = []; // array of number 0, 1, 2, ... in which the number of elements is always the same as equipments[] but will get rearranged by the equipments position while drag
let principalAxis = 15; // Y position of principal axis, in cm
let initObjSize = 3; // in cm
let index; // index is a number given to each optical device added to the simulation in the order of adding (index number of a removed device will not be overwritten)
let timeAtLoad; // store the value of time when simulation is first loaded
let numberOfImages; // how many images have to be formed 
let reflectedAt; // where the reflection happened 
let isReflected; // is mirror reflection happened
let images = []; // array of images
let imageToDisplay;
let calculationIsShowed;

class OptDevice {
    constructor(x, y, f, index) {
        // position
        this.x = x;
        this.y = y;
        // optics parameters
        this.f = f;

        this.isHovered = false;
        this.isSelected = false;
        this.isDragged = false;

        // create HTML elements for user input
        this.inputDiv = document.createElement('div');
        this.inputDiv.style.display = 'none';
        this.inputDiv.style.position = 'absolute';
        this.inputDiv.style.zIndex = '4';

        let name = 'option' + index; // so that the radio group of each device has a different name

        // create svg radio button for concave mirror
        this.concMirLabel = document.createElement('label');
        this.concMirLabel.style.margin = '0px 8px 0px 5px';
        this.concMirLabel.for = 'concMir';
        this.isConcMir = document.createElement('input');
        this.isConcMir.type = 'radio';
        this.isConcMir.name = name;
        this.isConcMir.id = 'concMir';
        this.concMirSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.concMirSVGPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.concMirSVG.setAttribute('viewbox', '0 0 10.82 26');
        this.concMirSVGPath.setAttribute('d', 'M5.85,0H0c3.09,3.45,4.97,8.01,4.97,13c0,4.99-1.88,9.55-4.97,13h5.85c3.09-3.45,4.97-8.01,4.97-13C10.82,8.01,8.94,3.45,5.85,0z');
        this.concMirSVG.setAttribute('width', '10.82px');
        this.concMirSVG.setAttribute('height', '26px');
        this.concMirSVGPath.setAttribute('fill', '#AAAAAA');
        this.concMirSVG.appendChild(this.concMirSVGPath);
        this.concMirLabel.appendChild(this.isConcMir);
        this.concMirLabel.appendChild(this.concMirSVG);
        this.concMirLabel.setAttribute('position', 'relative');
        this.isConcMir.style.position = 'absolute';
        this.isConcMir.style.opacity = '0';
        this.inputDiv.appendChild(this.concMirLabel);
        
        // create svg radio button for convex mirror
        this.convMirLabel = document.createElement('label');
        this.convMirLabel.style.margin = '0px 10px 0px 10px';
        this.convMirLabel.for = 'convMir';
        this.isConvMir = document.createElement('input');
        this.isConvMir.type = 'radio';
        this.isConvMir.name = name;
        this.isConvMir.id = 'convMir';
        this.convMirSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.convMirSVGPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.convMirSVG.setAttribute('viewbox', '0 0 10.82 26');
        this.convMirSVGPath.setAttribute('d', 'M4.97,0l5.85,0C7.73,3.45,5.85,8.01,5.85,13c0,4.99,1.88,9.55,4.97,13H4.97C1.88,22.55,0,17.99,0,13C0,8.01,1.88,3.45,4.97,0z');
        this.convMirSVG.setAttribute('width', '10.82px');
        this.convMirSVG.setAttribute('height', '26px');
        this.convMirSVGPath.setAttribute('fill', '#AAAAAA');
        this.convMirSVG.appendChild(this.convMirSVGPath);
        this.convMirLabel.appendChild(this.isConvMir);
        this.convMirLabel.appendChild(this.convMirSVG);
        this.convMirLabel.setAttribute('position', 'relative');
        this.isConvMir.style.position = 'absolute';
        this.isConvMir.style.opacity = '0';
        this.inputDiv.appendChild(this.convMirLabel);

        // create svg radio button for concave lens
        this.concLenLabel = document.createElement('label');
        this.concLenLabel.style.margin = '0px 10px 0px 10px';
        this.concLenLabel.for = 'concLen';
        this.isConcLen = document.createElement('input');
        this.isConcLen.type = 'radio';
        this.isConcLen.name = name;
        this.isConcLen.id = 'concLen';
        this.concLenSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.concLenSVGPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.concLenSVG.setAttribute('viewbox', '0 0 11.18 26');
        this.concLenSVGPath.setAttribute('d', 'M11.18,0c-3.09,3.45-4.97,8-4.97,13c0,4.99,1.88,9.55,4.97,13v0H0v-0.03C3.07,22.52,4.94,17.98,4.94,13S3.07,3.48,0,0.03V0L11.18,0L11.18,0z');
        this.concLenSVG.setAttribute('width', '11.18px');
        this.concLenSVG.setAttribute('height', '26px');
        this.concLenSVGPath.setAttribute('fill', '#AAAAAA');
        this.concLenSVG.appendChild(this.concLenSVGPath);
        this.concLenLabel.appendChild(this.isConcLen);
        this.concLenLabel.appendChild(this.concLenSVG);
        this.concLenLabel.setAttribute('position', 'relative');
        this.isConcLen.style.position = 'absolute';
        this.isConcLen.style.opacity = '0';
        this.inputDiv.appendChild(this.concLenLabel);
        
        // create svg radio button for convex lens
        this.convLenLabel = document.createElement('label');
        this.convLenLabel.style.margin = '0px 0px 0px 10px';
        this.convLenLabel.for = 'convLen';
        this.isConvLen = document.createElement('input');
        this.isConvLen.type = 'radio';
        this.isConvLen.name = name;
        this.isConvLen.id = 'convLen';
        this.convLenSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.convLenSVGPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.convLenSVG.setAttribute('viewbox', '0 0 9.92 26');
        this.convLenSVGPath.setAttribute('d', 'M9.92,13c0,4.99-1.87,9.55-4.96,13C1.88,22.55,0,17.99,0,13S1.88,3.45,4.96,0C8.04,3.45,9.92,8.01,9.92,13z');
        this.convLenSVG.setAttribute('width', '9.92px');
        this.convLenSVG.setAttribute('height', '26px');
        this.convLenSVGPath.setAttribute('fill', '#AAAAAA');
        this.convLenSVG.appendChild(this.convLenSVGPath);
        this.convLenLabel.appendChild(this.isConvLen);
        this.convLenLabel.appendChild(this.convLenSVG);
        this.convLenLabel.setAttribute('position', 'relative');
        this.isConvLen.style.position = 'absolute';
        this.isConvLen.style.opacity = '0';
        this.inputDiv.appendChild(this.convLenLabel);

        this.isConcMir.checked = true; // set default to concave mirror

        this.lineBreak1 = document.createElement('br');
        this.inputDiv.appendChild(this.lineBreak1);
        this.lineBreak2 = document.createElement('br');
        this.inputDiv.appendChild(this.lineBreak2);
        
        this.slider = document.createElement('input');
        this.slider.type = 'range';
        this.slider.min = '4';
        this.slider.max = '9';
        this.slider.step = '0.1';
        this.slider.value = f;
        this.slider.style.width = '110px';
        this.slider.style.marginTop = '12px';
        this.inputDiv.appendChild(this.slider);

        document.body.appendChild(this.inputDiv);
    }

    // update for each animation frame
    update() {
        this.f = this.slider.value;
        let left = this.x*PpCM + canvas.getBoundingClientRect().left - 56 + window.scrollX + 'px';
        this.inputDiv.style.left = left;
        let top = this.y*PpCM + canvas.getBoundingClientRect().top - deviceHalfD*PpCM - 117 + window.scrollY + 'px';
        this.inputDiv.style.top = top;

        if (this.isConcMir.checked) {
            this.concMirSVGPath.setAttribute('fill', '#12ace6');
        } else {
            this.concMirSVGPath.setAttribute('fill', '#AAAAAA');
        }

        if (this.isConvMir.checked) {
            this.convMirSVGPath.setAttribute('fill', '#12ace6');
        } else {
            this.convMirSVGPath.setAttribute('fill', '#AAAAAA');
        }

        if (this.isConcLen.checked) {
            this.concLenSVGPath.setAttribute('fill', '#12ace6');
        } else {
            this.concLenSVGPath.setAttribute('fill', '#AAAAAA');
        }

        if (this.isConvLen.checked) {
            this.convLenSVGPath.setAttribute('fill', '#12ace6');
        } else {
            this.convLenSVGPath.setAttribute('fill', '#AAAAAA');
        }
    }

    createShapePath() {
        if (this.isConcMir.checked) {
            let c = 2*this.f;
            let centerX = this.x - c; // x position of the center of curvature
            let d = Math.sqrt(c*c - deviceHalfD*deviceHalfD); // *** value of c cannot be smaller than the deviceHalfD
            let theta = Math.atan2(deviceHalfD, d);

            context.beginPath();
            context.arc(centerX*PpCM, this.y*PpCM, c*PpCM, -theta, theta, false);
            context.arc(centerX*PpCM + mirrorThickness, this.y*PpCM, c*PpCM, theta, -theta, true);
            context.closePath();
        }

        if (this.isConvMir.checked) {
            let c = 2*this.f;
            let centerX = this.x + c; // x position of the center of curvature
            let d = Math.sqrt(c*c - deviceHalfD*deviceHalfD); // *** value of c cannot be smaller than the deviceHalfD
            let theta = Math.atan2(deviceHalfD, d);

            context.beginPath();
            context.arc(centerX*PpCM - mirrorThickness, this.y*PpCM, c*PpCM, Math.PI - theta, Math.PI + theta, false);
            context.arc(centerX*PpCM, this.y*PpCM, c*PpCM, Math.PI + theta, Math.PI - theta, true);
            context.closePath();
        }

        if (this.isConcLen.checked) {
            let R = 2*this.f*(nLens - 1); // radius of curvature for both surfaces, according to lens's maker equation
            let d = Math.sqrt(R*R - deviceHalfD*deviceHalfD); // *** value of R cannot be smaller than the deviceHalfD
            let theta = Math.atan2(deviceHalfD, d);
            let halfLensThickness = 6; // eventhough the lens is assumed to be thin, thickness is use in the concave lens drawing (it will looks weird otherwise)
            context.beginPath();
            context.arc((this.x - R)*PpCM - halfLensThickness, this.y*PpCM, R*PpCM, theta, -theta, true);
            context.arc((this.x + R)*PpCM + halfLensThickness, this.y*PpCM, R*PpCM, Math.PI + theta, Math.PI - theta, true);
            context.closePath();
        }

        if (this.isConvLen.checked) {
            let R = 2*this.f*(nLens - 1); // radius of curvature for both surfaces, according to lens's maker equation
            let d = Math.sqrt(R*R - deviceHalfD*deviceHalfD); // *** value of R cannot be smaller than the deviceHalfD
            let theta = Math.atan2(deviceHalfD, d);
            context.beginPath();
            context.arc((this.x + d)*PpCM, this.y*PpCM, R*PpCM, Math.PI - theta, Math.PI + theta, false);
            context.arc((this.x - d)*PpCM, this.y*PpCM, R*PpCM, -theta, theta, false);
            context.closePath();
        }
    }

    fillShape() {
        if (this.isConcMir.checked || this.isConvMir.checked) {
            context.fillStyle = '#9ce4ff';
            context.fill();
        } else {
            context.fillStyle = '#DDF2FF99';
            context.fill();
        }
    }

    highlight() {
        context.strokeStyle = '#BDB76B';
        context.lineJoin = 'round';
        context.lineWidth = 4;
        context.stroke();
    }

    drawBubble() {
        context.beginPath();
        context.roundRect(this.x*PpCM - bubbleShape.w/2, (this.y - deviceHalfD)*PpCM - bubbleShape.h - bubbleShape.elevation, bubbleShape.w, bubbleShape.h, bubbleShape.corner);
        context.moveTo(this.x*PpCM, (this.y - deviceHalfD)*PpCM - bubbleShape.elevation + bubbleShape.hPointer);
        context.lineTo(this.x*PpCM - bubbleShape.wPointer/2, (this.y - deviceHalfD)*PpCM - bubbleShape.elevation);
        context.lineTo(this.x*PpCM + bubbleShape.wPointer/2, (this.y - deviceHalfD)*PpCM - bubbleShape.elevation);
        context.closePath();

        context.fillStyle = '#FFFFFFAA';
        context.fill();

        context.font = '16px Arial';
        context.fillStyle = '#000000';
        context.fillText("focus = " + parseFloat(this.f).toFixed(1) + " cm", this.x*PpCM - 52, (this.y - deviceHalfD)*PpCM - 66);
    }
}

class Object {
    constructor(x, y) {
        // position
        this.x = x;
        this.y = y;

        this.isHovered = false;
        this.isSelected = false;
        this.isDragged = false;

        // create HTML elements for user input
        this.inputDiv = document.createElement('div');
    }

    update() {
        return;
    }

    createShapePath() {
        context.beginPath();
        context.arc(this.x*PpCM, this.y*PpCM, objClickableAreaRadius + 12, 0, 2*Math.PI, false); // plus 12 pixels for radius to make it easier to hit the object with small mobile screen
    }

    fillShape() {
        context.beginPath();
        context.arc(this.x*PpCM, this.y*PpCM, objClickableAreaRadius, 0, 2*Math.PI, false); // redraw the path with no plus 12 hit box fix
        
        context.fillStyle = '#f2f7bc';
        context.fill();
    }

    highlight() {
        context.beginPath();
        context.arc(this.x*PpCM, this.y*PpCM, objClickableAreaRadius, 0, 2*Math.PI, false); // redraw the path with no plus 12 hit box fix

        context.strokeStyle = '#BDB76B';
        context.lineJoin = 'round';
        context.lineWidth = 4;
        context.stroke();
    }

    drawBubble() {
        return;
    }
}

class Image {
    update(object, device, leftToRight) {
        this.leftToRight = leftToRight;

        if (leftToRight == true) {
            this.s = device.x - object.x;
        } else {
            this.s = object.x - device.x;
        }

        if (device.isConcMir.checked || device.isConvLen.checked) {
            this.f = device.f;
        } else {
            this.f = -device.f;
        }

        if (this.s == this.f) {
            this.sPrime = 99999999999999; // in case of image formed at infinity
        } else {
            this.sPrime = (this.s*this.f)/(this.s - this.f);
        }
        
        if (device.isConcLen.checked || device.isConvLen.checked) {
            if (leftToRight == true) {
                this.x = device.x + this.sPrime;
            } else {
                this.x = device.x - this.sPrime;
            }
        } else {
            if (leftToRight == true) {
                this.x = device.x - this.sPrime;
            } else {
                this.x = device.x + this.sPrime;
            }
        }
        this.m = -this.sPrime/this.s;
        this.objectHeight = principalAxis - object.y;
        this.imageHeight = this.m*this.objectHeight;
        this.y = principalAxis - this.imageHeight;

        if (this.sPrime >= 0) {
            this.isRealImage = true;
        } else {
            this.isRealImage = false;
        }
    }

    drawRayDiagram(object, device, color) {
        // in case of negative s (virtual object), ray diagram will not be drawn
        if (this.s < 0) {
            drawRay(object.x, object.y, this.x, this.y, '#db6b8d');

            context.fillStyle = '#eeeeeedd';
            context.strokeStyle = '#db6b8d';
            context.lineWidth = 1;
            context.beginPath();
            context.arc(PpCM*(object.x + this.x)/2, PpCM*(object.y + this.y)/2, 12, 0, 2*Math.PI, false);
            context.fill();
            context.stroke();

            context.font = '18px Mitr';
            context.fillStyle = '#db6b8d';
            context.fillText('!', PpCM*(object.x + this.x)/2 - 2, PpCM*(object.y + this.y)/2 + 6);

            drawVirtualObjectWarning();

            return;
        } 

        // first ray
        drawRay(object.x, object.y, device.x, object.y, color);
        if (Math.abs(this.objectHeight) > deviceHalfD) { // draw a dashed line to show device x position
            let extendSize = 24; // in pixels
            let dashWidth = 4; // in pixels
            let dashSize = [15, 10, 5, 10];
            let color = '#9ce4ff66';
        
            context.setLineDash(dashSize);
        
            context.strokeStyle = color;
            context.lineWidth = dashWidth;
            context.lineCap = 'butt';
            context.beginPath();
            context.moveTo(device.x*PpCM, device.y*PpCM + (Math.abs(this.objectHeight*PpCM) + extendSize));
            context.lineTo(device.x*PpCM, device.y*PpCM - (Math.abs(this.objectHeight*PpCM) + extendSize));
            context.stroke();
            
            context.setLineDash([]);
        }
        if (this.isRealImage) {
            drawRayToBoarder(device.x, object.y, Math.atan2(this.y - object.y, this.x - device.x), color);
        } else {
            drawRayToBoarder(device.x, object.y, Math.atan2(this.y - object.y, this.x - device.x) + Math.PI, color);
            if (device.isConcMir.checked || device.isConvLen.checked) {
                drawDash(device.x, object.y, this.x, this.y, color);
            } else if (device.isConvMir.checked) {
                drawDash(device.x, object.y, device.x - this.f, device.y, color);
            } else if (device.isConcLen.checked) {
                if (this.leftToRight == true) {
                    drawDash(device.x, object.y, device.x + this.f, device.y, color);
                } else {
                    drawDash(device.x, object.y, device.x - this.f, device.y, color);
                }
            }
        }
    
        // second ray
        if (device.isConcLen.checked || device.isConvLen.checked) { // for lens
            drawRayToBoarder(object.x, object.y, Math.atan2(device.y - object.y, device.x - object.x), color);
            if (this.isRealImage == false && device.isConvLen.checked) {
                drawDash(object.x, object.y, this.x, this.y, color);
            }
        } else { // for mirror
            let xCenter = device.x - 2*this.f;
            let yCenter = principalAxis;
            let alpha = Math.atan2(object.y - yCenter, object.x - xCenter);
            let xHitMir;
            let yHitMir;
            if (object.x > xCenter) {
                xHitMir = 2*this.f*Math.cos(alpha) + xCenter;
                yHitMir = 2*this.f*Math.sin(alpha) + yCenter;
            } else {
                xHitMir = -2*this.f*Math.cos(alpha) + xCenter;
                yHitMir = -2*this.f*Math.sin(alpha) + yCenter;
            }

            drawRay(object.x, object.y, xHitMir, yHitMir, color) // to hit point
            // draw extended mirror
            let extendSize = Math.PI/(10*device.f);
            let extendThickness = 6; // in pixels
            let flipAngle; // flip an angle of extended mirror in the case of convex mirror
            if (device.isConvMir.checked) {
                flipAngle = Math.PI;
            } else {
                flipAngle = 0;
            }
            context.fillStyle = '#9ce4ff66';
            context.beginPath();
            if (object.x > xCenter) {
                if (object.y < principalAxis) {
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM, alpha - extendSize + flipAngle, 0 + flipAngle, false);
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM + extendThickness, 0 + flipAngle, alpha - extendSize + flipAngle, true);
                } else {
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM, alpha + extendSize + flipAngle, 0 + flipAngle, true);
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM + extendThickness, 0 + flipAngle, alpha + extendSize + flipAngle, false);
                }
            } else {
                if (object.y < principalAxis) {
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM, alpha - Math.PI + extendSize + flipAngle, 0 + flipAngle, true);
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM + extendThickness, 0 + flipAngle, alpha - Math.PI + extendSize + flipAngle, false);
                } else {
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM, alpha - Math.PI - extendSize + flipAngle, 0 + flipAngle, false);
                    context.arc(xCenter*PpCM, yCenter*PpCM, 2*device.f*PpCM + extendThickness, 0 + flipAngle, alpha - Math.PI - extendSize + flipAngle, true);
                }
            }
            context.closePath();
            context.fill();
            // from hit point to boarder
            if (object.x > xCenter) {
                drawRayToBoarder(xHitMir, yHitMir, alpha - Math.PI, color);
            } else {
                drawRayToBoarder(xHitMir, yHitMir, alpha, color);
            }
            if (this.isRealImage == false) {
                if (device.isConvMir.checked) {
                    drawDash(xHitMir, yHitMir, device.x - 2*this.f, device.y, color);
                } else {
                    drawDash(xHitMir, yHitMir, this.x, this.y, color);
                }
            }
        }
    }

    drawImage(color) {
        drawArrow(this.x, this.y, color);
    }

    writeDownCalculation() {
        context.beginPath();
        context.roundRect(990, 80, 180, 190, 8);
        context.fillStyle = '#ffffffAA';
        context.fill();

        context.drawImage(calculationImage, 990, 80);

        context.font = '15px Arial';
        context.fillStyle = '#000000';

        context.fillText(parseFloat(this.f).toFixed(1) + ' cm', 1022, 181);
        context.fillText(parseFloat(this.s).toFixed(1) + ' cm', 1022, 212.2);
        context.fillText(parseFloat(this.sPrime).toFixed(1) + ' cm', 1022, 243.8);
    }
}

function onEachStep() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    contextTop.clearRect(0, 0, canvas.width, canvas.height);

    setConstraint();
    drawArrow(equipments[0].x, equipments[0].y, '#ffffff'); // draw first object

    if (imageToDisplay == 0 && numberOfImages > 1) {
        showCalculation.style.display = 'none';
    } else {
        showCalculation.style.display = 'block';
    }

    imagesFormationInfoUpdate();
    for (let i = 0; i < numberOfImages; i++) {
        let colorIndex = i % (colorCycle.length);

        // create and calculate all image
        images.push(new Image());
        let object;
        if (i == 0) {
            object = equipments[0];
        } else {
            object = images[i - 1];
        }
        let equiNumIndex;
        let isleftToRight;
        if (isReflected == true && i >= reflectedAt) {
            equiNumIndex = 2*reflectedAt - i - 1;
            isleftToRight = false;
        } else {
            equiNumIndex = i + 1;
            isleftToRight = true;
        }
        images[i].update(object, equipments[equiNum[equiNumIndex]], isleftToRight);

        // draw images according to the calculation
        if (imageToDisplay == 0) { // when display all images
            images[i].drawRayDiagram(object, equipments[equiNum[equiNumIndex]], colorCycle[colorIndex]);
            images[i].drawImage(colorCycle[colorIndex]);
            drawFocusAndCenter(equipments[equiNum[equiNumIndex]]);
            if (calculationIsShowed && (numberOfImages == 1)) {
                images[i].writeDownCalculation();
            }
        } else if (imageToDisplay == i+1) { // when select certain image to be displayed
            images[i].drawRayDiagram(object, equipments[equiNum[equiNumIndex]], colorCycle[colorIndex]);
            if (i > 0) {
                images[i-1].drawImage(colorCycle[(i-1) % (colorCycle.length)]);
            }
            images[i].drawImage(colorCycle[colorIndex]);
            drawFocusAndCenter(equipments[equiNum[equiNumIndex]]);
            if (calculationIsShowed) {
                images[i].writeDownCalculation();
            }
        }
    }
    images = [];

    for (let i = 0; i < equipments.length; i++) {
        equipments[i].update();

        equipments[i].createShapePath();
        equipments[i].fillShape();
        if (equipments[i].isHovered || equipments[i].isSelected) {
            equipments[i].highlight();
        }
        if (equipments[i].isSelected) {
            equipments[i].drawBubble();
            equipments[i].inputDiv.style.display = 'block';
        } else {
            equipments[i].inputDiv.style.display = 'none';
        }
    }

    updateRemoveButton();
    writeTextForWhichImageIsDisplaying(imageToDisplay);
}
 
function animFrame() {
    requestAnimationFrame(animFrame);
    onEachStep();
}

function init() {
    addDeviceButton.addEventListener('click', addDevice);
    removeDeviceButton.addEventListener('click', removeDevice);
    previousButton.addEventListener('click', previous);
    nextButton.addEventListener('click', next);
    showCalculation.addEventListener('click', handleShowCalculation);

    canvasTop.addEventListener('pointermove', onMove);
    canvasTop.addEventListener('pointerdown', onClick);

    index = 1;
    timeAtLoad = (new Date().getTime())/1000;
    imageToDisplay = 0;
    calculationIsShowed = false;

    equipments.push(new Object(15, principalAxis - initObjSize));
    addDevice(); // start with one device
    equiNum = createNumberArray(equipments.length);

    animFrame();
}

window.onload = init;

function onMove(evt) {
    for (let i = 0; i < equipments.length; i++) {
        equipments[i].createShapePath();
        if (context.isPointInPath(convToCanvasX(evt.pageX), convToCanvasY(evt.pageY))) {
            equipments[i].isHovered = true;
        } else {
            equipments[i].isHovered = false;
        }

        if (equipments[i].isDragged) {
            let dx = convToCanvasX(evt.pageX)/PpCM - lastPointerX;
            let dy = convToCanvasY(evt.pageY)/PpCM - lastPointerY;
            equipments[i].x = equipments[i].x + dx;
            equipments[i].y = equipments[i].y + dy;

            equiNum.sort((a, b) => equipments[a].x - equipments[b].x); // arrange the equipmentsNumber[] by equipment's position
        }
    }

    lastPointerX = convToCanvasX(evt.pageX)/PpCM;
    lastPointerY = convToCanvasY(evt.pageY)/PpCM;
}

function onClick(evt) {
    for (let i = 0; i < equipments.length; i++) {
        // fix for making touch device logic make sense
        equipments[i].createShapePath();
        if (context.isPointInPath(convToCanvasX(evt.pageX), convToCanvasY(evt.pageY))) {
            equipments[i].isHovered = true;
            lastPointerX = convToCanvasX(evt.pageX)/PpCM;
            lastPointerY = convToCanvasY(evt.pageY)/PpCM;
        } else {
            equipments[i].isHovered = false;
        }

        if (equipments[i].isHovered) {
            equipments[i].isSelected = true;
            equipments[i].isDragged = true;
            canvasTop.addEventListener('pointerup', () => {
                equipments[i].isDragged = false;
                equipments.sort((a, b) => a.x - b.x); // make sure the equipments is sorted from left to right after dragging
                equiNum = createNumberArray(equipments.length);
            }, {once: true});
        } else {
            equipments[i].isSelected = false;
        }
    }
}

// convert window x coordinate to canvas x coordinate
function convToCanvasX(winX) {
    let rect = canvas.getBoundingClientRect();
    return winX - rect.left - window.scrollX;
}

// convert window y coordinate to canvas y coordinate
function convToCanvasY(winY) {
    let rect = canvas.getBoundingClientRect();
    return winY - rect.top - window.scrollY;
}

function addDevice() {
    let xCreated = 30; // x position of the added device

    // prevent the device to be add to the left of the object (equipment[0])
    if (equipments[0].x > 30) {
        xCreated = equipments[0].x + 5;
    }
    // prevent the added device to overlap the existing device
    for (let i = 0; i < equipments.length; i++) {
        if (Math.abs(xCreated - equipments[i].x) < 2.5) {
            xCreated = xCreated + 5;
        }
    }
    
    equipments.push(new OptDevice(xCreated, principalAxis, 5, index));
    equiNum = createNumberArray(equipments.length);
    index = index + 1;

    equipments.sort((a, b) => a.x - b.x); // make sure the equipments is sorted from left to right after adding a new device
}

function removeDevice() {
    // prevent the object (equipment[0]) from being removed
    if (equipments.length == 1) {
        return;
    }
    // if there is a selected device, remove that device
    for (let i = 1; i < equipments.length; i++) {
        if (equipments[i].isSelected) {
            equipments[i].inputDiv.style.display = 'none';
            equipments.splice(i, 1);
            equiNum = createNumberArray(equipments.length);
            return;
        }
    }
    // if there is no selected device, remove the last device from an equipment array
    equipments.pop();
    equiNum = createNumberArray(equipments.length);
}

function someDeviceSelected() {
    for (let i = 1; i < equipments.length; i++) {
        if (equipments[i].isSelected) {
            return true;
        }
    }
    return false;
}

function updateRemoveButton() {
    if(someDeviceSelected()) {
        removeDeviceButton.setAttribute('value', '\ue872');
        removeDeviceButton.style.fontWeight = '300';
    } else {
        removeDeviceButton.setAttribute('value', '\ue15b');
        removeDeviceButton.style.fontWeight = '700';
    }
}

// draw arrow vertically from principal axis to y coordinate (input in cm)
function drawArrow(x, y, color) {
    let arrowHeadSize = 12; // in pixels
    let arrowWidth = 3; // in pixels
    let xPixel = x*PpCM;
    let yPixel = y*PpCM;
    if (y <= principalAxis) {
        if (principalAxis - y > arrowHeadSize/PpCM) {
            context.strokeStyle = color;
            context.lineWidth = arrowWidth;
            context.beginPath();
            context.moveTo(xPixel, principalAxis*PpCM);
            context.lineTo(xPixel, yPixel + arrowHeadSize);
            context.stroke();
    
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(xPixel, yPixel);
            context.lineTo(xPixel + arrowHeadSize/2, yPixel + arrowHeadSize);
            context.lineTo(xPixel - arrowHeadSize/2, yPixel + arrowHeadSize);
            context.closePath();
            context.fill();
        } else {
            let scale = (principalAxis - y)/(arrowHeadSize/PpCM);
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(xPixel, yPixel);
            context.lineTo(xPixel + (arrowHeadSize/2)*scale, yPixel + arrowHeadSize*scale);
            context.lineTo(xPixel - (arrowHeadSize/2)*scale, yPixel + arrowHeadSize*scale);
            context.closePath();
            context.fill();
        }
    } else {
        if (y - principalAxis > arrowHeadSize/PpCM) {
            context.strokeStyle = color;
            context.lineWidth = arrowWidth;
            context.beginPath();
            context.moveTo(xPixel, principalAxis*PpCM);
            context.lineTo(xPixel, yPixel - arrowHeadSize);
            context.stroke();
    
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(xPixel, yPixel);
            context.lineTo(xPixel + arrowHeadSize/2, yPixel - arrowHeadSize);
            context.lineTo(xPixel - arrowHeadSize/2, yPixel - arrowHeadSize);
            context.closePath();
            context.fill();
        } else {
            let scale = (y - principalAxis)/(arrowHeadSize/PpCM);
            context.fillStyle = color;
            context.beginPath();
            context.moveTo(xPixel, yPixel);
            context.lineTo(xPixel + (arrowHeadSize/2)*scale, yPixel - arrowHeadSize*scale);
            context.lineTo(xPixel - (arrowHeadSize/2)*scale, yPixel - arrowHeadSize*scale);
            context.closePath();
            context.fill();
        }
    }
}

// set equipments position according to some constraints (object always stay on the far left and devices can only move in x-direction)
function setConstraint() {
    let gapLimit = 1; // smallest allowed gap between the object and the first device
    let objHeightLimit = 4; // in cm
    
    for (let i = 1; i < equipments.length; i++) {
        equipments[i].y = principalAxis;
        if (equipments[i].x - equipments[0].x < gapLimit) {
            equipments[i].x = equipments[0].x + gapLimit;
        }
    }

    if (principalAxis - equipments[0].y > objHeightLimit) {
        equipments[0].y = principalAxis - objHeightLimit;
    }
    if (equipments[0].y - principalAxis > objHeightLimit) {
        equipments[0].y = principalAxis + objHeightLimit;
    }
}

// draw animated line representing a light ray from (x1, y1) [cm] to (x2, y2) [cm]
function drawRay(x1, y1, x2, y2, color) {
    let rayWidth = 4; // in pixels
    let dashSize = 10;
    let animatedSpeed = 40; // speed of dashed line offset in pixels per second
    let alphaValue = 'BB' // hex code for alpha value (opacity)

    context.setLineDash([dashSize, dashSize]);
    let offset = (new Date().getTime())/1000 - timeAtLoad;

    context.strokeStyle = '#ffffff' + alphaValue;
    context.lineWidth = rayWidth;
    context.lineCap = 'butt';
    context.beginPath();
    context.lineDashOffset = -offset*animatedSpeed;
    context.moveTo(x1*PpCM, y1*PpCM);
    context.lineTo(x2*PpCM, y2*PpCM);
    context.stroke();

    context.strokeStyle = color + alphaValue;
    context.lineWidth = rayWidth;
    context.beginPath();
    context.lineDashOffset = -offset*animatedSpeed + dashSize;
    context.moveTo(x1*PpCM, y1*PpCM);
    context.lineTo(x2*PpCM, y2*PpCM);
    context.stroke();
    
    context.setLineDash([]);
    context.lineDashOffset = 0;
}

// draw a ray with an specific angle to the x axis, originate at (x1, y1) [cm] to always meet the canvas's boarder
function drawRayToBoarder(x1, y1, theta, color) {
    let longestPossibleLine = Math.sqrt(canvas.width*canvas.width + canvas.height*canvas.height); // longest possible line is the diagonal line
    let dx = longestPossibleLine*Math.cos(theta);
    let dy = longestPossibleLine*Math.sin(theta);

    drawRay(x1, y1, x1 + dx, y1 + dy, color);
}

// draw dashed line from (x1, y1) [cm] to (x2, y2) [cm]
function drawDash(x1, y1, x2, y2, color) {
    let dashWidth = 4; // in pixels
    let dashSize = 10;
    let alphaValue = 'BB' // hex code for alpha value (opacity)

    context.setLineDash([dashSize, dashSize]);

    context.strokeStyle = color + alphaValue;
    context.lineWidth = dashWidth;
    context.lineCap = 'butt';
    context.beginPath();
    context.lineDashOffset = dashSize; // to create a little gap between a dashed line and a light ray
    context.moveTo(x1*PpCM, y1*PpCM);
    context.lineTo(x2*PpCM, y2*PpCM);
    context.stroke();
    
    context.setLineDash([]);
}

// draw a dashed line with an specific angle to the x axis, originate at (x1, y1) [cm] to always meet the canvas's boarder
function drawDashToBoarder(x1, y1, theta, color) {
    let longestPossibleLine = Math.sqrt(canvas.width*canvas.width + canvas.height*canvas.height); // longest possible line is the diagonal line
    let dx = longestPossibleLine*Math.cos(theta);
    let dy = longestPossibleLine*Math.sin(theta);

    drawDash(x1, y1, x1 + dx, y1 + dy, color);
}

// create an array of 0, 1, 2, ..., n-1
function createNumberArray(n) {
    let numberArray = [];
    for (let i = 0; i < n; i++) {
        numberArray.push(i);
    }
    return numberArray;
}

// count how many images have to be formed, and check for if and where the reflection happened
function imagesFormationInfoUpdate() {
    let num = 0;
    for (let i = 1; i < equipments.length; i++) {
        num = num + 1; 
        if (equipments[equiNum[i]].isConcMir.checked || equipments[equiNum[i]].isConvMir.checked) {
            isReflected = true;
            reflectedAt = i;
            num = 2*num - 1;
            break;
        }
        isReflected = false;
        reflectedAt = undefined;
    }

    numberOfImages = num;
}

function previous() {
    if (imageToDisplay == 0) {
        return;
    }
    imageToDisplay = imageToDisplay - 1;
}

function next() {
    if (imageToDisplay == numberOfImages) {
        return;
    }
    imageToDisplay = imageToDisplay + 1;
}

function writeTextForWhichImageIsDisplaying(number) {
    contextTop.font = '24px Mitr';
    contextTop.fillStyle = '#000000';
    if (number == 0) {
        contextTop.fillText("ภาพทั้งหมด", 542, 673);
    } else {
        contextTop.fillText("การเกิดภาพครั้งที่ " + number, 502, 673);
    }
}

function drawFocusAndCenter(device) {
    let radiusSize = 8; // in pixels
    let yToDraw = principalAxis*PpCM;
    let f1X = (device.x - 1*device.f)*PpCM;
    let f2X = (device.x + 1*device.f)*PpCM;
    let c1X = (device.x - 2*device.f)*PpCM;
    let c2X = (device.x + 2*device.f)*PpCM;

    context.beginPath();
    context.arc(f1X, yToDraw, radiusSize, 0, 2*Math.PI, false);
    context.arc(c1X, yToDraw, radiusSize, 0, 2*Math.PI, false);
    context.arc(f2X, yToDraw, radiusSize, 0, 2*Math.PI, false);
    context.arc(c2X, yToDraw, radiusSize, 0, 2*Math.PI, false);
    context.fillStyle = '#FFFFFFBB';
    context.fill();

    context.font = '10px Arial';
    context.fillStyle = '#000000';
    context.fillText("F", f1X - 3, yToDraw + 4);
    context.fillText("F", f2X - 3, yToDraw + 4);
    if (device.isConcMir.checked || device.isConvMir.checked) {
        context.fillText("C", c1X - 4, yToDraw + 4);
        context.fillText("C", c2X - 4, yToDraw + 4);
    } else {
        context.fillText("2F", c1X - 5.5, yToDraw + 4);
        context.fillText("2F", c2X - 5.5, yToDraw + 4);
    }
}

function handleShowCalculation() {
    calculationIsShowed = !calculationIsShowed;
    if (calculationIsShowed) {
        showCalculation.value = showCalculation.value.replace('+','-');
    } else {
        showCalculation.value = showCalculation.value.replace('-','+');
    }
}

function drawVirtualObjectWarning() {
    context.beginPath();
    context.roundRect(410, 510, 380, 80, 8);
    context.fillStyle = '#ffffffAA';
    context.fill();

    context.font = '18px Mitr';
    context.fillStyle = '#c9190c';
    context.fillText('!  เกิดกรณีวัตถุเสมือน (ระยะวัตถุติดลบ)', 435, 540);
    context.fillText('ไม่สามารถวาด Ray Diagram แบบปกติได้', 435, 570);
}