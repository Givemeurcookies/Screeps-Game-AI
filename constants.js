"use strict";
// Normal actions
if(!Memory.constants) Memory.constants = {};

Memory.constants.actions = {
    MOVE               : 30,
    HARVEST            : 31,
    TRANSFER           : 32,
    BUILD              : 33,
    REPAIR             : 34,
    UPGRADE            : 35,
    DROP               : 36,
    PICKUP             : 37,
    WITHDRAW           : 38,
    DISMANTLE          : 39,
    ATTACK             : 40,
    RANGED_ATTACK      : 42,
    RANGED_MASS_ATTACK : 43,
    HEAL               : 44,
    RANGED_HEAL        : 45,
    CLAIM              : 46
};

// Aggressive or defensive creeps
Memory.constants.tasks = {
    ASSAULT      : 51,
    DEFEND_CREEP : 52,
    GUARD_ROOM   : 53,
    GUARD_AREA   : 54,
    FLEE         : 55
};
