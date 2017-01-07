
Creep.prototype.run = function(){
    this.checkStatus();
    this.updateMemory();

    this.set();
}
Creep.prototype.set = function(params){
    var target;
    if(typeof params == 'Object'){
        // Check if objects are correct
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
    this.memory.task.msg = "Performing task '"+taskcode_string[taskCode]
                           +"' at"+target.pos.x +"x,"+target.pos.y+'y';
    this.memory.task.code = taskCode;

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

    var actionReturn = this.performAction;

    switch(actionReturn){
        // Unhandled/silent cases
        case ERR_NOT_OWNER:
        case ERR_NO_PATH:
        case ERR_NOT_FOUND: break;
        // Ignore those
        case ERR_BUSY:      break;
        //
        case ERR_NOT_ENOUGH_ENERGY:    break;
        case ERR_NOT_ENOUGH_RESOURCES: break;
        case ERR_INVALID_TARGET:       break;
        case ERR_FULL:                 break;
        case ERR_NOT_IN_RANGE:         break;
        case ERR_TIRED:                break;
        case ERR_NO_BODYPART:           break;
    }

}
Creep.prototype.performAction = function(){
    let target     = Game.getObjectById(creep.memory.task.target.id),
        taskCode   = creep.memory.task.code,
        params     = creep.memory.task.params || null,
        paramsType = Object.prototype.toString.call(params);
    // Return the code when action is queued
    //if()
    switch(taskCode){
        case MOVE:     return this.moveTo(target, params);    break;
        case HARVEST:  return this.harvest(target);           break;
        case TRANSFER: return this.transfer(target);          break;
        case BUILD:    return this.build(target);             break;
        case REPAIR:   return this.repair(target);            break;
        case UPGRADE:  return this.upgradeController(target); break;
        case DROP:     if(paramsType == '[object Array]')
                            return this.drop(...params);
                       else
                            console.log(this.name
                                +" expected array when "
                                +taskcode_string[DROP]);
        break;
        case PICKUP: return this.pickup(target); break;

        case WITHDRAW: return this.withdraw(target, params);  break;
        case DISMANTLE: break;
        case CLAIM: break;
    }
}
Creep.prototype.actions = {

};
StructureSpawn.prototype.run = function(){
    console.log(colorText('green', this));
}
