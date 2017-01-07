"use strict";
require('constants'),
require('globals'),

require('creep');
//require('spawns');

module.exports.loop = function(){
    Object.assign(global, Memory.constants.actions, Memory.constants.tasks);

    for(var id in Game.spawns) Game.spawns[id].run();
    for(var name in Game.creeps) Game.creeps[name].run();

    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        console.log(JSON.stringify('Sources: '+room.find(FIND_SOURCES)));

    }

    for(var taskGiver in Memory.taskGivers){

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
