"use strict";
var amountOfCreeps;
var mod    = require('spawnManager'),
event  = require('EventHandler'),
commandline = require('CommandLine');

//console.log("Event manager: "+JSON.stringify(event));

var once = true,
ssh = false,
endlessLoop = false,
debug = {
    creeps   : false,
    action   : {
        repair : false
    },
    events   : false,
    soldiers : false,
    spawning : false
};

const HARVEST_TASK  = 0,
TRANSFER_TASK = 1,
BUILD_TASK    = 2,
REPAIR_TASK   = 3,
UPGRADE_TASK  = 4,
ATTACK_TASK   = 5,
MOVETO        = 6,
EXPAND        = 7,
PICKUP_TASK   = 8,
WITHDRAW_TASK = 9;

const NO_SOURCES_IN_ROOM   = -10,
NO_SOURCES_AVAILABLE = -11;

// Testing event class
global.dispatchEvent = function(eventName){
    event.dispatch(eventName);
}
global.sayHi = function(){
    event.dispatch('sayHi', "and hello again");
}
global.expandRoom = function(roomID){
    for(var creepid in Game.creeps){
        let creep = Game.creeps[creepid];
        if(creep.pos.roomName == roomID) {
            console.log("Found a creep with correct id, expanding...");
            setTask(creep, EXPAND);
            return;
        }
    }
    return "No creeps in the defined room is available";
}
// End of test functions

// Main loop
module.exports.loop = function () {
    // Add events
    event.add("HI", function(){ console.log("Hi")});

    // Loop over all rooms to check for hostiles and check if towers can attack any hostiles
    for(var roomid in Game.rooms){
        var room = Game.rooms[roomid];
        //  && creep.owner.username != 'Invader'
        var hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {filter: function(creep) {return (creep.owner.username != 'Pettingson')}});
        if(hostileCreeps.length != 0) event.dispatch("spottedHostiles", Game.rooms[roomid]);
        else if(room.memory.alertness != 0 && (Game.time - room.memory.alertTimer) > 200){
            event.dispatch('hostilesGone', Game.rooms[roomid]);
        }
        var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        var damagedCreeps = room.find(FIND_MY_CREEPS, {filter: function(creep){return (creep.hits/creep.hitsMax != 1)}});
        if (hostileCreeps.length != 0)
        towers.forEach(tower => tower.attack(tower.pos.findClosestByRange(hostileCreeps)));
        else if(damagedCreeps.length > 0)
        towers.forEach(tower => tower.heal(damagedCreeps[0]));

    }
    for (var creepid in Memory.enemycreeps){
        /*console.log("Trying to get id of creep: "+Memory.enemycreeps[creepid].id);
        console.log("Trying to get enemy creep reference using id: "+Game.getObjectById(Memory.enemycreeps[creepid].id));*/
        if(Game.getObjectById(Memory.enemycreeps[creepid].id) == null){
            var enemycreep = Memory.enemycreeps[creepid];
            // Check if creep is dead

            // Haunt down the creep if it's draining resources
            var enemypos = new RoomPosition(enemycreep.pos.x, enemycreep.pos.y, enemycreep.pos.roomName);
                  /*console.log("Enemy exit:"+enemypos.findClosestByRange(FIND_EXIT));*/
                  /*for(var i in Game.spawns){
                  mod.hireCreep(Game.spawns[i], {
                  isSoldier: true,
                  task   : {
                  msg  : "Scouting new room",
                  code : MOVETO,
                  target : enemypos.findClosestByRange(FIND_EXIT)
              },
              creepBody : [TOUGH, MOVE, ATTACK, MOVE]
          });
      }*/

      }
    }
// Spawn manager
for(var spawn in Game.spawns){
    var spawn = Game.spawns[spawn];
    mod.run(spawn);
    var links = spawn.room.find(FIND_MY_STRUCTURES, {
      filter:(structure) => {
        return (structure.structureType == STRUCTURE_LINK);
      }
    });
    for(var linkid in links){
      var link = links[linkid];
      var mainlinkid = null, mostStructures = 0;

      for (var jlinkid in links){
          var jlink = links[jlinkid];
          var amountOfStructures = jlink.pos.findInRange(FIND_MY_STRUCTURES, 5, {filter:structure => {
            return structure.structureType == STRUCTURE_EXTENSION
          }}).length;
          if(mostStructures < amountOfStructures) {
            mostStructures = amountOfStructures;
            mainlinkid = jlinkid;
          }
      }
      var mainlink = links[mainlinkid];
      console.log('Main link: '+JSON.stringify(mainlink))
      console.log('Running past this link now:'+JSON.stringify(link));
      if(mainlinkid != linkid && mainlink.energy < (mainlink.energyCapacity/2) && link.energy == link.energyCapacity) {
        console.log("Trying to transfer to main link"+ link.transferEnergy(mainlink));
      }
    }
}

