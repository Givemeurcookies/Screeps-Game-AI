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
    room.memory.alertness = 1;
});

eventHandler.add('hostilesGone', function(room){
    room.memory.alertness = 0;
});
module.exports = eventHandler;
