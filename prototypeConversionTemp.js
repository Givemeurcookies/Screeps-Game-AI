// This is just to keep control of some code change without cluttering main file before conversion

Creep.prototype.doTask = function(task, params){
    var targetGameobj = Game.getObjectById(this.memory.task.target.id);
    switch(task){
        case TRANSFER_TASK:
        if (this.carry == 0) {
            console.log(this.name+": Out of resources, finding new task");
            this.findTask();
        }

        var carryResult = this.transfer(targetGameobj, RESOURCE_ENERGY);

        if (carryResult == ERR_NOT_IN_RANGE) {
            if(!ssh) this.say("Carrying");
            if(this.pos.inRangeTo(targetGameobj, 5)){
                this.moveTo(targetGameobj, {
                    reusePath : 0
                });
            } else {
                this.doTask(MOVETO);
            }
        } else if(carryResult == 0){
            if(!ssh) this.say("Transfer");

            if (this.carry == 0) {
                console.log(this.name+": Out of resources, finding new task");
                this.findTask();
            } else if (targetGameobj.energy == targetGameobj.energyCapacity)
                if(this.setTask(TRANSFER_TASK) == -1) this.findTask();

            return true;
        } else {

            if(carryResult == -7){
                console.log("Invalid source:"+ (JSON.stringify(targetGameobj)));
                console.log("Source id:"+this.memory.task.target.id);
            } else if(carryResult == -6){
                // Creep doesn't have enough energy
                this.findTask();
            } else if (carryResult == -8){
                // Energy source is full
                // Give all creeps who's trying to transfer energy to this source a new task
                // this also includes the current creep
                var creepsWithSameTask = getCreepsWithTask(1, this.memory.task.target);
                for (var id in creepsWithSameTask){
                    var creepWithSameTask = creepsWithSameTask[id];
                    if(setTask(creepWithSameTask, TRANSFER_TASK) == -1){
                        findTask(creepsWithSameTask[id]);
                    }
                }

            } else {
                console.log(this.name+" got unhandled error when trying to transfer:"+carryResult);
            }
        }
        break;
        case HARVEST_TASK:
        // Check if energy capacity is full first

        if (_.sum(this.carry) == this.carryCapacity) {
            console.log(this.name+" done with harvesting, finding new task");
            this.findTask();
            return "done";
        } else {

            var harvestAttempt = this.harvest(targetGameobj);
            if(harvestAttempt == ERR_NOT_IN_RANGE) {
                if(this.pos.inRangeTo(targetGameobj, 5)){
                    this.moveTo(targetGameobj, {
                        reusePath : 0
                    });
                } else {
                    this.doTask(MOVETO);
                }
                return true;
            } else if(harvestAttempt == ERR_INVALID_TARGET) {
                this.say("-7");
                console.log(this.name+" invalid source when trying to harvest, harvestResult output:\n"+JSON.stringify(this.memory.target));
                return false;
            } else if(harvestAttempt == ERR_BUSY) {
                // Assume creep is still spawning
                //console.log(creep.name+" is still spawning, can't harvest");
                return true;
            } else if(harvestAttempt == ERR_NOT_ENOUGH_RESOURCES){

                this.findTask();
            } else {
                if(harvestAttempt == 0) {
                    this.say(Math.floor(_.sum(this.carry)/this.carryCapacity*100)+"%");
                    return true;
                }
                console.log(this.name+" got unhandled error right after giving new task of harvesting:"+harvestAttempt);
            }
        }
        break;
        case BUILD_TASK:
        if (this.carry == 0) {
            console.log(this.name+": Out of resources, finding new task");
            this.findTask();
        }

        var buildAttempt = this.build(targetGameobj);
        // Make code more readable
        /*switch(buildAttempt){
            case ERR_NOT_IN_RANGE: this.moveTo(targetGameobj); break;
            case ERR_NOT_ENOUGH_RESOURCES:
            case ERR_INVALID_TARGET:
            break;
            case ERR_RCL_NOT_ENOUGH:
            break;
            case OK: return true; break;
            default: console.log()
        }*/
        if(buildAttempt == ERR_NOT_IN_RANGE) {
            if (!ssh) this.say("Build");
            this.doTask(MOVETO);
        } else if (buildAttempt == ERR_NOT_ENOUGH_RESOURCES || buildAttempt == ERR_INVALID_TARGET){
            if(buildAttempt)
            this.findTask();
        } else if(buildAttempt == ERR_RCL_NOT_ENOUGH){
            // Building is blocked or is impossible to build
            this.setTask(UPGRADE_TASK);
        } else if(buildAttempt == OK){
            console.log(this.name+": BUILDING OK");
            return true;
        } else {
            console.log(this.name+": got error when building "+buildAttempt);
            return false;
        }
        break;
        case UPGRADE_TASK:
        if (this.carry == 0) this.findTask();

        var upgradeAttempt = this.upgradeController(targetGameobj);
        if(upgradeAttempt == ERR_NOT_IN_RANGE) {
            this.doTask(MOVETO);
        } else if (upgradeAttempt == ERR_NOT_ENOUGH_RESOURCES){
            // Creep is out of resources
            this.findTask();
        } else {
            //console.log(this.name+": possible error"+upgradeAttempt);
            return true;
        }
        break;
        case REPAIR_TASK:
        if (this.carry == 0) this.findTask();

        var repairAttempt = this.repair(targetGameobj);
            if(repairAttempt == ERR_NOT_IN_RANGE) {
                this.doTask(MOVETO);
            } else if (repairAttempt == ERR_NOT_ENOUGH_RESOURCES){
                this.findTask();
            } else if (repairAttempt == 0){
                if (!ssh) this.say("Repair");
                if (targetGameobj.hits == targetGameobj.hitsMax) this.findTask();
            } else if (repairAttempt == -7){
                console.log(this.name+" invalid source");
                this.findTask();
            } else {
                if (!ssh) this.say("Error");
                console.log(this.name+" got error when repairing, "+repairAttempt);
                return true;
            }
        break;
        case ATTACK_TASK:
        var attackAttempt = this.attack(targetGameobj);
        if(attackAttempt == ERR_NOT_IN_RANGE){
            this.doTask(MOVETO);
        } else {
            console.log(this.name+" attacking returned code:"+attackAttempt);
            if(attackAttempt == -7) {
                // Creep is dead or target is invalid
                this.findTask();
            }

        }
        break;
        case MOVETO:
        console.log(this.name+" (MOVETO): "+JSON.stringify(this.memory.task.target));
        if(this.memory.soldier) ScoutMove(this, task, params);
        else {
            var moveAttempt = this.moveTo(targetGameobj);
            if(moveAttempt != 0){
                console.log("Got error when trying to move"+moveAttempt);
            }
        }

        break;
        default:
        console.log(this.name+" type error:"+task);
        break;
    }
}
