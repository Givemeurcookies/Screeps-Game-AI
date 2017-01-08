"use strict";
require('constants'),
require('globals'),
require('giver');
require('creep');
require('spawn');
//require('spawns');

module.exports.loop = function(){
    Object.assign(global, Memory.constants.actions, Memory.constants.tasks);
    var taskGivers = [];
    for(var name in Game.creeps) Game.creeps[name].run();
    // Go through rooms!
    // Scroll through givers
    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        if(!room.memory.sources) room.memory.sources = room.find(FIND_SOURCES);
        if(room.controller){
            if(room.controller.my){
                taskGivers.push(room.controller);
            }
            else {

            }
        }
        for(let sourceid in room.memory.sources) taskGivers.push(room.memory.sources[sourceid]);
    }
    for(let i in Game.rooms){
        var room = Game.rooms[i];
        console.log(JSON.stringify(room.givers));
        
        //for(let j in room.givers) room.givers[i].run();
        // get Giver as an object now
        /*
        let giver = Game.getObjectById(taskGivers[giverid].id);
        let creepsInRoom = giver.room.find(FIND_MY_CREEPS);
        // Let's keep this so we can see what giver that's requesting whatever
        console.log(colorText('purple','Giver position: '+JSON.stringify(giver.pos)));
        if(giver instanceof Source){
            // Returns total and available
            var sourceAccess =  findAccessibleTiles(giver.room,
                                giver.pos.x-1, giver.pos.y-1,
                                giver.pos.x+1, giver.pos.y+1);

            if(sourceAccess.available > 0){
                // Request creep to harvest
                if(creepsInRoom.length > 0){
                    // Go over creeps in the room
                    // to see if any are available
                    // and fit for task
                    var creep = giver.pos.findClosestByRange(creepsInRoom, {filter:function(creep){ return !creep.memory.task.busy}});
                    // If any creeps is availabe, otherwise don't do anything
                    if(creep) {
                        console.log(colorText('orange', 'Found creep :: '+creep.name+'Trying to set task from giver'));
                        creep.set({taskCode:ACTION_HARVEST, target:giver});
                    }
                } else if(true) {
                    // We set this value to true until we get a better system
                    // Request a new creep to be spawned
                    var spawns = [];
                    for(var i in Game.spawns){
                        spawns.push(Game.spawns[i]);
                    }
                    //console.log(colorText('blue', giver.pos.findClosestByRange(spawns)));
                    giver.pos.findClosestByRange(spawns).requestCreep([WORK, MOVE, CARRY, MOVE], {
                        task:{
                            busy   : false,
                            target : false,
                            params : false
                        }
                    },
                    giver);
                }
            }
        } else if(giver instanceof StructureController){
            var creep = giver.pos.findClosestByRange(creepsInRoom, {filter:function(creep){ return !creep.memory.task.busy}});
            // If any creeps is availabe, otherwise don't do anything
            if(creep) {
                console.log(colorText('orange', 'Found creep :: '+creep.name+' trying to set task to upgrade'));
                creep.set({taskCode:ACTION_UPGRADE, target:giver});
            }
        }*/


    }
    // Go through spawns and creeps!
    for(var id in Game.spawns) Game.spawns[id].run();
    //for(var name in Game.creeps) Game.creeps[name].run();

}

function findKey(obj, value) {
    for( var prop in obj ) {
        if( obj.hasOwnProperty(prop) ) {
             if( obj[prop] === value )
                 return prop;
        }
    }
}
// Find how many tiles around a structure is accessible
function findAccessibleTiles(room, x1, y1, x2, y2){
    // Checking if right values are passed
    if(!room.name) throw(new Error('Get accessibleTiles, room not passed'));
    let tiles = { available: 0, total:0 };
    for (var x = x1, xl = x2+1; x < xl; x++){
        for (var y = y1, yl = y2+1; y < yl; y++){
            //console.log(JSON.stringify(room.lookAt(x, y)));
            var tile = room.lookAt(x, y);
            for (var propertyid in tile) {
                if(tile[propertyid].type == "source"){
                    break;
                } else if (tile[propertyid].type == "creep"){
                    tiles.available--; tiles.total++;
                } else if (tile[propertyid].terrain == 'plain') {
                    tiles.available++; tiles.total++;
                } else if (tile[propertyid].terrain == 'swamp') {
                    tiles.available++; tiles.total++;
                    //tiles.available += 0.5; tiles.total++;
                }
            }

        }
    }
    return tiles;
}

global.resetSpawnQueue = function(){
    for(let i in Game.spawns){
        let spawn = Game.spawns[i];
        spawn.memory.spawnQueue = [];
    }
}
global.garbageCollect = function(){
    console.log(colorText('orange', 'Collecting garbage!'));
    // Remove all dead creeps
    var burriedCreeps = 0;
    for(let i in Memory.creeps) {
        if(!Game.creeps[i]) {
            burriedCreeps++;
            delete Memory.creeps[i];
        }
    }
    if(burriedCreeps > 0) console.log(colorText('green', 'We burried '+burriedCreeps+' creeps!'));
    else console.log(colorText('orange', 'No creeps burried (up to date)'));
    // If spawn queue is over 5
    for(let i in Game.spawns){
        let spawn      = Game.spawns[i],
            spawnQueue = spawn.memory.spawnQueue;
        // Limit to spawn Queue to the last 10 entries
        if(spawnQueue.length > 5){
            console.log(colorText('orange', 'Slicing spawnQueue of '+spawn.name+' to the last 5 entries (removing '+(spawnQueue.length-5)+' entries)'));
            spawn.memory.spawnQueue = spawnQueue.slice((spawnQueue.length-5), spawnQueue.length);
        }
    }
    return console.log(colorText('purple', 'Done garbage collecting!'));
}
global.resetTaskMemory = function(){
    console.log("Resetting task memory of all creeps");

    for(var name in Game.creeps){
        var creep = Game.creeps[name];
        if(creep.memory.soldier == 'undefined') creep.memory.soldier = false;
        if(creep.memory.squad == 'undefined') creep.memory.squad = false;
        creep.memory.task = {
            target   : false,
            taskCode : false,
            busy     : false
        };
    }
    return("Reset task memory of all creeps");
}
global.killAllCreeps = function(){
    for(var name in Game.creeps){
        var creep = Game.creeps[name];
        creep.set(ACTION_SUICIDE);
    }
}
global.killSomeCreeps = function(numberToKill){
    if(numberToKill == undefined) return 'No number passed in argument';
    for(var name in Game.creeps){
        var creep = Game.creeps[name];
        creep.set(ACTION_SUICIDE);
        numberToKill--;
        if(numberToKill <= 0) break;
    }
}
