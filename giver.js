// Define a givers property on the Game.rooms object
Room.prototype.givers = {};

Room.prototype.givers.run = function(){
    console.log("Hello from a giver!");
};
// Create givers
Object.defineProperty(Room.prototype, 'givers', {
    get: function() {
        console.log('get callled');
        if(_.isUndefined(this.memory.givers)) {
            this.memory.givers = [];
        }
        if(!_.isObject(this.memory.givers)) {
            console.log('Not object');
            return undefined;
        }
        return this.memory.givers || [];
    },
    set: function(value){
        console.log('set called');
    }
});
// Create a memory object on source prototypes
Object.defineProperty(Source.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(this.room.memory.sources)) {
            this.room.memory.sources = {};
        }
        if(!_.isObject(this.room.memory.sources)) {
            return undefined;
        }
        return this.room.memory.sources[this.id] = this.room.memory.sources[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(this.room.memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(this.room.memory.sources)) {
            throw new Error('Could not set source memory');
        }
        this.room.memory.sources[this.id] = value;
    }
});
