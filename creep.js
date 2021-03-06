
Creep.prototype.run = function(){
    this.checkStatus();
    this.updateMemory();
    try{
        this.action();
    } catch(err) {
        console.log('When trying to run prototype for creep, encountered error:\n'+err.stack);
    }
}
Creep.prototype.set = function(params){
    var target, taskCode;
    if(Object.prototype.toString.call(params) == '[object Object]'){
        // Check if objects are correct
        console.log(colorText('blue', this.name+' set is passed with object'));
        target        = params.target;
        taskCode      = params.taskCode;
        commandParams = params.params;
        if(taskCode == undefined) {
            throw new Error(this.name+' - Missing taskCode from passed params output on next line:\n'+JSON.stringify(params));
        }
        switch(params.taskCode){
            case ACTION_TRANSFER:
            case ACTION_DROP:
            case ACTION_WITHDRAW:
                if(commandParams == undefined)
                    throw new Error(this.name+' - trying to set task but missing required args');
            break;
        }


    } else if(typeof params == 'number'){
        // Probably task code
        //target = this.findTarget();
        if(params == FREE){
            console.log(colorText('green', 'Freeing memory!'));
            this.memory.task = {
                target   : null,
                code : null,
                busy     : false
            };
            return;
        } else if (params == ACTION_SUICIDE){
            this.memory.task = {
                target   : null,
                code : params,
                busy     : true
            };
            this.memory.task.msg = "Committing suicide at "+this.pos.x+"x, "+this.pos.y+"y";
            return;
        }
    } else {
        console.log(colorText('red', this.name+' neither got object nor number when setting task, type is...\n'+
                    typeof params));
        return false;
    }
    console.log(colorText('orange',taskCode));
    this.memory.task.target = {
        id  : target.id,
        pos : target.pos
    };
    this.memory.task.msg = "Performing task '"+findKey(global, taskCode)
                           +"' at"+target.pos.x +"x,"+target.pos.y+'y';
    this.memory.task.code   = taskCode;
    this.memory.task.params = commandParams;
    this.memory.task.busy = true;
    this.action();
};
Creep.prototype.checkStatus = function(){
    // Basically check if all information in creep is valid
    this.memory.hits = this.memory.hits || this.hits;



}
Creep.prototype.updateMemory = function(){
    // Update memory that could've changed the last tick
    if(this.memory.hits != this.hits) {
        this.damaged(this.memory.hits-this.hits);
        this.memory.hits = this.hits;
    }
    if(!this.memory.task) {
        console.log(colorText('red', this.name+' had invalid task memory'));
        this.memory.task = {
            target : false,
            params : false,
            busy   : false
        };
    } else {
        this.memory.task.busy = this.memory.task.busy || false;
    }
}
Creep.prototype.damaged = function(amount){

    if(this.memory.isSoldier){
        // Do stuff is creep is soldier here
    } else {
        // Most likely FLEE
        this.set(FLEE);
    }
};
Creep.prototype.action = function(){
    if(this.memory.task.busy == false) return false;
    var actionReturn = this.performAction();

    // Error cases are handled by Importance
    // Doesn't do anything in the code, just to
    // prioritise errors
    console.log(colorText('green','Action code '+findKey(global, actionReturn)));

    switch(actionReturn){
        // Unhandled/silent cases
        case ERR_NOT_OWNER:
        case ERR_NO_PATH:
        case ERR_NOT_FOUND:
        // Ignore those
        // Importance: 0
        break;
        case ERR_BUSY:
        // Creep is probably spawning
        // Importance: 0
        break;
        case ERR_NOT_ENOUGH_ENERGY:
        // Creep doesn't have enough energy for this task
        // Free creep from current task
        // Should probably log this as it's not supposed
        // to happen.
        // Importance: 2
        this.set(FREE);
        break;
        case ERR_NOT_ENOUGH_RESOURCES:
        // Creep doesn't have enough resources for this task
        // Importance: 2
        break;
        case ERR_INVALID_TARGET:
        // Creep doesn't have a valid target
        // Importance: 5
        throw(new Error(this.name+' invalid target!'));
        break;
        case ERR_FULL:
        // Creep is full
        // Importance: 2
        break;
        case ERR_NOT_IN_RANGE:
        // Creep isn't in range to
        // Importance: 2
        this.moveTo(Game.getObjectById(this.memory.task.target.id));
        break;
        case ERR_TIRED:
        // Creep is tired/fatiqued
        // Importance: 1
        break;
        case ERR_NO_BODYPART:
        // Creep lacks the proper bodypart
        // Importance: 4
        break;
        case OK:
        // Creep has done task successfully!
        switch(this.memory.task.code) {
            case ACTION_HARVEST:
                console.log(colorText('orange', 'Successfully harvested'));
                if(_.sum(this.carry) == this.carryCapacity){
                    // Storage for creep is full, let's do something
                    this.set({
                        taskCode : ACTION_TRANSFER,
                        target   : this.pos.findClosestByRange(FIND_MY_SPAWNS),
                        busy     : true,
                        params   : [RESOURCE_ENERGY]
                    });
                }
            break;
            case ACTION_TRANSFER:
            case ACTION_UPGRADE:
                console.log(colorText('orange', 'Successfully '+findKey(global, this.memory.task.code)));
                // Let's eventually make this per resource
                if(_.sum(this.carry) == 0){
                    this.set(FREE);
                }
            break;
            case ACTION_SUICIDE:
                this.say("SEPUKU", true);
            break;
        }
        break;
    }

}
Creep.prototype.performAction = function(){
    // Try and catch block here for gameObj possibly
    let target     = this.memory.task.target,
        taskCode   = this.memory.task.code,
        params     = this.memory.task.params || [],
        paramsType = Object.prototype.toString.call(params);

    if((target == undefined || target == null) && taskCode != ACTION_SUICIDE) {
        throw(new Error(this.name+' target is undefined or null, task code is '+findKey(global, taskCode)));
    } else {
        if(taskCode != ACTION_SUICIDE)
            target = Game.getObjectById(target.id);
    }
    // Return the code when action is queued
    switch(taskCode){
        case ACTION_ATTACK:             return this.attack(target);            break;
        case ACTION_ATTACK_CONTROLLER:  return this.attackController(target);  break;
        case ACTION_BUILD:              return this.build(target);             break;
        case ACTION_CLAIM:              return this.claimController(target);   break;
        case ACTION_DISMANTLE:          return this.dismantle(target);         break;
        case ACTION_DROP:
            if(paramsType == '[object Array]')
                return this.drop(...params);
            else
                throw(new Error(this.name
                                +" expected array when performing "
                                +findKey(Memory.constants.actions, taskCode)));
        break;
        case ACTION_HARVEST:            return this.harvest(target);                   break;
        case ACTION_HEAL:               return this.heal(target);                      break;

        case ACTION_MOVE:               return this.moveTo(target, params);            break;
        case ACTION_PICKUP:             return this.pickup(target);                    break;

        case ACTION_RANGED_ATTACK:      return this.rangedAttack(target);              break;
        case ACTION_RANGED_HEAL:        return this.rangedHeal(target);                break;
        case ACTION_RANGED_MASS_ATTACK: return this.rangedMassAttack();                break;

        case ACTION_REPAIR:             return this.repair(target);                    break;
        case ACTION_RESERVE_CONTROLLER: return this.reserveController(target);         break;
        case ACTION_SIGN:               return this.signController(target, ...params); break;
        case ACTION_SUICIDE:            return this.suicide();                         break;
        case ACTION_TRANSFER:           return this.transfer(target, ...params);       break;
        case ACTION_UPGRADE:            return this.upgradeController(target);         break;
        case ACTION_WITHDRAW:           return this.withdraw(target, ...params);       break;
    }
    // Code hasn't returned, assume something is wrong
    // Start checking taskCode
    if(taskCode == undefined) throw new Error(this.name+' task code is undefined');
}
Creep.prototype.actions = {

};
function findKey(obj, value) {
    for( var prop in obj ) {
        if( obj.hasOwnProperty(prop) ) {
             if( obj[prop] === value )
                 return prop;
        }
    }
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
