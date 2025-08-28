var pluginEnabled = false;
var toggleText = "Floaty Balloons: Off";
var counterText = "Guests Floated: 0"
var explodeCount = 0;
var guestRate = 10;
var floatSpeed = 3;

var blockItems = [
    "beef_noodles",
    "burger",
    "candyfloss",
    "chicken",
    "chips",
    "chocolate",
    "cookie",
    "doughnut",
    "hot_dog",
    "fried_rice_noodles",
    "funnel_cake",
    "ice_cream",
    "meatball_soup",
    "pizza",
    "popcorn",
    "pretzel",
    "roast_sausage",
    "sub_sandwich",
    "tentacle",
    "toffee_apple",
    "wonton_soup",
    "coffee",
    "drink",
    "fruit_juice",
    "iced_tea",
    "lemonade",
    "soybean_milk",
    "sujeonggwa",
];

var goodWeather = [
    "sunny",
    "partiallyCloudy",
    "cloudy",
    "snow",
];

var floatGuests = [];

var colour1 = 7;
var colour2 = 14;
var colour3 = 18;
var colour4 = 28;

var allColoursChecked = true;
var colour1Checked = false;
var colour2Checked = false;
var colour3Checked = false;
var colour4Checked = false;

//-------------------------------------------------------------------------------------

var pluginState = function () {
	pluginEnabled = !pluginEnabled;

	var msg = { type: "blank", text: "Floaty balloons enabled" };
	if (!pluginEnabled) {
		msg = { type: "blank", text: "Floaty balloons disabled" };
	}
	//park.postMessage(msg);
}

var doSomething = function () {
    //Debug
    //park.postMessage("test");
}

var gameTick = function () {
    if ((date.ticksElapsed % (guestRate * 40) === 0) && (pluginEnabled) && (goodWeather.some(function (e) { return e === climate.current.weather; }))) {
        
		var allGuests = map.getAllEntities("guest");
        var balloonGuests = [];

        //For each guest iterating backwards
        for (var i = allGuests.length -1 ; i > -1; i--) {
            
            var entity = allGuests[i];                        
            var guestItems = entity.items;                        

            //Check if holding baloon and not already selected
            if ((guestItems.some(function (e) { return e.type === "balloon"; })) && (entity.getFlag("positionFrozen") === false)) {

                //Check balloon colour
                if ((allColoursChecked) || (colour1Checked && entity.balloonColour === colour1) || (colour2Checked && entity.balloonColour === colour2) || (colour3Checked && entity.balloonColour === colour3) || (colour4Checked && entity.balloonColour === colour4)) {

                    //Check if holding items that hide balloons
                    var visable = true;
                    for (var j = 0; j < guestItems.length; j++) {
                        if (blockItems.some(function (e) { return e === guestItems[j].type; })) {
                            visable = false;
                        }
                    }

                    if (visable) {
                        //Check if guest can be picked up (not on ride etc)
                        const callback = function (result) {
                            if (result.error === 0) {
                                
                                //Check if guest is on queue tile
                                var tilex = Math.floor(entity.x / 32);
                                var tiley = Math.floor(entity.y / 32);
                                var tile = map.getTile(tilex, tiley);                                
                                if (!tile.elements.some(function (e) { return e.isQueue === true; })) {
                                    balloonGuests.push(entity);
                                }                                
                            }
                        };
                        context.queryAction("peeppickup", { type: 0, id: entity.id, x: 0, y: 0, z: 0, playerId: 0, }, callback);
                    }
                }                          
            } 
        }	

        if (balloonGuests.length > 0) {
            var newFloatGuest = balloonGuests[Math.floor(Math.random() * balloonGuests.length)];
            newFloatGuest.setFlag("positionFrozen", true);
            newFloatGuest.setFlag("leavingPark", true);
            newFloatGuest.setFlag("animationFrozen", true);
            //newFloatGuest.animation = "walking";            
            floatGuests.push({ guest: newFloatGuest, maxHeight: Math.min(newFloatGuest.z + 500, 1900) });
            updateCounter();    //Update float counter 
        }
    }

    if (date.ticksElapsed % (Math.max(1, 6 - floatSpeed)) === 0) {
        for (var k = floatGuests.length -1; k > -1; k--) {
            
            var entity = floatGuests[k];            
            entity.guest.z += (Math.max(1, floatSpeed - 4));
            if (entity.guest.z > entity.maxHeight) {
                floatGuests.splice(k, 1);
                removeEntity(entity.guest);
            }
        }
    }
}

