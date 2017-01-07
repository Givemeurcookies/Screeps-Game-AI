"use strict";
StructureSpawn.prototype.run = function(){
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];

    spawnQueue = this.memory.spawnQueue;

    console.log(colorText('green', this));

    if(spawnQueue.length > 0){
        this.createCreep(spawnQueue[0].body);
    }
};
StructureSpawn.prototype.requestCreep = function(creepBody){
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];
    this.memory.spawnQueue.push({body:creepBody});
};
