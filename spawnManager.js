/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('spawnManager');
 * mod.thing == 'a thing'; // true
 */
var maxCreepAmount     = 10,
    minimumCreepAmount = 8;

const creepLimits = {
    normal  : {
        minimum : 4,
        soft    : 5,
        hard    : 6,
        max     : 8
    },
    soldier : {
        minimum : 3,
        soft    : 5
    },
    total : 30
};


var spawnManager = {
    /**
      * @param {Object} spawn Spawn to check
    **/
    run : function(spawn){
        var creepBodies   = [[WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE],[WORK, CARRY, WORK, CARRY, WORK, CARRY, MOVE, MOVE, MOVE],[WORK, MOVE, WORK, MOVE, CARRY, CARRY],[WORK, CARRY, MOVE, MOVE],[WORK,CARRY,MOVE]];
        var soldierBodies = [[TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, MOVE, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK],[TOUGH, MOVE, MOVE, MOVE, ATTACK, ATTACK],[ATTACK, MOVE, ATTACK, MOVE], [TOUGH, MOVE, ATTACK, MOVE]];
        var CreepsInRoom  = spawn.room.find(FIND_MY_CREEPS).length;
        if (spawn.room.memory.roomsaround == undefined){
            //console.log("roomsaround is undefined...");
            spawn.room.memory.roomsaround = Game.map.describeExits(spawn.room.name);
        } else {

        }
        // Do now spawn if we got enough creeps or currently sa
        var hostileCreeps = spawn.room.find(FIND_HOSTILE_CREEPS, {filter: function(creep) {return creep.owner != 'Pettingson'}});
        if(!spawn.spawning && spawn.owner) {
            if(CreepsInRoom < creepLimits.normal.max && hostileCreeps.length == 0 || CreepsInRoom == 0){
                var spawnAttempt;
                if(spawn.memory.creepHired){
                    console.log("Trying to spawn hired creep");
                    var creepHired = spawn.memory.creepHired;
                    if(spawn.room.energyAvailable >= this.calculateBodyCost(creepHired.creepBody)){
                        spawnAttempt = spawn.createCreep(creepHired.creepBody, null, {task:creepHired.task, soldier:creepHired.isSoldier, birthroom:spawn.roomName, squad:false});
                    } else {
                        return;
                    }

                    if (!Number.isInteger(spawnAttempt)){
                        console.log("Spawned hired creep");
                        delete spawn.memory.creepHired;
                    }
                } else if(CreepsInRoom < creepLimits.normal.minimum) {
                    //console.log("Creeps below minimum");
                    var body = this.highestSpawnableBody(creepBodies, spawn.room.energyAvailable);
                    if(body){
                        spawnAttempt = spawn.createCreep(body.body, null, {task:{}, soldier:false, birthroom:spawn.roomName, squad : false});
                    }
                } else {
                    var factor = 0;
                    if (CreepsInRoom < creepLimits.normal.soft) factor = 4;
                    else if(CreepsInRoom < creepLimits.normal.hard) factor = 2;
                    else if(CreepsInRoom < creepLimits.normal.max) factor = 1;
                    else return;
                    if(spawn.room.energyCapacityAvailable < 500) factor = 1;
                    var body = this.highestSpawnableBody(creepBodies, spawn.room.energyCapacityAvailable/factor);
                    if(body){
                        spawnAttempt = spawn.createCreep(body.body, null, {task:{}, soldier:false, birthroom:spawn.roomName, squad : false});
                    }
                }
                if(Number.isInteger(spawnAttempt)) {
                    // Assume error here

                    if (spawnAttempt == -6) {
                        return;
                    } else {
                        console.log("Got unhandled error at spawn attempt:"+spawnAttempt);
                    }
                } else {
                    console.log("Spawning creep '"+spawnAttempt+"' at "+spawn);
                }
            } else if(hostileCreeps.length != 0){
                // Hostiles spotted
                console.log("Spawn: Hostiles spotted");
                console.log(JSON.stringify(hostileCreeps));
                Memory.enemycreeps = hostileCreeps;
                if (spawn.room.energyAvailable >= this.calculateBodyCost(soldierBodies[2])) {
                    spawnAttempt = spawn.createCreep(soldierBodies[2], null, {task:{}, soldier:true, birthroom : spawn.roomName, squad : false});
                    console.log("Trying to spawn soldier:"+spawnAttempt);
                } else {
                    console.log("Not enough energy available...");
                }
            }

        }
    },
    calculateBodyCost : function(bodyArray){
        var cost = 0;
        for (var i = 0, il = bodyArray.length; i < il; i++){
            switch(bodyArray[i]){
                case MOVE:
                cost += 50;
                break;
                case WORK:
                cost += 100;
                break;
                case CARRY:
                cost += 50;
                break;
                case ATTACK:
                cost += 80;
                break;
                case RANGED_ATTACK:
                cost += 150;
                break;
                case HEAL:
                cost += 250;
                break;
                case CLAIM:
                cost += 600;
                break;
                case TOUGH:
                cost += 10;
                break;
            }
        }
        return cost;
    },
    hireCreep : function(spawn, params){
        console.log(JSON.stringify(params))
        var creepBody = params.creepBody || [WORK, CARRY, MOVE],
            task      = params.task || {},
            isSoldier = params.isSoldier || false;
        if(spawn == undefined) {
          console.log("Spawn is undefined, cannot hire creep");
          return false;
        }
        if(spawn.memory.creepHired == undefined) {
            spawn.memory.creepHired = {
                'creepBody' : creepBody,
                'task'      : task,
                'isSoldier' : isSoldier
            };
            return true;
        } else return false;
    },
    highestSpawnableBody : function(bodies, energy){
        var bodiesWithCost = [];
        for(var bodyid in bodies){
            var body = bodies[bodyid];
            bodiesWithCost[bodyid] = {
                "body" : body,
                "cost" : this.calculateBodyCost(body)
            }
        }
        var filteredBodies = _.filter(bodiesWithCost, function(bodyObj){ return energy >= bodyObj.cost});
        if(filteredBodies.length == 0) return false;
        var sortedBodies = _.sortBy(filteredBodies, ['cost']);
        return sortedBodies[0];

    },
    generateBody : function(cost, types){
        console.log("generate body is called");
        console.log(JSON.stringify(types));
        if(Object.prototype.toString.call(types) == '[object Array]'){
            // Type is array, we can assume something like [MOVE, ATTACK, TOUGH]
            console.log("Got array and cost of"+cost);

            // All bodyparts are:
            // [MOVE, WORK, CARRY, TOUGH, ATTACK, RANGED_ATTACK, HEAL, RANGED_HEAL, CLAIM]
            // Everything but MOVE and CARRY add fatigue, we also need to figure out
            // the most optimal body compared to cost, the TOUGH bodypart should act
            // as being something to add cheap hitpoints

            // We should also check for compatible bodyparts, i.e some bodyparts such as RANGED_ATTACK
            // and attack can perform an action every tick, we want to optimize for this so
            // a creep can attack both ranged and close at the same tick or heal close and attack ranged etc.

        } else {
            console.log(Object.prototype.toString.call(types));
        }
    }

}
module.exports = spawnManager;
