"use strict";
// Normal actions
global.MOVE               = 30,
global.HARVEST            = 31,
global.TRANSFER           = 32,
global.BUILD              = 33,
global.REPAIR             = 34,
global.UPGRADE            = 35,
global.DROP               = 36,
global.PICKUP             = 37,
global.WITHDRAW           = 38,
global.DISMANTLE          = 39,
global.ATTACK             = 40,
global.RANGED_ATTACK      = 42,
global.RANGED_MASS_ATTACK = 43,
global.HEAL               = 44,
global.RANGED_HEAL        = 45;

// Aggressive or defensive creeps
global.CLAIM        = 40,
global.ASSAULT      = 51,
global.DEFEND_CREEP = 52,
global.GUARD_ROOM   = 53,
global.GUARD_AREA   = 54,
global.FLEE         = 55;

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
