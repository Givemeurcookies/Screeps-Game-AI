"use strict";
var eventObj = {};

var eventHandler = {
    dispatch : function(eventName, params){
        Memory.events[eventName](params);
    },
    add : function(eventName, callback){
        eventObj[eventName] = callback;
        Memory.events = eventObj;
    },
    attach : function(eventName, callback){
        if(Memory.events[eventName]) {
            var oldEvent = Memory.events[eventName];
            Memory.events[eventName] = function(params) {
                oldEvent();
                callback();
            }
            return true;
        } else return false;
    }
};

eventHandler.add('spottedHostiles', function(room){
    console.log("Spotted hostiles, alertness at 3");
    room.memory.alertness = 3;
    room.memory.alertTimer = Game.time;
});

eventHandler.add('hostilesGone', function(room){
    console.log("Hostiles have been gone for some time, alertness decreased");
    if(room.memory.alertness < 0) room.memory.alertness -= 1;
    room.memory.alertTime = Game.time;
});
module.exports = eventHandler;
