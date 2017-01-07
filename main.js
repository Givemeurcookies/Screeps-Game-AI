"use strict";
require('constants'),
require('globals'),

require('creep');
//require('spawns');

module.exports.loop = function(){
    Object.assign(global, Memory.constants.actions, Memory.constants.tasks);

    for(var id in Game.spawns) Game.spawns[id].run();
    for(var name in Game.creeps)  Game.creeps[name].run();

    console.log(findKey(global, 31));
}

function findKey(obj, value) {
    for( var prop in obj ) {
        if( obj.hasOwnProperty(prop) ) {
             if( obj[prop] === value )
                 return prop;
        }
    }
}
