// Define a givers property on the Game.rooms object
var Giver = function(object){
    
}
var TaskGivers = {
    run : function(){
    }
    get : function(){
        console.log('get callled');
        if(_.isUndefined(this.givers)) {
            this.givers = [];
        }
        if(!_.isObject(Memory.givers)) {
            console.log('Not object');
            return undefined;
        }
        return this.givers || [];
    }
};
// Create givers
Object.defineProperty(Giver.prototype, 'givers', {
    get: function() {
        console.log('get callled');
        if(_.isUndefined(this.givers)) {
            this.givers = [];
        }
        if(!_.isObject(Memory.givers)) {
            console.log('Not object');
            return undefined;
        }
        return this.givers || [];
    },
    set: function(value){ this.memory.givers = value; }
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
