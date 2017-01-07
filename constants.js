"use strict";
// Normal actions
if(!Memory.constants) Memory.constants = {};

Memory.constants.actions = {
    ACTION_MOVE               : 30,
    ACTION_HARVEST            : 31,
    ACTION_TRANSFER           : 32,
    ACTION_BUILD              : 33,
    ACTION_REPAIR             : 34,
    ACTION_UPGRADE            : 35,
    ACTION_DROP               : 36,
    ACTION_PICKUP             : 37,
    ACTION_WITHDRAW           : 38,
    ACTION_DISMANTLE          : 39,
    ACTION_ATTACK             : 40,
    ACTION_ATTACK_CONTROLLER  : 41,
    ACTION_RANGED_ATTACK      : 42,
    ACTION_RANGED_MASS_ATTACK : 43,
    ACTION_HEAL               : 44,
    ACTION_RANGED_HEAL        : 45,
    ACTION_CLAIM              : 46,
    ACTION_RESERVE_CONTROLLER : 47,
    ACTION_SIGN               : 48,
    ACTION_SUICIDE            : 49
};

// Aggressive or defensive creeps
Memory.constants.tasks = {
    ASSAULT      : 51,
    DEFEND_CREEP : 52,
    GUARD_ROOM   : 53,
    GUARD_AREA   : 54,
    FLEE         : 55
};
