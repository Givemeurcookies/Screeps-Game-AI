"use strict";

StructureSpawn.prototype.run = function(){
    if(!this.memory.maxCreeps) this.memory.maxCreeps = 10;
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];
    if(!this.memory.creeps) this.memory.creeps = [];

    var spawnQueue = this.memory.spawnQueue;

    console.log(colorText('green', 'Creep alive at this spawn: '+this.getAlive().length));

    if(spawnQueue.length > 0 && this.memory.maxCreeps < this.getAlive().length){
        this.createCreep(spawnQueue[0].body, null, spawnQueue[0].memory);
    }
};
StructureSpawn.prototype.requestCreep = function(creepBody, memory){
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];
    this.memory.spawnQueue.push({'body':creepBody, 'memory':memory});
};
StructureSpawn.prototype.getAlive = function(ignoreRecache){
    // Var with all alive creeps
    if(this.memory.creeps && this.my) {
        var returnArray = [];
        if(!ignoreRecache) {
            for (let i in this.memory.creeps){
                var creep = this.memory.creeps[i];
                for (let j in Game.creeps){
                    var globalCreep = Game.creeps[j];
                    if(creep.name == globalCreep.name) returnArray.push(creep);
                }
            }
            this.memory.creeps = returnArray;
        } else {
            returnArray = this.memory.creeps;
        }
        return returnArray;
    } else {
        console.log(colorText('red', 'Tried getting alive creeps, but spawn got amnesia or have misunderstood'));
    }
}
