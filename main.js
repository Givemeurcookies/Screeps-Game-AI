"use strict";
require('constants'),
require('globals'),

require('creep');
//require('spawns');

module.exports.loop = function(){
    Object.assign(global, Memory.constants.actions, Memory.constants.tasks);

    for(var id in Game.spawns) Game.spawns[id].run();
    for(var name in Game.creeps)  Game.creeps[name].run();
    console.log(Object.prototype.toString.call(Memory.constants.actions));
    console.log(findKey(Memory.constants.actions, 31));
}

function findKey(obj, value) {
    for( var prop in this ) {
        if( this.hasOwnProperty( prop ) ) {
             if( this[ prop ] === value )
                 return prop;
        }
    }
}
