"use strict";
require('constants'),
require('globals'),

require('creep');
//require('spawns');

module.exports.loop = function(){
    Object.assign(global, Memory.constants.actions, Memory.constants.tasks);

    for(var id in Game.spawns) Game.spawns[id].run();
    for(var name in Game.creeps)  Game.creeps[name].run();
    console.log(JSON.stringify(Memory.constants.actions));
    console.log(_.findKey);
    console.log(_.findKey(Memory.constants.actions, 30));
};
