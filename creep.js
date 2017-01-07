
Creep.prototype.run = function(){
    this.checkStatus();
    this.updateMemory();

    this.action();
}
Creep.prototype.set = function(params){
    var target, taskCode;
    if(Object.prototype.toString.call(params) == '[object Object]'){
        // Check if objects are correct
        console.log(colorText('blue', this.name+' set is passed with object'));
        target   = params.target;
        taskCode = params.taskCode;

    } else if(typeof params == 'Number'){
        // Probably task code
        target = this.findTarget();
    } else {
        console.log(colorText('red', this.name+' neither got object nor number when setting task'));
        return false;
    }
    this.memory.task.target = {
        id  : target.id,
        pos : target.pos
    };
    this.memory.task.msg = "Performing task '"+findKey(global, taskCode)
                           +"' at"+target.pos.x +"x,"+target.pos.y+'y';
    this.memory.task.code = taskCode;
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
        case ERR_NOT_FOUND: break;
        // Ignore those
        // Importance: 0
        case ERR_BUSY:      break;
        // Creep is probably spawning
        // Importance: 0
        case ERR_NOT_ENOUGH_ENERGY:    break;
        // Creep doesn't have enough energy for this task
        // Importance: 2
        case ERR_NOT_ENOUGH_RESOURCES: break;
        // Creep doesn't have enough resources for this task
        // Importance: 2
        case ERR_INVALID_TARGET:       break;
        // Creep doesn't have a valid target
        // Importance: 5
        throw(new Error(this.name+' invalid target!'));
        case ERR_FULL:                 break;
        // Creep is full
        // Importance: 2
        case ERR_NOT_IN_RANGE: this.moveTo(Game.getObjectById(this.memory.task.target.id));  break;
        // Creep isn't in range to
        // Importance: 2
        case ERR_TIRED:                break;
        // Creep is tired/fatiqued
        // Importance: 1
        case ERR_NO_BODYPART:          break;
        // Creep lacks the proper bodypart
        // Importance: 4
        case OK:                       break;
        switch(this.memory.task.code) {
            case ACTION_HARVEST: console.log('orange', 'Successfully harvested'); break;
        }
        // Creep has done task successfully!
    }

}
Creep.prototype.performAction = function(){
    let target     = Game.getObjectById(this.memory.task.target.id),
        taskCode   = this.memory.task.code,
        params     = this.memory.task.params || null,
        paramsType = Object.prototype.toString.call(params);

    if((target == undefined || target == null) && taskCode != ACTION_SUICIDE) {
            throw(new Error(this.name+' target is undefined or null'));
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
    if(taskCode == undefined) throw(new Error(this.name+' task code is undefined'));
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
