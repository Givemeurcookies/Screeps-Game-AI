global.Event = {
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
