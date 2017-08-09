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
global.colorText = function(colorName, text){
    var color = getColor(colorName);
    if(!color) throw(new Error('Unknown color passed: '+colorName));
    return '<span style="color:'+color+'">'+text+'</span>';
}
global.getColor  = function(colorName){
    switch(colorName.toLowerCase()){
        case 'red'    : return '#FF9494'; break;
        case 'blue'   : return '#91E5FF'; break;
        case 'green'  : return '#A2FF91'; break;
        case 'orange' : return '#FFD191'; break;
        case 'purple' : return '#CC91FF'; break;
    }
    return false;
}
