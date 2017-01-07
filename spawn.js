"use strict";
StructureSpawn.prototype.run = function(){
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];

    var spawnQueue = this.memory.spawnQueue;

    console.log(colorText('green', this));

    if(spawnQueue.length > 0){
        this.createCreep(spawnQueue[0].body, null, spawnQueue[0].memory);
    }
};
StructureSpawn.prototype.requestCreep = function(creepBody, memory){
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];
    this.memory.spawnQueue.push({'body':creepBody, 'memory':memory});
};
