"use strict";
// Normal actions
var constantsAction = {
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
var constantsTasks = {
    ASSAULT      : 51,
    DEFEND_CREEP : 52,
    GUARD_ROOM   : 53,
    GUARD_AREA   : 54,
    FLEE         : 55
}

global.taskcode_string = {
    30   : 'moving',
    31   : 'harvesting',
    32   : 'transferring',
    33   : 'building',
    34   : 'repairing',
    35   : 'upgrading',
    36   : 'dropping',
    37   : 'picking up',
    38   : 'withdrawing',
    39   : 'dismantle',
    40   : 'claiming',
    51   : 'attacking',
    52   : 'defending creep',
    53   : 'guarding room',
    54   : 'guarding area',
    55   : 'fleeing'
};
