"use strict";
require('constants'),
require('globals'),

require('creep');
//require('spawns');

module.exports.loop = function(){
    Object.assign(global, Memory.constants.actions, Memory.constants.tasks);
    var taskGivers = [];
    for(var id in Game.spawns) Game.spawns[id].run();
    for(var name in Game.creeps) Game.creeps[name].run();

    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        if(!room.memory.sources) room.memory.sources = room.find(FIND_SOURCES);
        for(let sourceid in room.memory.sources) taskGivers.push(room.memory.sources[sourceid]);
    }

    for(var taskGiver in taskGivers){
        console.log(taskGivers[taskGiver].id);
    }

}

function findKey(obj, value) {
    for( var prop in obj ) {
        if( obj.hasOwnProperty(prop) ) {
             if( obj[prop] === value )
                 return prop;
        }
    }
}
