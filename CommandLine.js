/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('CommandLine');
 * mod.thing == 'a thing'; // true
 */

var mod = require("spawnManager");

global.chanceTime = function(chance){
     var randomNumber = Math.random();
     if((chance/100) >= randomNumber) return true;
     else return false;
 }


global.resetTaskMemory = function(){
    console.log("Resetting task memory of all creeps");

    for(var name in Game.creeps){
        var creep = Game.creeps[name];
        if(creep.memory.soldier == 'undefined') creep.memory.soldier = false;
        if(creep.memory.squad == 'undefined') creep.memory.squad = false;
        creep.memory.task = {};
    }
    return("Reset task memory of all creeps");
}
global.removeDead = function(){
    console.log("Removing dead memories");
    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }
    return("Removed dead memories");
}
global.creepsTotal = function(){
    return("Amount of creeps is: "+amountOfCreeps);
}
global.calculateBodyCost = function(body){
    var bodyCost = mod.calculateBodyCost(body),
        returnString = "";
    for (var spawnid in Game.spawns){
        var spawn = Game.spawns[spawnid],
            canSpawn = spawn.room.energyCapacityAvailable >= bodyCost;
        returnString += "\nCan '"+spawn.name+"' spawn this body? ";
        if (!canSpawn) returnString += "No, lacks "+(bodyCost-spawn.room.energyCapacityAvailable)+" energy.";
        else returnString += "Yes! Got "+(spawn.room.energyCapacityAvailable-bodyCost)+" capacity to spare";
    }
    return "Total bodycost:"+bodyCost+returnString;
}
global.testSpawnFunction = function(functionName, args){
    console.log(...args);
    return mod[functionName](...args);
}