var removeEntity = function (entity) {
    var newExplosion = map.createEntity("explosion_cloud", entity); //Create explosion
    newExplosion.z += 10;	//Move up slightly
    entity.remove();        //Remove guest
}


function updateToggle() {
    // Update button text and pressed state
    var button = window.findWidget("toggle_button");
    button.isPressed = pluginEnabled;
    
    if (pluginEnabled) {
        toggleText = "Floaty Balloons: On";
    }
    else {
        toggleText = "Floaty Balloons: Off";
    }
    button.text = toggleText;

}

function updateCounter() {
    //Update explosion counter
    explodeCount += 1;
    counterText = "Guests Floated: " + explodeCount.toString();    
    var counter = window.findWidget("exp_counter");    
    counter.text = counterText;
}

function updateSpinnerRate(widgetName, delta) {
    //Update guest rate variable and spinner text    
    var spinner = window.findWidget(widgetName);
    guestRate += delta;
    guestRate = Math.max(1, Math.min(600, guestRate));
    spinner.text = secondsToTime(guestRate);
}

function updateSpinnerSpeed(widgetName, delta) {
    //Update float speed variable and spinner text  
    var spinner = window.findWidget(widgetName);
    floatSpeed += delta;
    floatSpeed = Math.max(1, Math.min(10, floatSpeed));
    spinner.text = floatSpeed.toString();
}

function secondsToTime(totalSeconds) {
    //convert total seconds to MM:SS format string
    var minute = (Math.floor(totalSeconds / 60)).toString();
    var second = (totalSeconds % 60).toString();
    if (second.length < 2) {
        second = "0" + second;
    }
    return (minute + ":" + second);
}