// Creep action manager
// Loops over all creeps in the game to execute actions
for(var name in Game.creeps){
    // If the endless loop is turned to true, we kill this loop
    if(endlessLoop) return;
    var creep = Game.creeps[name], roomController = creep.room.controller;

    // For fun, we made a small chance for the creeps to talk
    if(chanceTime(2)) creep.say("Halleluja!", true);
    else if(chanceTime(1)) creep.say("Hail Stan!", true);
    else if(chanceTime(1)) creep.say("Never.", true);

    // RoomController is highest priority
    if(roomController == undefined) {
        roomController = {
            my : false,
            ticksToDowngrade : 4001
        };
    }
    // If the room controller is below 4000 (really low) ticks we want all creeps to focus on
    // upgrading the controller, this should not usually happen and if it has, there is problably
    // an error in the code preventing the creeps from upgrading
    if(roomController.my && (roomController.ticksToDowngrade <= 4000)) {
        if(!ssh) creep.say("Controller");
        if(creep.carry.energy <= 30) {
            if (once) console.log("Controller: "+findHarvestTarget(creep));
            once = false;

            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0]);
            }
        }
        else {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }

    } else {
        // If creeps have no task memory
        // this happens if the task memory is reset using a command
        if (Object.keys(creep.memory.task).length === 0) {
            if (debug.creeps) console.log(creep.name+": Empty task obj");
            if(!ssh) creep.say("Reset?");
            findTask(creep);
            return;
        }
        // If creeps have no task or task callback
        if(creep.memory.task.code == -1 && creep.memory.task.callback == null) {
            // If creeps have no task or callback
            findTask(creep);

        } else if (creep.memory.task.callback != null && creep.memory.task.code == -1){
            console.log("Callback called");
            // Try to call the callback
            // todo: check if callback is callable
            creep.say("Got task");
            creep.memory.task.callback();

        } else if (creep.memory.task.code != -1){
            // If this is executed, the creep has a task to do
            // todo: check if doTask returns properly
            if(!ssh) creep.say("Dotask");
            doTask(creep, creep.memory.task.code);

        } else {
            // This should not be executed, but if it is
            // creep says "nothing"
            creep.say("Nothing");
        }
    }
}
}

