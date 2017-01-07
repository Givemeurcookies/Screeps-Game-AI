"use strict";
require('constants'),
require('globals'),

require('creep');
//require('spawns');

module.exports.loop = function(){
    for(var id in Game.spawns) Game.spawns[id].run();
    for(var name in Game.creeps)  Game.creeps[name].run();
    console.log(taskcode_string[DROP]);
};

// Server, testing push on commit hook over terminal attempt 9