function create_window() {
    widgets = []     
    
    // Hire Groupbox
    widgets.push({
        type: 'groupbox',
        name: 'box1',
        x: 5,
        y: 20,
        width: 220,
        height: 70,
        text: "Parameters"
    });

    //Explosions Groupbox
    widgets.push({
        type: 'groupbox',
        name: 'box2',
        x: 5,
        y: 95,
        width: 220,
        height: 120,
        text: "Balloon Colours"
    });
    

    // Guest rate Label
    widgets.push({
        type: 'label',
        name: 'guestRate_label',
        x: 15,
        y: 42,
        width: 150,
        height: 15,
        text: "Time per Float:",
    });
    
    //Guest rate spinner
    widgets.push({
        type: 'spinner',
        name: 'spinnerRate',
        x: 140,
        y: 40,
        width: 60,
        height: 15,
        text: secondsToTime(guestRate),
        
        onDecrement: function onDecrement() {
            var delta
            if (guestRate > 60) {delta = -10 } else { delta = -1 }
            updateSpinnerRate('spinnerRate', delta);
        },
        onIncrement: function onIncrement() {
            var delta
            if (guestRate > 59) { delta = 10 } else { delta = 1 }
            updateSpinnerRate('spinnerRate', delta);
        },
    });

    // Float speed Label
    widgets.push({
        type: 'label',
        name: 'floatSpeed_label',
        x: 15,
        y: 67,
        width: 150,
        height: 15,
        text: "Float Speed:"
    });
    
    //Float speed spinner
    widgets.push({
        type: 'spinner',
        name: 'spinnerSpeed',
        x: 140,
        y: 65,
        width: 60,
        height: 15,
        text: floatSpeed.toString(),
        onDecrement: function onDecrement() {
            updateSpinnerSpeed('spinnerSpeed', -1);
        },
        onIncrement: function onIncrement() {
            updateSpinnerSpeed('spinnerSpeed', +1);
        },
    });

    //Toggle Button
    widgets.push({
        type: 'button',
        name: 'toggle_button',
        x: 15,
        y: 220,
        width: 195,
        height: 30,
        text: toggleText,
        border: true,
        isPressed:pluginEnabled,
        onClick: function onClick() {
            pluginState();
            updateToggle();
        }
    });

    // Num of floaty guests
    widgets.push({
        type: 'label',
        name: 'exp_counter',
        x: 65,
        y: 255,
        width: 150,
        height: 15,
        text: counterText,
    });

    // Colour all Label
    widgets.push({
        type: 'label',
        name: 'colourAll_label',
        x: 15,
        y: 117,
        width: 150,
        height: 15,
        text: "Any Colour:"
    });

    // Colour 1 Label
    widgets.push({
        type: 'label',
        name: 'colour1_label',
        x: 15,
        y: 137,
        width: 150,
        height: 15,
        text: "Colour 1:"
    });

    // Colour 2 Label
    widgets.push({
        type: 'label',
        name: 'colour2_label',
        x: 15,
        y: 157,
        width: 150,
        height: 15,
        text: "Colour 2:"
    });

    // Colour 3 Label
    widgets.push({
        type: 'label',
        name: 'colour3_label',
        x: 15,
        y: 177,
        width: 150,
        height: 15,
        text: "Colour 3:"
    });

    // Colour 4 Label
    widgets.push({
        type: 'label',
        name: 'colour4_label',
        x: 15,
        y: 197,
        width: 150,
        height: 15,
        text: "Colour 4:"
    });

    // colourpicker 1
    widgets.push({
        type: "colourpicker",
        name: 'colour_picker_1',
        colour: colour1,
        x: 85,
        y: 136,
        width: 15,
        height: 15,        
        onChange: function onChange(colour) {
            colour1 = colour;
        }
    });

    // colourpicker 2
    widgets.push({
        type: "colourpicker",
        name: 'colour_picker_2',
        colour: colour2,
        x: 85,
        y: 156,
        width: 15,
        height: 15,
        onChange: function onChange(colour) {
            colour2 = colour;
        }
    });

    // colourpicker 3
    widgets.push({
        type: "colourpicker",
        name: 'colour_picker_3',
        colour: colour3,
        x: 85,
        y: 176,
        width: 15,
        height: 15,
        onChange: function onChange(colour) {
            colour3 = colour;
        }
    });

    // colourpicker 4
    widgets.push({
        type: "colourpicker",
        name: 'colour_picker_4',
        colour: colour4,
        x: 85,
        y: 196,
        width: 15,
        height: 15,
        onChange: function onChange(colour) {
            colour4 = colour;          
        }
    });

    //All Colours Toggle
    widgets.push({
        type: 'checkbox',
        name: 'checkbox_all_colours',
        isChecked: allColoursChecked,
        x: 105,
        y: 115,
        width: 15,
        height: 15,
        onChange: function onChange(isChecked) {
            allColoursChecked = isChecked;
        }
    });

    //Colour 1 Toggle
    widgets.push({
        type: 'checkbox',
        name: 'checkbox_colour_1',
        isChecked: colour1Checked,
        x: 105,
        y: 135,
        width: 15,
        height: 15,
        onChange: function onChange(isChecked) {
            colour1Checked = isChecked;
        }
    });

    //Colour 2 Toggle
    widgets.push({
        type: 'checkbox',
        name: 'checkbox_colour_2',
        isChecked: colour2Checked,
        x: 105,
        y: 155,
        width: 15,
        height: 15,
        onChange: function onChange(isChecked) {
            colour2Checked = isChecked;
        }
    });

    //Colour 3 Toggle
    widgets.push({
        type: 'checkbox',
        name: 'checkbox_colour_3',
        isChecked: colour3Checked,
        x: 105,
        y: 175,
        width: 15,
        height: 15,
        onChange: function onChange(isChecked) {
            colour3Checked = isChecked;
        }
    });

    //Colour 4 Toggle
    widgets.push({
        type: 'checkbox',
        name: 'checkbox_colour_4',
        isChecked: colour4Checked,
        x: 105,
        y: 195,
        width: 15,
        height: 15,
        onChange: function onChange(isChecked) {
            colour4Checked = isChecked;
        }
    });

    // Create the window
    window = ui.openWindow({
        classification: 'Floaty Balloons',
        title: "Floaty Balloons",
        width: 230,
        height: 270,
        //x: 10,
        //y: 50,        
        colours: [12, 12],
        tooltip: "Ver 1.0 by GylesGyles",
        widgets: widgets
    });  
}

//-------------------------------------------------------------------------------------

var main = function () {

	context.subscribe(
		"interval.tick",
		function () {
			gameTick();
		}
	);

	ui.registerMenuItem("Floaty Balloons", function () {
		create_window();
	});

    //ui.registerMenuItem("Debug", doSomething);
};

//-------------------------------------------------------------------------------------

registerPlugin({
	name: "Floaty Balloons",
	version: "1.0",
	authors: ["GylesGyles"],
	type: "local",
    licence: "MIT",
    targetApiVersion: 34,
	main: main
});

/*
                        _____
                      /       \
                    /       ##  \
                   |         ##  |
                   |             |
                   \             /
                    \           /
                     \         /
                       \     /
                         '_'
                          |
                         /
                        |
                         \
                           \
                             \
                             |
                            /
*/