/*
Taskcodes:
-1 : no task
0  : harvest
1  : transfer
2  : build

*/
function findTask(creep){
    if(creep == undefined) console.log("CREEP IS UNDEFINED");
    //console.log(creep.name+": Trying to find new task");
    // Check creep body
    var body = creep.body,
    factor = {
        attack :       body.ATTACK_TASK,
        attackSpeedy : (body.ATTACK_TASK + body.MOVE - (body.WORK + body.CARRY)),
        build   : (body.WORK + body.MOVE + body.CARRY),
        harvest : (body.WORK*0.90 + body.MOVE*0.90 + body.CARRY),
        repair  : (body.WORK*1.1 + body.MOVE*0.90 + body.CARRY*1.1),
        repairSpeedy : (body.WORK*1.1 + body.MOVE*1.5 + body.CARRY)
    }
    //console.log(creep.name+" no energy, no task, no callback");
    creep.say("Find task");
    // Find approperiate task

    // If the creep got sufficient energy (above 70% of energy capacity)
    if((creep.carry.energy/creep.carryCapacity) >= 0.40 && creep.memory.soldier == false) {
        // Try to transfer the energy to energy storage
        //console.log(creep.name+" got enough energy");
        //try{
        //console.log(creep.name+" trying to transfer");
        if (setTask(creep, TRANSFER_TASK) == -1 || chanceTime(22)){
            //console.log(creep.name+" trying to build");
            // If no energy transfer is available, we'll try to build something
            if(setTask(creep, REPAIR_TASK) == -1 || chanceTime(45)){
                console.log(creep.name+" trying to build");
                if(setTask(creep, BUILD_TASK) == -1 || chanceTime(22)){
                    console.log(creep.name+" trying to expand");
                    // If we can't build anything, we'll try to expand the base
                    if(setTask(creep, EXPAND) == 1 || chanceTime(50)) {
                        // Try to build again
                        console.log(creep.name+" trying to build again");
                        if (setTask(creep, BUILD_TASK) == -1) {
                            // If we get an error during building even after running
                            // the expand function, we'll report an error here
                            //console.log(creep.name+" trying to upgrade controller");
                            if(setTask(creep, UPGRADE_TASK) == -1){

                            }

                        } else {
                            // OK BUILD_TASKING
                        }
                    } else {
                        console.log(creep.name+" unable to expand");
                        if(setTask(creep, UPGRADE_TASK) == -1) {

                        }
                    }
                } else {
                    // OK BUILD_TASKING (NO EXPAND)
                }
            }
        } else {
            // OK TRANSFER_TASK
        }
        //} catch(err) {
        //    console.log(err.lineNumber+" = "+creep.name+": Got error while trying to set a task: "+err.message);
        //}

    } else if(creep.memory.soldier){

        var hostileCreeps     = creep.room.find(FIND_HOSTILE_CREEPS, {filter: function(creep) {return creep.owner.username != 'Pettingson'}}),
        hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES, {filter: function(creep) {return creep.owner.username != 'Pettingson'}});
        if(hostileCreeps.length != 0) {
            setTask(creep, ATTACK_TASK, {});
        } else if(hostileStructures.length != 0){
            // Check if creep is a part of a squad
            var towers = _.filter(hostileStructures, function(structure){
                return structure.structureType == STRUCTURE_TOWER;
            });
            if (towers.length != 0){
                setTask(creep, ATTACK_TASK, towers);
            } else {
                setTask(creep, ATTACK_TASK, hostileStructures);
            }
        } else {

            // Do task that soldier can do here, i.e scout
            //creep.suicide();
            //setTask(creep, "")
            // If no task, recycle creep
            console.log(creep.name+": soldier, "+creep.pos.findClosestByRange(FIND_MY_SPAWNS));
            setTask(creep, MOVETO, {
                target : creep.pos.findClosestByRange(FIND_MY_SPAWNS)
            });

        }
    } else {
        // Assume we got too low energy
        if(_.sum(creep.carry) == creep.carryCapacity){
            // In case if got storage with other resources than energy
            setTask(creep, TRANSFER_TASK);
            return;
        }

        // Try to harvest
        var hostileCreeps     = creep.room.find(FIND_HOSTILE_CREEPS,
            {filter: function(creep) {return creep.owner.username != 'Pettingson'}}).length;

            if(hostileCreeps == 0 && !chanceTime(33)){
                var resourceDrops     = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
                if(resourceDrops) {
                    setTask(creep, PICKUP_TASK, {'target' : resourceDrops});
                    return;
                } else {
                    console.log(creep.name+" gonna try to withdraw storage");
                    var resourceStorage   = creep.pos.findInRange(FIND_MY_STRUCTURES, 9, {
                        filter: (structure) => {
                            return ((structure.structureType == STRUCTURE_LINK) && (structure.energy > 0))
                        }
                    });
                    if(resourceStorage.length > 0) {
                        console.log(creep.name+" found resource storage");
                        setTask(creep, WITHDRAW_TASK, {'target':resourceStorage[0]});
                        return;
                    }
                }
            }
            let setHarvest = setTask(creep, HARVEST_TASK);
            switch (setHarvest){
                case NO_SOURCES_IN_ROOM:
                console.log(creep.name+" no sources in this room, so why trying to harvest?"); break;
                case NO_SOURCES_AVAILABLE:
                console.log(creep.name+" unable to harvest, no sources available");
                var resourceDrops  = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);
                if(resourceDrops) {
                    setTask(creep, PICKUP_TASK, {'target' : resourceDrops});
                    return;
                }
                break;
            }
        }

    }
    function scout(creep){
        console.log(creep.name+": when scouting: "+JSON.stringify(creep));
        var roomsBeside = Game.map.describeExits(creep.room.name);
        console.log(creep.name+": "+JSON.stringify(roomsBeside));
        mod.hireCreep(creep.room.find(FIND_MY_SPAWNS)[0], {
            soldier: true,
            task   : {
                msg  : "Scouting new room",
                code : MOVETO,
                target : new RoomPosition(25, 25, roomsBeside[3])
            },
            creepBody : [TOUGH, MOVE, ATTACK, MOVE]
        });
    }
    /*
    Taskcodes:
    -1 : no task
    0  : harvest
    1  : transfer
    2  : build

    */
    // Made to set automatic task management, can feed pos, harvest resource etc.
    function setTask(creep, task, params){
        if(params == undefined) params = {};
        switch(task){
            case TRANSFER_TASK:
            var targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) &&
                    structure.energy < structure.energyCapacity;
                }
            });
            if (targets.length > 0){
                var target = creep.pos.findClosestByRange(targets);
                creep.memory.task.target = {
                    id  : target.id,
                    pos : target.pos
                };
                creep.memory.task.msg = "Move to transfer resources at"+target.pos.x +","+target.pos.y;
                creep.memory.task.code = 1;
                doTask(creep, TRANSFER_TASK);
            } else {
                targets = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) &&
                        _.sum(structure.store) < structure.storeCapacity
                    }
                });
                if (targets.length > 0){
                    if(chanceTime(75)) return -1;
                    var target = creep.pos.findClosestByRange(targets);
                    creep.memory.task.target = {
                        id  : target.id,
                        pos : target.pos
                    };
                    creep.memory.task.msg = "Move to transfer resources at"+target.pos.x +","+target.pos.y;
                    creep.memory.task.code = 1;
                    doTask(creep, TRANSFER_TASK);
                } else {
                    return -1;
                }
            }
            break;
            case HARVEST_TASK:
            var harvestTarget = findHarvestTarget(creep);
            switch (harvestTarget) {
                case NO_SOURCES_IN_ROOM:
                case NO_SOURCES_AVAILABLE:
                return harvestTarget;
                break;
            }
            console.log("Harvsest target:"+JSON.stringify(harvestTarget));
            console.log("Get creeps with task: "+JSON.stringify(getCreepsWithTask(HARVEST_TASK, harvestTarget)));
            if(getCreepsWithTask(HARVEST_TASK, harvestTarget).length >= 3) {
                console.log(creep.name+": Too many creeps with this task (harvest)");
                return NO_SOURCES_AVAILABLE;
            }
            try {
                creep.memory.task.target = {
                    id  : harvestTarget.source.id,
                    pos : harvestTarget.source.pos
                };
                creep.memory.task.msg    = 'Move to harvest source at pos:'+harvestTarget.source.pos.x +","+harvestTarget.source.pos.y;
                creep.memory.task.code   = HARVEST_TASK;
            } catch(err) {
                if(debug.creeps) console.log(creep.name+": got error when trying to set harvest task:"+err+" output on next line \n"+JSON.stringify(harvestTarget));
            }
            doTask(creep, HARVEST_TASK);
            break;
            case BUILD_TASK:
            var constructionsite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER)
                }, maxRooms : 1
            });
            if(!constructionsite || chanceTime(10)) constructionsite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {maxRooms : 1});


            if(constructionsite) {
                if(debug.creeps) console.log(creep.name+" trying to set build task");
                creep.memory.task.target = {
                    id  : constructionsite.id,
                    pos : constructionsite.pos
                };
                creep.memory.task.msg    = "Move to build at "+constructionsite.pos.x+","+constructionsite.pos.y;
                creep.memory.task.code   = BUILD_TASK;
                doTask(creep, BUILD_TASK);
            } else {
                return -1;
            }
            break;
            case REPAIR_TASK:
            var repairsite;
            if(typeof params.target == 'undefined'){
                if(debug.action.repair) console.log(creep.name+" undefined parameters, trying to figure out repairsite target");
                repairsite = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: function(structure){
                        return (structure.hits < (structure.hitsMax/3) && structure.hits < (20000+50000*creep.room.controller.level));
                    },
                    maxRooms : 1
                });
            } else {
                if(debug.action.repair) console.log(creep.name+" setting repair target to defined params")
                repairsite = params.target;
            }
            if(debug.action.repair) console.log(creep.name+" trying to set repair task");
            if(repairsite) {
                if(debug.action.repair) console.log(creep.name + ": found repair site, going to repair");
                creep.memory.task.target = {
                    id  : repairsite.id,
                    pos : repairsite.pos
                };
                creep.memory.task.msg    = "Move to repair at "+repairsite.pos.x+","+repairsite.pos.y;
                creep.memory.task.code   = REPAIR_TASK;
                doTask(creep, REPAIR_TASK);
            } else {
                if(debug.action.repair) console.log(creep.name+" got error when trying to set repair "+repairsite);
                return -1;
            }
            break;
            case UPGRADE_TASK:
            var roomController = creep.room.controller;
            if(roomController == 'undefined') return -1;
            try {
                creep.memory.task.target = {
                    id  : roomController.id,
                    pos : roomController.pos
                };
                creep.memory.task.msg  = 'Move to upgrade controller';
                creep.memory.task.code = UPGRADE_TASK;
            } catch(err) {
                if(debug.creeps) console.log(creep.name+": got error when trying to set harvest task:"+err);
            }
            doTask(creep, UPGRADE_TASK);
            break;
            case PICKUP_TASK:
            var pickuplocation = params.target;
            if(!params) pickuplocation = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY);

            if(pickuplocation) {
                creep.memory.task = {
                    code   : PICKUP_TASK,
                    msg    : 'Move to pick up resources at '+pickuplocation.pos.x+', '+pickuplocation.pos.y,
                    target : {
                        id : pickuplocation.id,
                        pos : pickuplocation.pos
                    }
                };
            }

            doTask(creep, PICKUP_TASK);
            break;
            case EXPAND:
            if (!once) {
                console.log("Already expanded this tick...");
                return -1
            };
            once = false;
            if(debug.creeps) console.log(creep.name+": Trying to expand...");
            var closestSpawn   = creep.pos.findClosestByRange(FIND_MY_SPAWNS),
            sources        = creep.room.find(FIND_SOURCES),
            storage        = creep.room.find(FIND_MY_STRUCTURES, {filter:(structure) => {
                return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER)
            }}),
            roomController = [creep.room.controller],
            keyPaths       = [],
            keyPoints      = [];

            if(roomController != undefined) {
                keyPoints = sources.concat(roomController);
                if (storage != undefined){
                    console.log(JSON.stringify(storage));
                    keyPoints = keyPoints.concat(storage);
                    console.log("Concat storage with roads")
                }
            } else {
                keyPoints = sources;
            }
            for(var keyid in keyPoints){
                // Can't get the pos of null
                if(creep.room.controller.my) {}
                for(var sid in storage){
                    keyPaths.push(creep.room.findPath(storage[sid].pos, keyPoints[keyid].pos, {
                        ignoreCreeps : true,
                        swampCost    : 1
                    }));
                }
                keyPaths.push(creep.room.findPath(closestSpawn.pos, keyPoints[keyid].pos, {
                    ignoreCreeps : true,
                    swampCost    : 1
                }));
                keyPaths.push(creep.room.findPath(creep.room.controller, keyPoints[keyid].pos, {
                    ignoreCreeps : true,
                    swampCost    : 1
                }));
            }
            // -4y
            // +4x
            var honeycombPos = closestSpawn.pos;
            honeycombPos.x += 5;
            honeycombPos.y -= 5;
            createHoneycomb(creep, honeycombPos);
            console.log(creep.name+": Done pushing for honeycomb pattern");
            for (var keyid in keyPaths){
                var keyPath = keyPaths[keyid];
                console.log(creep.name+": "+JSON.stringify(keyPath));
                for (var pathid in keyPath){
                    creep.room.createConstructionSite(keyPath[pathid].x, keyPath[pathid].y, STRUCTURE_ROAD);
                }
            }



            return 1;
            break;
            case ATTACK_TASK:
            if (!params.targets) var targets = creep.room.find(FIND_HOSTILE_CREEPS, {filter: function(creep) {return creep.owner.username != 'Pettingson'}});
            if(targets.length != 0){
                var closestTarget = creep.pos.findClosestByPath(targets);
                console.log(creep.name+" attacking:"+closestTarget);
                creep.memory.task.target =  {
                    id  : closestTarget.id,
                    pos : closestTarget.pos
                };
                creep.memory.task.msg  = "Moving to attack "+closestTarget.pos.x+"x, "+closestTarget.pos.y+"y";
                creep.memory.task.code = ATTACK_TASK;
                doTask(creep, ATTACK_TASK);
            } else {
                return -1;
            }
            break;
            case WITHDRAW_TASK:
            creep.memory.task.target = {
                id  : params.target.id,
                pos : params.target.pos
            }
            creep.memory.task.msg = "Moving to withdraw at "+params.target.pos.x+"x, "+params.target.pos.y+"y";
            creep.memory.task.code = WITHDRAW_TASK;
            doTask(creep, WITHDRAW_TASK)
            break;
            case MOVETO:
            console.log(creep.name+" params "+JSON.stringify(params));
            creep.memory.task.target = {
                id  : params.target.id,
                pos : params.target.pos
            };
            creep.memory.task.msg = "Moving towards target at "+params.target.pos.x+"x, "+params.target.pos.y+"y";
            creep.memory.task.code = MOVETO;
            if(params.callback) creep.memory.task.callback = params.callback;
            doTask(creep, MOVETO);
            break;

            default:
            console.log(creep.name+" - type error (setTask): "+task);
        }
    }
    function doTask(creep, task, params){
        var targetGameobj = Game.getObjectById(creep.memory.task.target.id);
        if((creep.carry.energy/creep.carryCapacity) != 1) {
            //console.log(creep.name+" got storage left, gonna check for energy to pick up...");
            creep.room.find(FIND_DROPPED_RESOURCES).forEach(function(resource){
                if(creep.pos.isNearTo(resource)) creep.pickup(resource);
            });
        }
        switch(task){
            case TRANSFER_TASK:
            if (creep.carry == 0) {
                console.log(creep.name+": Out of resources, finding new task");
                findTask(creep);
            }

            var transferResult = creep.transfer(targetGameobj, RESOURCE_ENERGY);

            if (transferResult == ERR_NOT_IN_RANGE) {
                if(!ssh) creep.say("Carrying");
                if(creep.pos.inRangeTo(targetGameobj, 5)){
                    doTask(creep, MOVETO, {reusePath:2});
                } else {
                    doTask(creep, MOVETO);
                }
            } else if(transferResult == 0){
                if(!ssh) creep.say("Transfer");

                if (creep.carry == 0) {
                    console.log(creep.name+": Out of resources, finding new task");
                    findTask(creep);
                } else if (targetGameobj.energy == targetGameobj.energyCapacity)
                if(setTask(creep, TRANSFER_TASK) == -1) findTask(creep);

                return true;
            } else {

                if(transferResult == -7){
                    console.log(creep.name+"Invalid source:"+ (JSON.stringify(targetGameobj)));
                    console.log(creep.name+"Source id:"+creep.memory.task.target.id);
                    findTask(creep);
                } else if(transferResult == -6){
                    // Creep doesn't have enough energy
                    findTask(creep);
                } else if (transferResult == -8){
                    // Energy source is full
                    // Give all creeps who's trying to transfer energy to this source a new task
                    // this also includes the current creep
                    var creepsWithSameTask = getCreepsWithTask(1, creep.memory.task.target);
                    for (var id in creepsWithSameTask){
                        var thiscreep = creepsWithSameTask[id];
                        if(setTask(thiscreep, TRANSFER_TASK) == -1){
                            findTask(creepsWithSameTask[id]);
                        }
                    }

                } else {
                    console.log(""+creep.name+" got unhandled error when trying to transfer:"+transferResult);
                }
            }
            break;
            case HARVEST_TASK:
            var transferTarget = [];
            if(isCreepNextToSource(creep)){
                if(debug.creeps) console.log(creep.name+"Creep is next to source");
                var closeCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {filter: (closecreep)=> {return closecreep.name != creep.name}});
                if(closeCreeps.length > 0) {
                    if(debug.creeps) console.log(creep.name+" is close to another creep "+closeCreeps[0].name);
                    closeCreeps.forEach(function(closecreep){
                        if(!isCreepNextToSource(closecreep) && _.sum(closecreep.carry) != closecreep.carryCapacity) transferTarget.push(closecreep);
                    });
                } else {
                    if(debug.creeps) console.log(creep.name+" mining, but not close to another creep, trying to find link");
                    var isNextToLink = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: (structure) => {return structure.structureType == STRUCTURE_LINK}});
                    if(isNextToLink.length > 0){
                        if(debug.creeps) console.log(creep.name+" is next to link, transferring into link");
                        transferTarget.push(isNextToLink[0]);
                    }
                }
            }
            if(transferTarget.length > 0) {
                console.log("Trying to transfer to target "+transferTarget[0].name+" return code "+creep.transfer(transferTarget[0], RESOURCE_ENERGY));
            }
            // Check if energy capacity is full first
            if (_.sum(creep.carry) == creep.carryCapacity) {
                // console.log(creep.name+" done with harvesting, finding new task");
                findTask(creep);
                return 'done';
            } else {

                var harvestAttempt = creep.harvest(targetGameobj);
                if(harvestAttempt == ERR_NOT_IN_RANGE) {
                    if(creep.pos.inRangeTo(targetGameobj, 5)){
                        if(creep.moveTo(targetGameobj, {
                            reusePath : 1
                        }) == -2){
                            setTask(creep, HARVEST_TASK);
                        }

                    } else {
                        doTask(creep, MOVETO);
                    }
                    return true;
                } else if(harvestAttempt == ERR_INVALID_TARGET) {
                    creep.say("-7");
                    console.log(creep.name+" invalid source when trying to harvest, harvestResult output:\n"+JSON.stringify(creep.memory.target));
                    return false;
                } else if(harvestAttempt == ERR_BUSY) {
                    // Assume creep is still spawning
                    //console.log(creep.name+" is still spawning, can't harvest");
                    return true;
                } else if(harvestAttempt == ERR_NOT_ENOUGH_RESOURCES){

                    findTask(creep);
                } else {
                    if(harvestAttempt == 0) {
                        creep.say(Math.floor(_.sum(creep.carry)/creep.carryCapacity*100)+"%");
                        return true;
                    }
                    console.log(creep.name+" got unhandled error right after giving new task of harvesting:"+harvestAttempt);
                }
            }
            break;
            case BUILD_TASK:

            if (creep.carry == 0) {
                console.log(creep.name+": Out of resources, can't build, finding new task");
                findTask(creep);
            }

            var buildAttempt = creep.build(targetGameobj);

            switch(buildAttempt){
                case ERR_NOT_IN_RANGE: creep.moveTo(targetGameobj); break;
                case ERR_NOT_ENOUGH_RESOURCES:
                case ERR_INVALID_TARGET:
                findTask(creep);
                break;
                case ERR_RCL_NOT_ENOUGH:
                setTask(creep, UPGRADE_TASK);
                break;
                case OK:
                if(creep.pos.findInRange(FIND_SOURCES, 1).length > 0){
                    console.log(creep.name+": In range to source, moving out of the way");
                    doTask(creep, MOVETO);
                }
                if(targetGameobj.progress+(creep.getActiveBodyparts(WORK)*5) >= targetGameobj.progressTotal) {
                    console.log(creep.name+" CONSTRUCTION SITE IS DONE");
                    if(targetGameobj.structureType == STRUCTURE_RAMPART || targetGameobj.structureType == STRUCTURE_WALL){
                        console.log("STRUCTURE IS RAMPART OR WALL, REPAIRING");
                        creep.memory.task.target = {
                            id  : targetGameobj.id,
                            pos : targetGameobj.pos
                        };
                        creep.memory.task.msg    = "Move to repair at "+targetGameobj.pos.x+","+targetGameobj.pos.y;
                        creep.memory.task.code   = REPAIR_TASK;
                    }
                }
                return true; break;
                default: console.log(creep.name+": got error when building "+buildAttempt); return false;
            }
            break;

            case UPGRADE_TASK:
            if (creep.carry == 0) findTask(creep);

            var upgradeAttempt = creep.upgradeController(targetGameobj);
            if(upgradeAttempt == ERR_NOT_IN_RANGE) {
                doTask(creep, MOVETO);
            } else if (upgradeAttempt == ERR_NOT_ENOUGH_RESOURCES){
                // Creep is out of resources
                findTask(creep);
            } else {
                //console.log(creep.name+": possible error"+upgradeAttempt)
                doTask(creep, MOVETO);
                return true;
            }
            break;
            case REPAIR_TASK:
            if (creep.carry == 0) {
                console.log("Creep is out of resources, finding new task");
                findTask(creep);
            }
            if (targetGameobj == null) {
                console.log("Target is null, finding new target based on position");
                targetGameobj = new RoomPosition(creep.memory.task.target.pos.x, creep.memory.task.target.pos.y, creep.memory.task.target.pos.roomName).lookFor(LOOK_STRUCTURES)[0];
                creep.memory.task.target = {
                    id  : targetGameobj.id,
                    pos : targetGameobj.pos
                };
            }
            var repairAttempt = creep.repair(targetGameobj);
            if(repairAttempt == ERR_NOT_IN_RANGE) {
                doTask(creep, MOVETO);
            } else if (repairAttempt == ERR_NOT_ENOUGH_RESOURCES){

                findTask(creep);
            } else if (repairAttempt == OK){
                if(creep.pos.findInRange(FIND_SOURCES, 1).length > 0){
                    console.log(creep.name+": In range to source, moving out of the way");
                    doTask(creep, MOVETO);
                }
                if (!ssh) creep.say("Repair");
                if (targetGameobj.hits == targetGameobj.hitsMax && targetGameobj.hitsMax != 1) {
                    findTask(creep);
                }
            } else if (repairAttempt == -7){
                console.log(creep.name+" invalid source when trying to repair"+targetGameobj);
                findTask(creep);
            } else {
                if (!ssh) creep.say("Error");
                console.log(creep.name+" got error when repairing, "+repairAttempt);
                return true;
            }
            break;
            case ATTACK_TASK:
            if(targetGameobj != null) {
                creep.memory.task.target.pos = targetGameobj.pos;
                creep.memory.task.msg  = "Moving to attack "+targetGameobj.pos.x+"x, "+targetGameobj.pos.y+"y";
            } else findTask(creep);
            var attackAttempt = creep.attack(targetGameobj);
            var hostilesInRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
            var rangedAttackAttempt;
            if(hostilesInRange.length > 1) {
                var hostilesRange = {
                    one   : 0,
                    two   : 0,
                    three : 0
                };
                hostilesInRange.forEach(function(creepFoe){
                    if(creep.pos.inRangeTo(creepFoe, 2)) hostilesRange.two++;
                    if(creep.pos.inRangeTo(creepFoe, 1)) hostilesRange.one++;
                });
                hostilesRange.three  = hostilesInRange-hostilesRange.two-hostilesRange.one;
                hostilesRange.two   -= hostilesRange.one;
                if(hostilesRange.one > 0 || hostilesRange.two >= 3 || (hostilesRange.two == 2 && hostilesRange.three >= 2)){
                    rangedAttackAttempt = creep.rangedMassAttack(hostilesInRange);
                } else rangedAttackAttempt = creep.rangedAttack(hostilesInRange[0]);

                console.log("Detected more than 1 within circle of attack, attack result:"+rangedAttackAttempt);
            } else if (hostilesInRange.length == 1){
                console.log("Trying to attack creep from afar"+creep.rangedAttack(hostilesInRange[0]));
            }
            if(attackAttempt == ERR_NOT_IN_RANGE){
                doTask(creep, MOVETO);
            } else {
                console.log(creep.name+" attacking returned code:"+attackAttempt);
                if(attackAttempt == -7) {
                    // Creep is dead or target is invalid
                    findTask(creep);
                }

            }
            break;
            case MOVETO:
            //console.log(creep.name+": (MOVETO) "+JSON.stringify(creep.memory.task.target));
            if(creep.memory.soldier) ScoutMove(creep, task, params);
            else {

                if((creep.carry.energy/creep.carryCapacity) >= 0.40){
                    var buildOnTheGo = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 3);
                    if(buildOnTheGo.length > 0) creep.build(buildOnTheGo[0]);
                } else if(creep.memory.task.code == HARVEST_TASK || creep.memory.task.code == WITHDRAW_TASK){
                    // Get creep to check for links to withdraw from
                    var links = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                      filter:(structure) => {
                        return (structure.structureType == STRUCTURE_LINK) && (structure.energy != 0);
                      }
                    });
                    if(links.length > 0) {
                      Game.notify('Tested code to withdraw resources on the go when needed: '+creep.withdraw(links[0]), 10);
                    }
                }

                var moveAttempt = creep.moveTo(targetGameobj, params);
                if(moveAttempt != 0 && moveAttempt != -11){
                    console.log(creep.name+": Got error when trying to move"+moveAttempt);
                }
            }

            break;
            default:
            console.log(creep.name+" - type error (doTask):"+task);
            creep.say("Type");
            break;
            case PICKUP_TASK:
            if(targetGameobj != null) {
                creep.memory.task.target.pos = targetGameobj.pos;
                creep.memory.task.msg  = "Moving to pickup "+targetGameobj.pos.x+"x, "+targetGameobj.pos.y+"y";
            } else console.log(creep.name+" Uhh, error when trying to do pickup task, target is null");
            var pickupAttempt = creep.pickup(targetGameobj);

            if(pickupAttempt == ERR_NOT_IN_RANGE){
                doTask(creep, MOVETO);
            } else if(pickupAttempt == ERR_FULL){
                findTask(creep);
            } else {
                console.log(creep.name+" picking up returned code:"+pickupAttempt);
                if(pickupAttempt == -7) {
                    // Creep is dead or target is invalid
                    findTask(creep);
                }

            }
            break;
            case WITHDRAW_TASK:
            if(targetGameobj != null) {
                creep.memory.task.target.pos = targetGameobj.pos;
                creep.memory.task.msg  = "Moving to pickup "+targetGameobj.pos.x+"x, "+targetGameobj.pos.y+"y";
            } else console.log(creep.name+" Uhh, error when trying to withdraw, target is null");

            var withdrawAttempt = creep.withdraw(targetGameobj, RESOURCE_ENERGY);

            if(withdrawAttempt == ERR_NOT_IN_RANGE){
                doTask(creep, MOVETO);
            } else if(withdrawAttempt == ERR_FULL || withdrawAttempt == ERR_NOT_ENOUGH_RESOURCES){
                findTask(creep);
            } else {
                console.log(creep.name+" withdrawing returned code:"+withdrawAttempt);
                if(withdrawAttempt == -7) {
                    // If target is invalid
                    findTask(creep);
                }

            }
            break;
        }

    }
    function isCreepNextToSource(creep){
        if(creep.pos.findInRange(FIND_SOURCES, 1).length > 0) return true; else return false;
    }
    function ScoutMove(creep, task, params){
        var roomCache = creep.room;
        var targetGameobj = Game.getObjectById(creep.memory.task.target.id),
        hostileCreeps = roomCache.find(FIND_HOSTILE_CREEPS);
        if (typeof Memory.rooms[creep.room.name] == "undefined"){
            // Find neccessary information
            var sources  = roomCache.find(FIND_SOURCES),
            minerals = roomCache.find(FIND_MINERALS),
            hostileStructures = roomCache.find(FIND_HOSTILE_STRUCTURES);
            // Prepare information about room
            if(hostileCreeps.length && hostileStructures.length){
                // We have spotted enemies in this room
                var hostileSoldiers = _.filter(hostileCreeps, function(hostileCreep){
                    return hostileCreep.getActiveBodyparts(ATTACK) != 0;
                }),
                hostileTowers   = _.filter(hostileStructures, function(structure){
                    return structure.structureType == STRUCTURE_TOWER;
                });
                var hostileInformation = {
                    isHostile   : true,
                    defenseless : !(_.sum(hostileSoldiers) == 0 && _.sum(hostileTowers) == 0),
                    // If hostiles got controller in this room
                    controller  : false,
                    towers : hostileTowers,
                    creeps : hostileSoldiers
                };
            } else {
                var hostileInformation = {
                    isHostile : false
                };
            }
            // Fill information about room
            Memory.roomsMeta[creep.room.name] = {
                // Use to check if room is outdated
                tick        :    Game.time,
                sources     :    roomCache.find(FIND_SOURCES).pos,
                hostile : hostileInformation,
                controller : {
                    level        : roomCache.controller.level,
                    process      : roomCache.controller.process,
                    processTotal : roomCache.controller.processTotal,
                    reserved     : roomCache.controller.reservation,
                    safeMode     : {
                        ticksLeft : roomCache.controller.safeMode,
                        available : roomCache.controller.safeModeAvailable,
                        cooldown  : roomCache.controller.safeModeCooldown
                    }
                }
            }
        }
        var Targetpos = new RoomPosition(creep.memory.task.target.pos.x, creep.memory.task.target.pos.y, creep.memory.task.target.pos.roomName);
        var hostilesInRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        var rangedAttackAttempt;
        if(hostilesInRange.length > 1) {
            var hostilesRange = {
                one   : 0,
                two   : 0,
                three : 0
            };
            hostilesInRange.forEach(function(creepFoe){
                if(creep.pos.inRangeTo(creepFoe, 2)) hostilesRange.two++;
                if(creep.pos.inRangeTo(creepFoe, 1)) hostilesRange.one++;
            });
            hostilesRange.three  = hostilesInRange-hostilesRange.two-hostilesRange.one;
            hostilesRange.two   -= hostilesRange.one;
            if(hostilesRange.one > 0 || hostilesRange.two >= 3 || (hostilesRange.two == 2 && hostilesRange.three >= 2)){
                rangedAttackAttempt = creep.rangedMassAttack(hostilesInRange);
            } else rangedAttackAttempt = creep.rangedAttack(hostilesInRange[0]);

            console.log("Detected more than 1 within circle of attack, attack result:"+rangedAttackAttempt);
        } else if (hostilesInRange.length == 1){
            console.log("Trying to attack creep from afar"+creep.rangedAttack(hostilesInRange[0]));
        }
        var moveAttempt = creep.moveTo(Targetpos, {
            reusePath : 5
        });
        if(moveAttempt == -2) {
            // Can't find path to
            var creepPos = creep.pos;
            var returnedArea = creep.room.lookForAtArea(LOOK_STRUCTURES,
                creep.pos.y-1, creep.pos.x-1, creep.pos.y+1, creep.pos.x+1, true);

                returnedArea.forEach(structure => creep.attack(structure.structure));
                //console.log(creep.attack());
            } else if (moveAttempt == OK && creep.pos == Targetpos){
                console.log("Target pos and creep pos is the same");

            }
            console.log(creep.name+"Is going to move to..."+moveAttempt);
            if (creep.pos.isNearTo(targetGameobj)) {
                creep.pos.findClosestByRange(FIND_MY_SPAWNS).recycleCreep(creep);
            }
        }

        function weightRoom(){

        }
        /*

        ##--##
        #----#
        ##--#

        ######--####
        #####----###
        ##--##--####
        #----###############
        ##--##--############
        #####----###########
        ##--##--############
        #----###############
        ##--##--##########
        #####----###########
        ##--##--##########
        #----##############
        */

        // creep, pos
        function createHoneycomb(creep, pos){
            var modifier = {x:0, y:0};
            for (var i = 0, l = 12; i < l; i++){
                if(i == 1) modifier.x = 1;
                else if(i > 1 && i < 6) {
                    modifier.y = 1;
                    modifier.x = (i-3);
                } else if(i > 5 && i < 10){
                    modifier.y = 2;
                    modifier.x = (i-7);
                } else if (i > 9 && i < 13){
                    modifier.y = 3;
                    modifier.x = (i-10);
                }
                //console.log("Modifier:"+modifier.x+"x, "+modifier.y+"y");
                creep.room.createConstructionSite(pos.x+modifier.x, pos.y+modifier.y, STRUCTURE_EXTENSION);
            }
        }
        function getCreepsNearby(pos, range){

        }
        function getCreepsWithTask(taskcode, target){
            var creepsWithTask = [];
            for(var name in Game.creeps){
                var creep = Game.creeps[name];
                if(creep.memory.task.target == null) continue;
                if(_.isEqual(target.pos, creep.memory.task.target.pos) && taskcode == creep.memory.task.code){
                    creepsWithTask.push(creep);
                }
            }
            // Should probably check that returned array is valid
            return creepsWithTask;
        }

        function findHarvestTarget(creep){
            var sources = creep.room.find(FIND_SOURCES),
            highestAvailable = {
                id     : null,
                value  : 0,
                source : null
            };
            var nextToSource = _.filter(sources, function(source){
                return creep.pos.isNearTo(source) && (source.energy != 0 || source.ticksToRegeneration <= 30);
            });
            if(nextToSource.length != 0){
                return {source : {
                    id : nextToSource[0].id,
                    value : 0
                }};
            }
            if(sources.length <= 0) {
                return NO_SOURCES_IN_ROOM;
            }
            /*for (var sourceid in sources){

            var source = sources[sourceid],
            sourceAccess     = findAccessibleTiles(source.room,source.pos.x - 1, source.pos.y -1, source.pos.x + 1, source.pos.y + 1),
            distanceToSource = creep.pos.getRangeTo(source),
            creepsWithTask   = getCreepsWithTask(0, source).length;
            /*
            sourceAccess.available: 2
            sourceAccess.total: 4
            creepsWithTask: 4
            distance: 25

            */
            /*    if(sourceAccessibility.total == 0) {
            console.log("Totally unexpected answer when finding harvest target... Not adding this");
            continue;
        }

        var algorithm = (2-((creepsWithTask/(sourceAccess.total*2)+1)-sourceAccess.available/sourceAccess.total))





    }*/
    for(var sourceid in sources){
        var source = sources[sourceid];
        if (source.energy == 0) continue;
        //console.log(JSON.stringify(source.room.lookAtArea(source.pos.x - 1, source.pos.y - 1, source.pos.x + 1, source.pos.y + 1)));
        var sourceAccessibility = findAccessibleTiles(source.room, source.pos.x - 1, source.pos.y -1, source.pos.x + 1, source.pos.y + 1);
        //console.log(creep.name+": "+JSON.stringify(source.pos)+": "+JSON.stringify(sourceAccessibility));
        if (sourceAccessibility.available > highestAvailable.value){
            highestAvailable.id    = sourceid;
            highestAvailable.value = sourceAccessibility.available;
        }
    }
    highestAvailable.source = sources[highestAvailable.id];
    if(highestAvailable.id == null) {
        return NO_SOURCES_AVAILABLE;
    }
    //console.log("Highest available source at: "+highestAvailable.source.pos.x+"x, "+highestAvailable.source.pos.y+"y");
    return highestAvailable;
}

