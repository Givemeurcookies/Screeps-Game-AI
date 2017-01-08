"use strict";

StructureSpawn.prototype.run = function(){
    if(!this.memory.maxCreeps) this.memory.maxCreeps = 10;
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];
    if(!this.memory.creeps) this.memory.creeps = [];

    var spawnQueue = this.memory.spawnQueue;

    console.log(colorText('green', 'Creep alive at this spawn: '+this.getAlive().length));

    if(spawnQueue.length > 0 && this.memory.maxCreeps > this.getAlive().length){
        this.createCreep(spawnQueue[0].body, null, spawnQueue[0].memory);
    }
};
StructureSpawn.prototype.requestCreep = function(creepBody, memory, requester){
    if(!this.memory.spawnQueue) this.memory.spawnQueue = [];
    // If no request limit is set, then the requester
    if(!requester.memory.requestLimit){
        console.log(colorText('red', requester+' does not have a request limit, denied request'));
    }

    this.memory.spawnQueue.push({'reqId':requester.id, 'body':creepBody, 'memory':memory});
};
StructureSpawn.prototype.getAlive = function(ignoreRecache){
    // Var with all alive creeps
    if(this.memory.creeps && this.my) {
        var aliveCreeps = [];
        if(!ignoreRecache) {
            for (let i in this.memory.creeps){
                var creep = this.memory.creeps[i];
                for (let j in Game.creeps){
                    var globalCreep = Game.creeps[j];
                    if(creep.name == globalCreep.name) {
                        aliveCreeps.push(creep);
                        continue;
                    }
                }
            }
            this.memory.creeps = aliveCreeps;
        } else {
            aliveCreeps = this.memory.creeps;
        }
        return aliveCreeps;
    } else {
        console.log(colorText('red', 'Tried getting alive creeps, but spawn got amnesia or have misunderstood'));
    }
};
StructureSpawn.prototype.getRequestsFrom = function(id){
    return _.filter(this.memory.spawnQueue, function(o) { return o.id == id});
}