// Find how many tiles around a structure is accessible
function findAccessibleTiles(room, x1, y1, x2, y2){
    var tiles = { available: 0.0, total:0 };
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
                    tiles.available += 0.5; tiles.total++;
                }
            }

        }
    }
    return tiles;
}
function getAccessibleTile(room, x1, y1, x2, y2){
    var accessibleTiles = 0.0;
    for (var x = x1, xl = x2+1; x < xl; x++){
        for (var y = y1, yl = y2+1; y < yl; y++){
            //console.log(JSON.stringify(room.lookAt(x, y)));
            var tile = room.lookAt(x, y);
            for (var propertyid in tile) {
                if (tile[propertyid].type == "creep" || tile[propertyid].type == "source"){
                    break;
                } else if (tile[propertyid].terrain == 'plain') {
                    return tile[propertyid];
                } else if (tile[propertyid].terrain == 'swamp') {
                    return tile[propertyid];
                }
            }

        }
    }
    return false;
}
function getRoomCreeps(){
    var creepsPerSpawnArray = {};
    // Populate array
    for(var i in Game.spawns) {
        var spawn = Game.spawns[i];
        creepsPerSpawnArray[i] = spawn.room.find(FIND_MY_CREEPS).length;
    }
    return JSON.stringify(creepsPerSpawnArray);
}
function getTerrainAtPosition(x, y){
    for(var i in Game.spawns) {
        console.log("Get terrain at pos called: "+JSON.stringify(Game.spawns[i].room));
        return JSON.stringify(Game.spawns[i].room.lookAt(x,y));
    }
}
function calculateSpawnImportance(){

}

global.createScoutUnit = function(){
    for(var i in Game.creeps){
        scout(Game.creeps[i]);
        return;
    }
}
